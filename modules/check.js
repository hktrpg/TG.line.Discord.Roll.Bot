"use strict";

const notChannel = "這裡不是群組，這是頻道功能，需要在頻道上使用。\n\n";
const notAdmin = "你沒有相關權限，禁止使用這功能。\n你需要有群組管理員權限。\n\n";
const notManager = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或群組管理員權限。\n\n";
const notDiscord = "這是Discord限定功能。\n\n"

const role = {
    ban: -1,
    nothing: 0,
    user: 1,
    dm: 2,
    admin: 3,
    superAdmin: 4,
}

function isChannel(gid) {
    return !!gid;
}

function isAdmin(user) {
    return (user === role.admin) ||
    (user === role.superAdmin);
}

function isManager(user) {
    return (user === role.dm) ||
    (user === role.admin) ||
    (user === role.superAdmin);
}

function isDiscord(botname) {
    return (botname === "Discord");
}

module.exports = {
    isChannel,
    isAdmin,
    isManager,
    isDiscord,
    role,
    notChannel,
    notAdmin,
    notManager,
    notDiscord
};