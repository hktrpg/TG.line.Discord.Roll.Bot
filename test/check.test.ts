"use strict";

// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const chk = require('../modules/check');

const NOT_CHANNEL = "這裡不是群組，這是頻道功能，需要在頻道上使用。\n\n";
const NOT_ADMIN = "你沒有相關權限，禁止使用這功能，\n你需要有群組管理員權限。\n\n";
const NOT_MANAGER = "你沒有相關權限，禁止使用這功能，\n你需要有管理此頻道的權限或群組管理員權限。\n\n";
const NOT_DISCORD = "這是Discord限定功能。\n\n"

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkGuild is not channel not admin', () => {
    let arg = {
        flag: chk.flag.ChkGuild,
        gid: 0,
        role: chk.role.ban,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_ADMIN);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkGuild is channel not admin', () => {
    let arg = {
        flag: chk.flag.ChkGuild,
        gid: 1,
        role: chk.role.ban,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_ADMIN);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkGuild is not channel but admin', () => {
    let arg = {
        flag: chk.flag.ChkGuild,
        gid: 0,
        role: chk.role.admin,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkGuild is channel and admin', () => {
    let arg = {
        flag: chk.flag.ChkGuild,
        gid: 0,
        role: chk.role.admin,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannel is channel', () => {
    let arg = {
        flag: chk.flag.ChkChannel,
        gid: 1,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe('');
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannel not channel', () => {
    let arg = {
        flag: chk.flag.ChkChannel,
        gid: 0,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelManager is not channel and not Manager', () => {
    let arg = {
        flag: chk.flag.ChkChannelManager,
        gid: 0,
        role: chk.role.user,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_MANAGER);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelManager is channel but not Manager', () => {
    let arg = {
        flag: chk.flag.ChkChannelManager,
        gid: 1,
        role: chk.role.user,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_MANAGER);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelManager is not channel but Manager', () => {
    let arg = {
        flag: chk.flag.ChkChannelManager,
        gid: 0,
        role: chk.role.dm,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelManager is channel and Manager', () => {
    let arg = {
        flag: chk.flag.ChkChannelManager,
        gid: 1,
        role: chk.role.dm,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe('');
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelAdmin is not channel and not admin', () => {
    let arg = {
        flag: chk.flag.ChkChannelAdmin,
        gid: 0,
        role: chk.role.dm,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_ADMIN);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelAdmin is channel but not admin', () => {
    let arg = {
        flag: chk.flag.ChkChannelAdmin,
        gid: 1,
        role: chk.role.dm,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_ADMIN);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelAdmin is not channel but admin', () => {
    let arg = {
        flag: chk.flag.ChkChannelAdmin,
        gid: 0,
        role: chk.role.admin,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkChannelAdmin is channel and admin', () => {
    let arg = {
        flag: chk.flag.ChkChannelAdmin,
        gid: 1,
        role: chk.role.admin,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe('');
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is not channel and not manager and not bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 0,
        role: chk.role.user,
        name: 'hktrpg',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_MANAGER + NOT_DISCORD);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is channel, manager and bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 1,
        role: chk.role.dm,
        name: 'Discord',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe('');
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is channel and not manager and not bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 1,
        role: chk.role.user,
        name: 'hktrpg',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_MANAGER + NOT_DISCORD);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is channel and manager but not bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 1,
        role: chk.role.dm,
        name: 'hktrpg',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_DISCORD);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is channel and bot but not manager', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 1,
        role: chk.role.user,
        name: 'Discord',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_MANAGER);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is not channel and manager but bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 0,
        role: chk.role.user,
        name: 'Discord',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_MANAGER);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is not channel but manager and bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 0,
        role: chk.role.dm,
        name: 'Discord',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkBot is manager but not channel and bot', () => {
    let arg = {
        flag: chk.flag.ChkBot,
        gid: 0,
        role: chk.role.dm,
        name: 'hktrpg',
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_CHANNEL + NOT_DISCORD);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkManager is not manager', () => {
    let arg = {
        flag: chk.flag.ChkManager,
        role: chk.role.user,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe(NOT_MANAGER);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test permissionErrMsg ChkManager is manager', () => {
    let arg = {
        flag: chk.flag.ChkManager,
        role: chk.role.dm,
    };
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(chk.permissionErrMsg(arg)).toBe('');
});
