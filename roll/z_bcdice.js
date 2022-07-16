"use strict";
if (!process.env.mongoURL) {
    return;
}
const {
    DynamicLoader
} = require('bcdice');
const variables = {};
const checkTools = require('../modules/check.js');
const schema = require('../modules/schema.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【BcDice】.bc'
}

const gameType = function () {
    return 'Dice:bcdice:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.bc$|^\.al$|^\.kk$|^\.mk$|^\.ss$|^\.sg$|^\.UK$|^\.dx$|^\.nc$|^\.sw$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【BcDice】日系擲骰
這是讓你可以使用Bcdice 那100種擲骰系統的功能

使用方法
首先，先在BCDICE官方的骰表ID中找出你所想的系統
然後輸入.bc use (ID) 進行登記
現在，你可以以.bc (骰子指令)來進行擲骰了。 
想看骰子說明可輸入.bc dicehelp

注: 登記需要Admin或頻道管理權限

https://bcdice.org/systems/
`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userrole,
    botname,
    channelid,
    groupid
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let filter = {
        botname: botname,
        channelid: channelid,
        //    trpgId: String
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;

        }
        case /^\.kk$/i.test(mainMsg[0]): {
            let result = await calldice("Kamigakari", mainMsg[1]);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }
        case /^\.dx$/i.test(mainMsg[0]): {
            let result = await calldice("DoubleCross", mainMsg[1]);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }
        case /^\.sw$/i.test(mainMsg[0]): {
            let result = await calldice("SwordWorld2.5", mainMsg[1]);
            (result) ? rply.text = `${mainMsg[1]} ${(mainMsg[2]) ? mainMsg[2] : ''}\n${result}` : null;
            return rply;
        }

        case /^dicehelp$/i.test(mainMsg[1]): {
            let doc = await schema.bcdiceRegedit.findOne(filter).catch(err => console.error(err))
            if (doc && doc.trpgId) {
                rply.text = await callHelp(doc.trpgId) || '';
                return rply;
            } else {
                rply.text = `沒有已設定的骰表ID\n\n` + this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }

        }
        case /^use+$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }
            if (!mainMsg[2]) {
                rply.text = `請輸入ID，ID可以在下列網站找到\nhttps://bcdice.org/systems/`
                return rply;
            }
            let help = await callHelp(mainMsg[2]);
            if (!help) {
                rply.text = `此骰表ID沒有回應，請檢查是不是正確\nhttps://bcdice.org/systems/`
                return rply;
            }
            let doc = await schema.bcdiceRegedit.findOneAndUpdate(filter, { trpgId: mainMsg[2] }, { upsert: true, returnDocument: 'after', returnNewDocument: true }).catch(err => null)
            if (doc) rply.text = `已更新BcDice，現在此頻道正在使用 ${doc.trpgId}

            使用說明: \n${help}
            `
            else rply.text = `登記失敗，請以後再嘗試`
            return rply;
        }
        case /^delete+$/i.test(mainMsg[1]): {
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let doc = await schema.bcdiceRegedit.findOneAndDelete(filter, { returnDocument: true }).catch(err => console.error(err))
            if (doc) rply.text = `已刪除BcDice的設定`
            else rply.text = `刪除失敗，請以後再嘗試`
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            let doc = await schema.bcdiceRegedit.findOne(filter).catch(err => console.error(err))
            if (doc && doc.trpgId) {
                rply.text = await calldice(doc.trpgId, inputStr.replace(/^\S+/, ''))
                return rply;
            }
            else {
                rply.text = '沒有已設定的BcDice 骰表ID\n請查找骰表ID 並輸入 .bc use (id)\nhttps://bcdice.org/systems/'
                return rply;
            }
        }
        default: {
            rply.text = `這骰組已經整合成BcDice
使用方法
首先，先在BcDice官方的骰表ID中找出你所想的系統
然後輸入.bc use (ID) 進行登記
現在，你可以以.bc (骰子指令)來進行擲骰了。 
想看骰子說明可輸入.bc dicehelp

注: 登記需要Admin或頻道管理權限

https://bcdice.org/systems/
`
            return rply;
        }
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('bcdice擲骰')
            .setDescription('進行BcDice擲骰')
            .addStringOption(option => option.setName('text').setDescription('擲骰內容').setRequired(true))
        ,
        async execute(interaction) {
            const text = interaction.options.getString('text')
            return `.bc ${text} `
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('bcdice設定')
            .setDescription('進行bcdice的設定(說明/登記/刪除)')
            .addStringOption(option =>
                option.setName('指令')
                    .setDescription('進行bcdice的設定')
                    .setRequired(true)
                    .addChoice('顯示使用說明', 'help')
                    .addChoice('顯示BcDice骰組使用說明(登記後可使用)', 'dicehelp')
                    .addChoice('登記使用的骰表ID', 'use')
                    .addChoice('移除使用的骰表ID', 'delete'))
            .addStringOption(option => option.setName('usetext').setDescription('如登記，請在這裡填寫ID').setRequired(false))
        ,
        async execute(interaction) {
            const useText = interaction.options.getString('usetext') || '';
            const subcommand = interaction.options.getString('指令') || '';
            switch (subcommand) {
                case 'help':
                    return '.bc help'
                case 'dicehelp':
                    return '.bc dicehelp'
                case 'delete':
                    return '.bc delete'
                case 'use':
                    return `.bc use ${useText} `
                default:
                    return;
            }
        }
    }
]
async function calldice(gameType, message) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.eval(message);
    return (result && result.text) ? result.text : null;
}
async function callHelp(gameType) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.HELP_MESSAGE || '';
    return result;
}
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};