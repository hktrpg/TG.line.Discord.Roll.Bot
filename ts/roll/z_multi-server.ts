// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.DISCORD_CHANNEL_SECRET) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
const variables = {};
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'VIP'.
const VIP = require('../modules/veryImportantPerson');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'FUNCTION_L... Remove this comment to see the full error message
const FUNCTION_LIMIT = [0, 1, 1, 1, 1, 1, 1, 1];
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Permission... Remove this comment to see the full error message
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('../modules/schema')
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const rollbase = require('./rollbase.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'multiServe... Remove this comment to see the full error message
const multiServer = require('../modules/multi-server')
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Discord'.
const Discord = require("discord.js");
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Permission... Remove this comment to see the full error message
const { Permissions } = Discord;
const gameName = function () {
    return '【同步聊天】.chatroom'
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.chatroom$/i,
        second: null
    }];
}
const getHelpMessage = function () {
    return `【同步聊天】.chatroom
    .chatroom create
    .chatroom join
`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function(
    this: any,
    {
        inputStr,
        mainMsg,
        groupid,
        userid,
        userrole,
        botname,
        displayname,
        channelid,
        displaynameDiscord,
        discordClient,
        discordMessage,
        membercount
    }: any
) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            // @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{ defaul... Remove this comment to see the full error message
            rply.quotes = true;
            return rply;
        }
        case /^create$/i.test(mainMsg[1]) && /^\S/.test(mainMsg[2]): {
            try {
                if (groupid) return;
                let lv = await VIP.viplevelCheckUser(userid);
                let limit = FUNCTION_LIMIT[lv];
                if (limit <= 0) return;
                const channel = await discordClient.channels.fetch(mainMsg[2])
                const member = await channel.fetch(userid)
                const v = member.members.find((v: any) => v)
                const role = channel.permissionsFor(v).has(PermissionsBitField.Flags.ManageChannels)
                if (!role) return;
                const d = new Date();
                const time = d.getTime();
                const num = rollbase.Dice(100000000);
                const multiId = `${time}_${num}`
                await schema.multiServer.findOneAndUpdate({ guildID: channel.guildId }, { channelid: mainMsg[2], multiId, guildID: channel.guildId, guildName: channel.guild.name, channelName: channel.name, botname }, { upsert: true }).catch((error: any) => {
                    console.error('multiserver #78 mongoDB error: ', error.name, error.reson)
                    return
                });
                await multiServer.getRecords();
                rply.text = `已把${channel.guild.name} - ${channel.name}新增到聊天室`
                //，想把其他頻道加入，請輸入\n .chatroom join ${multiId} (其他頻道的ID)
                return rply;
            } catch (error) {
                console.error('error', error)
            }
            return
        }
        case /^join$/i.test(mainMsg[1]) && /^\S/.test(mainMsg[2]) && /^\S/.test(mainMsg[3]): {
            try {
                if (groupid) return;
                let lv = await VIP.viplevelCheckUser(userid);
                let limit = FUNCTION_LIMIT[lv];
                if (limit <= 0) return;
                const channel = await discordClient.channels.fetch(mainMsg[3])
                const member = await channel.fetch(userid)
                let v;
                try {
                    v = (member.members && member.members.find((data: any) => data))
                } catch (error) {
                    v = member;
                }
                const role = channel.permissionsFor(v).has(PermissionsBitField.Flags.ManageChannels)
                if (!role) return;
                let max = await schema.multiServer.find({ multiId: mainMsg[2] })
                if (max.length >= 2) return;
                await schema.multiServer.findOneAndUpdate({ guildID: channel.guildId }, { channelid: mainMsg[3], multiId: mainMsg[2], guildID: channel.guildId, guildName: channel.guild.name, channelName: channel.name, botname }, { upsert: true }).catch((error: any) => {
                    console.error('multiserver #93 mongoDB error: ', error.name, error.reson)
                    return
                });
                await multiServer.getRecords();
                rply.text = `已把${channel.guild.name} - ${channel.name}新增到聊天室，想把其他頻道加入，請輸入 .join ${mainMsg[2]} (其他頻道的ID)`
                return rply;
            } catch (error) {
                console.error('error', error)
            }
            return;
        }
        case /^exit$/i.test(mainMsg[1]): {
            if (!mainMsg[2] && userrole == 3) {
                await schema.multiServer.findOneAndRemove({ channelid: channelid }).catch((error: any) => {
                    console.error('multiserver #101 mongoDB error: ', error.name, error.reson)
                    return
                });
                await multiServer.getRecords();
                rply.text = `已移除聊天室`
                return rply;
            }
            if (mainMsg[2]) {
                const channel = await discordClient.channels.fetch(mainMsg[2])
                const member = await channel.fetch(userid)
                const v = member.members.find((v: any) => v)
                const role = channel.permissionsFor(v).has(PermissionsBitField.Flags.ManageChannels)
                if (!role) return;
                await schema.multiServer.findOneAndRemove({ channelid: mainMsg[2] }).catch((error: any) => {
                    console.error('multiserver #112 mongoDB error: ', error.name, error.reson)
                    return
                });
                await multiServer.getRecords();
                rply.text = `已移除聊天室`
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
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};