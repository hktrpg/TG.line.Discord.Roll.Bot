// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
const variables = {};
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const { SlashCommandBuilder } = require('discord.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Fuse'.
const Fuse = require('fuse.js')
const gameName = function () {
    return '【Pf2e】.pf2 '
}

const datalink = ['../assets/pf2e/pf2_action.json', '../assets/pf2e/pf2_feat.json', '../assets/pf2e/pf2_item.json', '../assets/pf2e/pf2_monster.json', '../assets/pf2e/pf2state&spells.json']
const gameType = function () {
    return 'Dice:Pf2e:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.Pf2$/i,
        second: null
    }];
}
const getHelpMessage = function () {
    return `【Pf2e】.pf2
這是一個Pf2e的資料庫，只要輸入 .pf2 查找的內容，
就會顯示相關資料，如果沒有資料，就會顯示類似字眼

資料來源自 https://www.goddessfantasy.net/bbs/index.php?topic=134913.0 #1 仙堂麻尋
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

        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = pf2.search(mainMsg[1]);

            return rply;
        }
        default: {
            break;
        }
    }
}


class Pf2e {
    fuse: any;
    pf2eData: any;
    constructor(data: any) {
        this.pf2eData = data;
        this.fuse = new Fuse(this.pf2eData, {
            keys: ['name'],
            includeScore: true,
            threshold: 0.3
        });
    }

    static init() {
        let data: any = [];
        for (let i = 0; i < datalink.length; i++) {
            // @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
            let temp = require(datalink[i]);
            data = data.concat(Pf2e.objectToArray(temp.helpdoc))
        }

        return new Pf2e(data);
    }
    static objectToArray(input: any) {
        let data = [];
        for (let i = 0; i < Object.keys(input).length; i++) {
            data.push({
                name: Object.keys(input)[i],
                // @ts-expect-error TS(2550): Property 'values' does not exist on type 'ObjectCo... Remove this comment to see the full error message
                desc: Object.values(input)[i]
            });
        }
        return data;
    }
    search(name: any) {
        try {
            let result = this.fuse.search(name);
            let rply = '';
            if (result.length === 0) return '沒有找到相關資料';
            if (result[0].item.name === name) {
                return `【${result[0].item.name}】
        ${result[0].item.desc} \n
         `;
            }
            if (result.length <= 2) {
                for (let i = 0; i < result.length; i++) {
                    rply += `【${result[i].item.name}】
${result[i].item.desc} \n
 `;
                }
            }
            else {
                rply += '找到太多相關資料，請更精確的查詢\n\n';
                for (let i = 0; i < result.length; i++) {
                    rply += `${result[i].item.name}\n`;
                }
            }
            return rply;
        }
        catch (error) {
            console.log(error);
            return '發生錯誤';
        }
    }
}
const pf2 = Pf2e.init();

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