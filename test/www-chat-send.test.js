'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const server = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
const start = server.indexOf('socket.on("send", safeSocketHandler');
const end = server.indexOf('let roomJoinChain = Promise.resolve();', start);
if (start === -1 || end === -1) throw new Error('send handler not found');
const serverScript = new vm.Script(server.slice(start, end));

function makeServer({ limited = false, valid = true, saveFails = false } = {}) {
    let handler;
    const socket = { handshake: { address: 'test' }, on: (_event, fn) => { handler = fn; }, emit: jest.fn() };
    const records = { chatRoomPush: saveFails ? jest.fn().mockRejectedValue(new Error('write unavailable')) : jest.fn().mockResolvedValue({}) };
    const security = { validateChatMessage: () => valid
        ? { valid: true, data: { name: 'Tester', msg: 'hello', roomNumber: 'room' } }
        : { valid: false, error: 'Invalid name' } };
    serverScript.runInNewContext({ socket, records, security, safeSocketHandler: (_name, fn) => fn,
        limitRaterChatRoom: async () => limited, getUserFriendlyError: () => 'invalid',
        i18n: { normalizeLocale: () => 'zh-tw' }, console: { warn() {}, error() {} }, Date, JSON });
    return { handler, socket, records };
}

test('successful send saves once and acknowledges success', async () => {
    const { handler, records } = makeServer();
    const ack = jest.fn();
    await handler({ lang: 'zh-tw' }, ack);
    expect(records.chatRoomPush).toHaveBeenCalledTimes(1);
    expect(records.chatRoomPush).toHaveBeenCalledWith(expect.objectContaining({ msg: '\nhello', roomNumber: 'room' }));
    expect(ack.mock.calls[0][0].ok).toBe(true);
});

test.each([{ limited: true }, { valid: false }])('known rejection does not write and acknowledges rejected', async options => {
    const { handler, records } = makeServer(options);
    const ack = jest.fn();
    await handler({}, ack);
    expect(records.chatRoomPush).not.toHaveBeenCalled();
    expect(ack.mock.calls[0][0].code).toBe('rejected');
});

test('database failure reports unconfirmed instead of claiming rejection', async () => {
    const { handler } = makeServer({ saveFails: true });
    const ack = jest.fn();
    await handler({}, ack);
    expect(ack.mock.calls[0][0].code).toBe('unconfirmed');
});

test('older clients may send without an acknowledgement callback', async () => {
    const { handler, records } = makeServer();
    await expect(handler({})).resolves.toBeUndefined();
    expect(records.chatRoomPush).toHaveBeenCalledTimes(1);
});

const html = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf8').replaceAll('\r\n', '\n');
const formStart = html.indexOf('sendForm.addEventListener("submit", async (e) => {');
const formEnd = html.indexOf('\n                });\n            },', formStart);
if (formStart === -1 || formEnd === -1) throw new Error('send form not found');
const formScript = new vm.Script(html.slice(formStart, formEnd + '\n                });'.length));

function makeClient({ connected = true, readyRoom = 'room', reply = async () => ({ ok: true }) } = {}) {
    let submit;
    const sendForm = { addEventListener: (_event, fn) => { submit = fn; } };
    const msgInput = { value: 'typed message' };
    const socket = { connected, timeout: jest.fn().mockReturnThis(), emitWithAck: jest.fn(reply) };
    const context = { sendForm, msgInput, nameInput: { value: 'Tester' },
        state: { socket, readyRoom }, chatroomManager: { currentRoom: 'room' },
        CONFIG: { PERSONAL_ROOM: 'personal' }, getPageLocale: () => 'zh-tw',
        securityManager: { canSubmit: () => ({ allowed: true }), validateInput: msg => ({ valid: true, sanitized: msg }),
            checkRateLimit: () => ({ allowed: true }), setSubmitting: jest.fn() },
        rt: key => key, console: { warn() {}, error() {} }, alert: jest.fn(),
        utils: { setLocalStorage: jest.fn() }, uiManager: { autoResizeTextarea() {}, updateCharCount() {} }, Date };
    formScript.runInNewContext(context);
    return { submit: () => submit({ preventDefault() {} }), msgInput, socket, context };
}

test.each([{ connected: false }, { readyRoom: null }])('unavailable connection retains text and does not queue a send', async options => {
    const { submit, msgInput, socket, context } = makeClient(options);
    await submit();
    expect(msgInput.value).toBe('typed message');
    expect(socket.emitWithAck).not.toHaveBeenCalled();
    expect(context.alert).toHaveBeenCalledWith('roll_room_unavailable');
    expect(context.securityManager.setSubmitting).toHaveBeenLastCalledWith(false);
});

test('successful confirmation clears only the submitted text', async () => {
    const { submit, msgInput } = makeClient();
    await submit();
    expect(msgInput.value).toBe('');
});

test('editing while confirmation is pending preserves the new draft', async () => {
    let confirm;
    const { submit, msgInput } = makeClient({ reply: () => new Promise(resolve => { confirm = resolve; }) });
    const sending = submit();
    msgInput.value = 'new draft';
    confirm({ ok: true });
    await sending;
    expect(msgInput.value).toBe('new draft');
});

test('acknowledgement timeout preserves text and reports an uncertain result', async () => {
    const { submit, msgInput, context } = makeClient({ reply: async () => { throw new Error('timeout'); } });
    await submit();
    expect(msgInput.value).toBe('typed message');
    expect(context.alert).toHaveBeenCalledWith('roll_send_unconfirmed');
});
