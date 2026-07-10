'use strict';

/**
 * Minimal binary plist (bplist00) writer for iOS Shortcut files.
 * No external dependencies — safe for Docker images that only sync app code.
 */
function createBinaryPlist(object) {
    const objects = [];

    function addObject(value) {
        const type = typeof value;
        if (value === null || value === undefined) {
            return addRaw({ kind: 'null' });
        }
        if (type === 'boolean') {
            return addRaw({ kind: 'bool', value });
        }
        if (type === 'number') {
            if (Number.isInteger(value)) {
                return addRaw({ kind: 'int', value });
            }
            return addRaw({ kind: 'real', value });
        }
        if (type === 'string') {
            return addRaw({ kind: 'string', value });
        }
        if (Array.isArray(value)) {
            const marker = { kind: 'array', items: null };
            const id = addRaw(marker);
            marker.items = value.map(item => addObject(item));
            return id;
        }
        if (type === 'object') {
            const marker = { kind: 'dict', keys: null, values: null };
            const id = addRaw(marker);
            const keys = Object.keys(value);
            marker.keys = keys.map(key => addObject(key));
            marker.values = keys.map(key => addObject(value[key]));
            return id;
        }
        throw new Error(`Unsupported plist type: ${type}`);
    }

    function addRaw(entry) {
        const id = objects.length;
        objects.push(entry);
        return id;
    }

    addObject(object);

    const refSize = sizeNeeded(objects.length);
    const objectBuffers = objects.map(serializeObject);
    const offsetSize = sizeNeeded(Buffer.concat(objectBuffers).length + 8);
    const header = Buffer.from('bplist00');

    const offsets = [];
    let offset = header.length;
    for (const buf of objectBuffers) {
        offsets.push(offset);
        offset += buf.length;
    }

    const offsetTableOffset = offset;
    const offsetTable = Buffer.alloc(offsets.length * offsetSize);
    offsets.forEach((value, index) => {
        writeUint(offsetTable, index * offsetSize, offsetSize, value);
    });

    const trailer = Buffer.alloc(32);
    trailer[6] = offsetSize;
    trailer[7] = refSize;
    writeUint(trailer, 8, 8, objects.length);
    writeUint(trailer, 16, 8, 0); // top object is 0
    writeUint(trailer, 24, 8, offsetTableOffset);

    return Buffer.concat([header, ...objectBuffers, offsetTable, trailer]);

    function serializeObject(entry) {
        switch (entry.kind) {
            case 'null':
                return Buffer.from([0x00]);
            case 'bool':
                return Buffer.from([entry.value ? 0x09 : 0x08]);
            case 'int':
                return serializeInt(entry.value);
            case 'real': {
                const buf = Buffer.alloc(9);
                buf[0] = 0x23; // real, 8 bytes
                buf.writeDoubleBE(entry.value, 1);
                return buf;
            }
            case 'string':
                return serializeString(entry.value);
            case 'array': {
                const marker = packCount(0xA0, entry.items.length);
                const refs = Buffer.alloc(entry.items.length * refSize);
                entry.items.forEach((id, index) => {
                    writeUint(refs, index * refSize, refSize, id);
                });
                return Buffer.concat([marker, refs]);
            }
            case 'dict': {
                const count = entry.keys.length;
                const marker = packCount(0xD0, count);
                const keyRefs = Buffer.alloc(count * refSize);
                const valueRefs = Buffer.alloc(count * refSize);
                for (let i = 0; i < count; i++) {
                    writeUint(keyRefs, i * refSize, refSize, entry.keys[i]);
                    writeUint(valueRefs, i * refSize, refSize, entry.values[i]);
                }
                return Buffer.concat([marker, keyRefs, valueRefs]);
            }
            default:
                throw new Error(`Unknown plist kind: ${entry.kind}`);
        }
    }

    function serializeInt(value) {
        if (value < 0) {
            const buf = Buffer.alloc(9);
            buf[0] = 0x13;
            buf.writeBigInt64BE(BigInt(value), 1);
            return buf;
        }
        if (value <= 0xFF) {
            return Buffer.from([0x10, value]);
        }
        if (value <= 0xFFFF) {
            const buf = Buffer.alloc(3);
            buf[0] = 0x11;
            buf.writeUInt16BE(value, 1);
            return buf;
        }
        if (value <= 0xFFFF_FFFF) {
            const buf = Buffer.alloc(5);
            buf[0] = 0x12;
            buf.writeUInt32BE(value, 1);
            return buf;
        }
        const buf = Buffer.alloc(9);
        buf[0] = 0x13;
        buf.writeBigUInt64BE(BigInt(value), 1);
        return buf;
    }

    function serializeString(value) {
        const isAscii = /^[\x00-\x7F]*$/.test(value);
        if (isAscii) {
            const data = Buffer.from(value, 'ascii');
            return Buffer.concat([packCount(0x50, data.length), data]);
        }
        const data = Buffer.alloc(value.length * 2);
        for (let i = 0; i < value.length; i++) {
            data.writeUInt16BE(value.charCodeAt(i), i * 2);
        }
        return Buffer.concat([packCount(0x60, value.length), data]);
    }

    function packCount(type, count) {
        if (count < 15) {
            return Buffer.from([type | count]);
        }
        return Buffer.concat([Buffer.from([type | 0x0F]), serializeInt(count)]);
    }
}

function sizeNeeded(value) {
    if (value < 256) return 1;
    if (value < 65_536) return 2;
    if (value < 4_294_967_296) return 4;
    return 8;
}

function writeUint(buffer, offset, size, value) {
    if (size === 1) buffer.writeUInt8(value, offset);
    else if (size === 2) buffer.writeUInt16BE(value, offset);
    else if (size === 4) buffer.writeUInt32BE(value, offset);
    else buffer.writeBigUInt64BE(BigInt(value), offset);
}

function buildBusEtaShortcut(speakUrl, shortcutName = '巴士到站朗讀') {
    const workflow = {
        WFWorkflowClientVersion: '1300.0.0',
        WFWorkflowClientRelease: '3.0',
        WFWorkflowMinimumClientVersion: 900,
        WFWorkflowMinimumClientVersionString: '900',
        WFWorkflowIcon: {
            WFWorkflowIconStartColor: 2_071_128_575,
            WFWorkflowIconGlyphNumber: 59_511
        },
        WFWorkflowTypes: ['NCWidget', 'WatchKit'],
        WFWorkflowInputContentItemClasses: [
            'WFStringContentItem',
            'WFURLContentItem'
        ],
        WFWorkflowName: String(shortcutName || '巴士到站朗讀'),
        WFWorkflowActions: [
            {
                WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
                WFWorkflowActionParameters: {
                    WFCommentActionText: `HKTRPG ${shortcutName}`
                }
            },
            {
                WFWorkflowActionIdentifier: 'is.workflow.actions.url',
                WFWorkflowActionParameters: {
                    WFURLActionURL: String(speakUrl)
                }
            },
            {
                WFWorkflowActionIdentifier: 'is.workflow.actions.downloadurl',
                WFWorkflowActionParameters: {
                    WFHTTPMethod: 'GET',
                    Advanced: false,
                    ShowHeaders: false
                }
            },
            {
                WFWorkflowActionIdentifier: 'is.workflow.actions.speaktext',
                WFWorkflowActionParameters: {
                    WFSpeakTextLanguage: 'zh-HK',
                    WFSpeakTextRate: 0.5,
                    WFSpeakTextWait: true
                }
            }
        ]
    };

    return createBinaryPlist(workflow);
}

module.exports = {
    buildBusEtaShortcut,
    createBinaryPlist
};
