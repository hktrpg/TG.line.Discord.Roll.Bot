"use strict";

// Compatibility only. Legacy .translate settings never activate the new service.
// Automatic translation now lives in discord/chatroom-service and requires explicit
// /chatroom translate consent plus deployment/provider configuration.
module.exports = {
    translateChecker: () => false,
    translateText: async inputStr => inputStr,
    translateSwitchOn: () => {},
    translateSwitchOff: () => {}
};
