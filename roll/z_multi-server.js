"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET && process.env.ROLL_WORKER_MODE !== 'true') {
    return;
}
const variables = {};
const { PermissionsBitField } = require('discord.js');
const VIP = require('../modules/patreon/veryImportantPerson');
const schema = require('../modules/db/schema.js')
const multiServer = require('../modules/discord/multi-server')
const { getT, resolveHelp, resolveGameName } = require('../modules/i18n/roll-i18n.js');
const rollbase = require('./rollbase.js');
const FUNCTION_LIMIT = [0, 1, 1, 1, 1, 1, 1, 1];
const gameName = function (params = {}) {
    return resolveGameName(params, 'chatroom.game_name', '【同步聊天】.chatroom');
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.chatroom$/i,
        second: null
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'chatroom.help');
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    channelid,
    discordClient,
    chatroomChannelMeta,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const needLiveOrMeta = (process.env.ROLL_WORKER_MODE === 'true' && !discordClient && !chatroomChannelMeta?.guildId);

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage(i18nParams);
            rply.quotes = true;
            return rply;
        }
        case /^create$/i.test(mainMsg[1]) && /^\S/.test(mainMsg[2]): {
            if (needLiveOrMeta) {
                return { needsLocal: true, moduleName: 'z_multi-server' };
            }
            try {
                if (groupid) return;
                let lv = await VIP.viplevelCheckUser(userid);
                let limit = FUNCTION_LIMIT[lv];
                if (limit <= 0) return;

                let guildId;
                let guildName;
                let channelName;
                const targetChannelId = mainMsg[2];

                if (chatroomChannelMeta?.guildId) {
                    if (!chatroomChannelMeta.allowed) return;
                    if (String(chatroomChannelMeta.channelId) !== String(targetChannelId)) {
                        return { needsLocal: true, moduleName: 'z_multi-server' };
                    }
                    guildId = chatroomChannelMeta.guildId;
                    guildName = chatroomChannelMeta.guildName;
                    channelName = chatroomChannelMeta.channelName;
                } else {
                    const channel = await discordClient.channels.fetch(targetChannelId)
                    const member = await channel.guild.members.fetch(userid)
                    const role = channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageChannels)
                    if (!role) return;
                    guildId = channel.guildId;
                    guildName = channel.guild.name;
                    channelName = channel.name;
                }

                const d = new Date();
                const time = d.getTime();
                const num = rollbase.Dice(100_000_000);
                const multiId = `${time}_${num}`
                await schema.multiServer.findOneAndUpdate({ guildID: guildId }, {
                    channelid: targetChannelId,
                    multiId,
                    guildID: guildId,
                    guildName,
                    channelName,
                    botname
                }, { upsert: true }).catch(error => {
                    console.error('[Multi-Server] MongoDB error:', error.name, error.reason)
                    return
                });
                await multiServer.getRecords();
                rply.text = translate('chatroom.create_success', {
                    guild: guildName,
                    channel: channelName
                });
                return rply;
            } catch {
                console.error('[Multi-Server] Create error')
            }
            return
        }
        case /^join$/i.test(mainMsg[1]) && /^\S/.test(mainMsg[2]) && /^\S/.test(mainMsg[3]): {
            if (needLiveOrMeta) {
                return { needsLocal: true, moduleName: 'z_multi-server' };
            }
            try {
                if (groupid) return;
                let lv = await VIP.viplevelCheckUser(userid);
                let limit = FUNCTION_LIMIT[lv];
                if (limit <= 0) return;

                const multiId = mainMsg[2];
                const targetChannelId = mainMsg[3];
                let guildId;
                let guildName;
                let channelName;

                if (chatroomChannelMeta?.guildId) {
                    if (!chatroomChannelMeta.allowed) return;
                    if (String(chatroomChannelMeta.channelId) !== String(targetChannelId)) {
                        return { needsLocal: true, moduleName: 'z_multi-server' };
                    }
                    guildId = chatroomChannelMeta.guildId;
                    guildName = chatroomChannelMeta.guildName;
                    channelName = chatroomChannelMeta.channelName;
                } else {
                    const channel = await discordClient.channels.fetch(targetChannelId)
                    const member = await channel.guild.members.fetch(userid)
                    const role = channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageChannels)
                    if (!role) return;
                    guildId = channel.guildId;
                    guildName = channel.guild.name;
                    channelName = channel.name;
                }

                let max = await schema.multiServer.find({ multiId })
                if (max.length >= 2) return;
                await schema.multiServer.findOneAndUpdate({ guildID: guildId }, {
                    channelid: targetChannelId,
                    multiId,
                    guildID: guildId,
                    guildName,
                    channelName,
                    botname
                }, { upsert: true }).catch(error => {
                    console.error('[Multi-Server] MongoDB error:', error.name, error.reason)
                    return
                });
                await multiServer.getRecords();
                rply.text = translate('chatroom.join_success', {
                    guild: guildName,
                    channel: channelName,
                    multiId
                });
                return rply;
            } catch {
                console.error('[Multi-Server] Join error')
            }
            return;
        }
        case /^exit$/i.test(mainMsg[1]): {
            if (!mainMsg[2] && userrole == 3) {
                await schema.multiServer.findOneAndDelete({ channelid: channelid }).catch(error => {
                    console.error('multiserver #101 mongoDB error:', error.name, error.reason)
                    return
                });
                await multiServer.getRecords();
                rply.text = translate('chatroom.exit_success');
                return rply;
            }
            if (mainMsg[2]) {
                if (needLiveOrMeta) {
                    return { needsLocal: true, moduleName: 'z_multi-server' };
                }
                if (chatroomChannelMeta?.guildId) {
                    if (!chatroomChannelMeta.allowed) return;
                    if (String(chatroomChannelMeta.channelId) !== String(mainMsg[2])) {
                        return { needsLocal: true, moduleName: 'z_multi-server' };
                    }
                } else {
                    const channel = await discordClient.channels.fetch(mainMsg[2])
                    const member = await channel.guild.members.fetch(userid)
                    const role = channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ManageChannels)
                    if (!role) return;
                }
                await schema.multiServer.findOneAndDelete({ channelid: mainMsg[2] }).catch(error => {
                    console.error('multiserver #112 mongoDB error:', error.name, error.reason)
                    return
                });
                await multiServer.getRecords();
                rply.text = translate('chatroom.exit_success');
                return rply;
            }
        }
            return;
        default: {
            break;
        }
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};
