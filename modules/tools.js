"use strict";
const notChannel = "這裡不是群組，如果想使用這指令，請在群組中";
const notAdmin = "如果想使用這指令，需要Admin權限";
function __checkIsChannel(groupid) {
    if (!groupid) {
        return notChannel;
    }
    return '';
}
function __checkAdmin(userRole) {
    if (userRole < 3) {
        return notAdmin;
    }
    return '';
}


module.exports = {
    __checkIsChannel,
    __checkAdmin
};