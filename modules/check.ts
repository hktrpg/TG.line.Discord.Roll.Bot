"use strict";

const __notChannel = "這裡不是群組，這是頻道功能，需要在頻道上使用。\n\n";
const __notAdmin = "你沒有相關權限，禁止使用這功能，\n你需要有群組管理員權限。\n\n";
const __notManager = "你沒有相關權限，禁止使用這功能，\n你需要有管理此頻道的權限或群組管理員權限。\n\n";
const __notDiscord = "這是Discord限定功能。\n\n"

const role = {
    ban: -1,
    nothing: 0,
    user: 1,
    dm: 2,
    admin: 3,
    superAdmin: 4,
}

const __flag = {
    Channel: 0x1,
    Admin: 0x2,
    Manager: 0x4,
    Discord: 0x8,
}

const flag = {
    ChkGuild: __flag.Channel | __flag.Admin,
    ChkChannel: __flag.Channel,
    ChkChannelManager: __flag.Channel | __flag.Manager,
    ChkChannelAdmin: __flag.Channel | __flag.Admin,
    ChkBot: __flag.Channel | __flag.Manager | __flag.Discord,
    ChkManager: __flag.Manager,
}

function __isChannel(gid: any) {
    return !!gid;
}

function __isAdmin(user: any) {
    return (user === role.admin) ||
        (user === role.superAdmin);
}

function __isManager(user: any) {
    return (user === role.dm) ||
        (user === role.admin) ||
        (user === role.superAdmin);
}

function __isDiscord(botName: any) {
    return (botName === "Discord");
}

function permissionErrMsg(arg: any) {
    let msg = "";

    if ((arg.flag & 0x1) && !__isChannel(arg.gid))
        msg += __notChannel;

    if ((arg.flag & 0x2) && !__isAdmin(arg.role))
        msg += __notAdmin;

    if ((arg.flag & 0x4) && !__isManager(arg.role))
        msg += __notManager;

    if ((arg.flag & 0x8) && !__isDiscord(arg.name))
        msg += __notDiscord;

    return msg;
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    role,
    flag,
    permissionErrMsg,
};