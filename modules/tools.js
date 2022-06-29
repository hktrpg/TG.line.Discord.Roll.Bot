"use strict";
const notChannel = "這裡不是群組，這是頻道功能，需要在頻道上使用。\n\n";
const notAdmin = "你沒有相關權限，禁止使用這功能。\n你需要有群組管理員權限。\n\n";
const notManager = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或群組管理員權限。\n\n";
const notDiscord = "這是Discord限定功能。\n\n"
function __checkIsChannel(groupid) {
    if (!groupid) {
        return notChannel;
    }
    return '';
}
function __checkIsAdmin(userRole) {
    if (userRole < 3) {
        return notAdmin;
    }
    return '';
}
function __checkIsManager(userRole) {
    if (userRole < 2) {
        return notManager;
    }
    return '';
}

function __checkIsDiscord(botname) {
    if (botname !== "Discord") {
        return notDiscord;
    }
    return '';
}

module.exports = {
    __checkIsChannel,
    __checkIsAdmin,
    __checkIsManager,
    __checkIsDiscord
};