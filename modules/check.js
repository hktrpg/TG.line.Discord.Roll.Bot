"use strict";
const notChannel = "這裡不是群組，這是頻道功能，需要在頻道上使用。\n\n";
const notAdmin = "你沒有相關權限，禁止使用這功能。\n你需要有群組管理員權限。\n\n";
const notManager = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或群組管理員權限。\n\n";
const notDiscord = "這是Discord限定功能。\n\n"
function isChannel(groupid) {
    if (groupid) return true;
    else return false;
}
function isAdmin(userRole) {
    if (userRole < 3) {
        return false;
    }
    else return true;
}
function isManager(userRole) {
    if (userRole < 2) {
        return false;
    }
    else return true;
}

function isDiscord(botname) {
    if (botname === "Discord") {
        return true;
    }
    else return false;
}

module.exports = {
    isChannel,
    isAdmin,
    isManager,
    isDiscord,
    notChannel,
    notAdmin,
    notManager,
    notDiscord
};