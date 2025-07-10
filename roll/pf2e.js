"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
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
    }]
}
const getHelpMessage = function () {
    return `【🎲Pathfinder 2E查詢系統】
╭────── 🔍基本查詢 ──────
│ 指令格式:
│ 　• .pf2 [關鍵字]
│
├────── 📚功能說明 ──────
│ • 自動搜尋相關資料
│ • 無完全符合時顯示相似結果
│ • 支援中文關鍵字搜尋
│
├────── 💡使用提示 ──────
│ • 建議使用精確關鍵字
│ • 可查詢技能、特徵、職業等
│
├────── 📖資料來源 ──────
│ • 感謝 仙堂麻尋 提供資料
│ • 純美蘋果園 Pf2e中文化
│ • goddessfantasy.net#134913
╰──────────────`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
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
    constructor(data) {
        this.pf2eData = data;
        this.fuse = new Fuse(this.pf2eData, {
            keys: ['name'],
            includeScore: true,
            threshold: 0.3
        });
    }

    static init() {
        let data = [];
        for (let i = 0; i < datalink.length; i++) {
            let temp = require(datalink[i]);
            data = [...data, ...Pf2e.objectToArray(temp.helpdoc)]
        }

        return new Pf2e(data);
    }
    static objectToArray(input) {
        let data = [];
        for (let i = 0; i < Object.keys(input).length; i++) {
            data.push({
                name: Object.keys(input)[i],
                desc: Object.values(input)[i]
            });
        }
        return data;
    }
    search(name) {
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
            console.error(error);
            return '發生錯誤';
        }
    }
}
const pf2 = Pf2e.init();

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('pf2')
            .setDescription('Pathfinder 2E查詢系統')
            .addStringOption(option => 
                option.setName('keyword')
                    .setDescription('要查詢的關鍵字')
                    .setRequired(true)),
        async execute(interaction) {
            const keyword = interaction.options.getString('keyword');
            return `.pf2 ${keyword}`;
        }
    }
];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};