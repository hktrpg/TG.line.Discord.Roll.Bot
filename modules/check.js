"use strict";

const i18n = require('./i18n.js');

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

function __isChannel(gid) {
    return !!gid;
}

function __isAdmin(user) {
    return (user === role.admin) ||
        (user === role.superAdmin);
}

function __isManager(user) {
    return (user === role.dm) ||
        (user === role.admin) ||
        (user === role.superAdmin);
}

function __isDiscord(botName) {
    return (botName === "Discord");
}

function permissionErrMsg(arg) {
    const t = arg.t || i18n.createTranslator(arg.locale || i18n.DEFAULT_LOCALE);
    let msg = "";

    if ((arg.flag & 0x1) && !__isChannel(arg.gid))
        msg += t('common.permission.not_channel');

    if ((arg.flag & 0x2) && !__isAdmin(arg.role))
        msg += t('common.permission.not_admin');

    if ((arg.flag & 0x4) && !__isManager(arg.role))
        msg += t('common.permission.not_manager');

    if ((arg.flag & 0x8) && !__isDiscord(arg.name))
        msg += t('common.permission.not_discord');

    return msg;
}

module.exports = {
    role,
    flag,
    permissionErrMsg,
};