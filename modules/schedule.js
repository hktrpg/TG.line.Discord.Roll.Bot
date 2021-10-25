/**
 * 對schedule 中發佈的文字進行處理
 *
 * 先擲骰一次
 *
 * 有沒有結果，也把內容進行REPLACE
 * 支援{}類置換，
 * 
 */

const discordSchedule = require('./discord_bot');
//discordSchedule.scheduleAtMessage


function scheduleSettup({ date, text, id, botname }) {
    switch (botname) {
        case 'Discord':
            console.log('AA')
            discordSchedule.scheduleAtMessage({ date, text, channelid: id })
            break;

        default:
            break;
    }
}

module.exports = {
    scheduleSettup
};