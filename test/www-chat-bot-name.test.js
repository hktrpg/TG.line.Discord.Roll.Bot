'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test.each(['a'.repeat(50), 'a'.repeat(39) + '😀' + 'b'.repeat(9)])(
    'bot replies remain valid with a long user name', async name => {
        const source = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
        const start = source.indexOf('async function loadb(');
        const end = source.indexOf('\nif (io) {', start);
        if (start === -1 || end === -1) throw new Error('bot reply handler not found');
        const loadb = new vm.Script(`${source.slice(start, end)}\nloadb`).runInNewContext({ Date, String });
        const records = { chatRoomPush: jest.fn(async msg => {
            if (msg.name.length > 50 || /[\uD800-\uDBFF]$/.test(msg.name)) throw new Error('invalid bot name');
            return { ...msg, _id: 'id' };
        }) };
        const emit = jest.fn();
        const io = { to: jest.fn(() => ({ emit })) };
        await loadb(io, records, { text: 'result' }, { name, time: new Date(), roomNumber: 'room' });
        expect(records.chatRoomPush).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('room', expect.objectContaining({ _id: 'id' }));
    }
);
