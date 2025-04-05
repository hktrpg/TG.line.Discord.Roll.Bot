"use strict";
if (!process.env.mongoURL) {
    return;
}
const records = require('../modules/records.js');
let trpgDarkRollingfunction = {};
const checkTools = require('../modules/check.js');
const { SlashCommandBuilder } = require('discord.js');
records.get('trpgDarkRolling', (msgs) => {
    trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
})
const gameName = function () {
    return '【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr'
}
const gameType = function () {
    return 'Tool:trpgDarkRolling:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]drgm$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【🎲暗骰GM系統】
╭──── 📝系統簡介 ────
│ • GM專用私骰管理系統
│ • 可設置多個GM接收暗骰
│ • 支援自定義GM顯示名稱
│
├──── 👑GM管理 ────
│ ■ 基本指令:
│ • .drgm addgm
│   註冊成為GM
│
│ • .drgm addgm [代稱]
│   以特定名稱註冊為GM
│   不填寫則顯示原名
│
│ • .drgm show
│   顯示目前GM列表
│
│ • .drgm del [編號]
│   刪除指定GM
│
│ • .drgm del all
│   清空所有GM
│
├──── 🎲暗骰指令 ────
│ ■ 三種暗骰模式:
│
│ • dr [指令]
│   結果只傳送給自己
│   例: dr cc 80 鬥毆
│
│ • ddr [指令]
│   結果傳送給GM和自己
│   例: ddr cc 80 鬥毆
│
│ • dddr [指令]
│   結果只傳送給GM
│   例: dddr cc 80 鬥毆
│
├──── 💡使用範例 ────
│ 1️⃣ 設置GM:
│ • .drgm addgm
│   以原名註冊為GM
│
│ • .drgm addgm 主持人A
│   以"主持人A"註冊為GM
│
│ 2️⃣ 進行暗骰:
│ • dr 2d6
│   骰2顆六面骰,自己看結果
│
│ • ddr cc 50 潛行
│   進行潛行檢定
│   自己和GM都能看到結果
│
│ • dddr .sc 1/1d3
│   進行San Check
│   只有GM能看到結果
│
├──── ⚠️注意事項 ────
│ • 建議先用.drgm show確認GM
│ • 可設置多名GM同時收到暗骰
│ • GM可用代稱保持神秘感
│ • 刪除時需注意編號更動
╰──────────────`
}
const initialize = function () {
    return trpgDarkRollingfunction;
}

const rollDiceCommand = async function ({ mainMsg, groupid, userid, userrole, botname, displayname, channelid }) {
    let checkifsamename = 0;
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            if (botname == "Line")
                rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^addgm$/i.test(mainMsg[1]): {
            //
            //增加自定義關鍵字
            // .drgm[0] addgm[1] 代替名字[2]  
            if (rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }

            checkifsamename = 0
            if (channelid)
                groupid = channelid
            //因為在DISCROD以頻道作單位
            if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                        for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid == userid) {
                                checkifsamename = 1
                            }
                        }
                    }
                }
            let temp = {
                groupid: groupid,
                trpgDarkRollingfunction: [{
                    userid: userid,
                    diyName: mainMsg[2] || "",
                    displayname: displayname
                }]
                //|| displayname

            }
            if (checkifsamename == 0) {
                records.pushTrpgDarkRollingFunction('trpgDarkRolling', temp, () => {
                    records.get('trpgDarkRolling', (msgs) => {
                        trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                    })
                })
                rply.text = '新增成功: ' + (mainMsg[2] || displayname ||
                    "")
            } else rply.text = '新增失敗. 你已在GM列表'
            return rply;
        } case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //    
            //刪除所有自定義關鍵字
            //
            if (rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }

            if (channelid)
                groupid = channelid
            if (!mainMsg[2]) return;
            for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                    let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                    temp.trpgDarkRollingfunction = []
                    records.setTrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                        records.get('trpgDarkRolling', (msgs) => {
                            trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                        })
                    })
                    rply.text = '刪除所有在表GM'
                }
            }


            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //
            //刪除GM
            //
            if (!mainMsg[2]) rply.text += '沒有已註冊GM. '
            if (rply.text += checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }
            if (channelid)
                groupid = channelid
            for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid && mainMsg[2] < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length && mainMsg[2] >= 0) {
                    let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                    temp.trpgDarkRollingfunction.splice(mainMsg[2], 1)
                    records.setTrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                        records.get('trpgDarkRolling', (msgs) => {
                            trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
                        })
                    })
                }
                rply.text = '刪除成功: ' + mainMsg[2]
            }

            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            if (channelid)
                groupid = channelid
            records.get('trpgDarkRolling', (msgs) => {
                trpgDarkRollingfunction.trpgDarkRollingfunction = msgs
            })
            if (groupid) {
                let temp = 0;
                if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                    for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                        if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                            rply.text += '已註冊暗骰GM列表:'
                            for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + ": " + (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName || trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname) + ("\n")
                            }
                        }
                    }
                if (temp == 0) rply.text = '沒有已註冊的暗骰GM. '
            } else {
                rply.text = '不在群組. '
            }
            //顯示GM
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        default:
            break;
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('drgm')
            .setDescription('【暗骰GM系統】GM管理')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('addgm')
                    .setDescription('註冊成為GM')
                    .addStringOption(option => 
                        option.setName('alias')
                            .setDescription('GM代稱(選填)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示目前GM列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除指定GM')
                    .addStringOption(option => 
                        option.setName('number')
                            .setDescription('GM編號或all(刪除所有)')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            // Check if user has channel manager permission
            if (!interaction.member.permissions.has('ManageChannels')) {
                return '只有頻道管理員可以使用此功能';
            }
            
            const groupid = interaction.channelId;
            const userid = interaction.user.id;
            const displayname = interaction.user.username;
            
            switch (subcommand) {
                case 'addgm': {
                    const alias = interaction.options.getString('alias') || '';
                    
                    // Check if user is already in the GM list
                    let checkifsamename = 0;
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction) {
                        for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                                for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                    if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid == userid) {
                                        checkifsamename = 1;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (checkifsamename == 0) {
                        let temp = {
                            groupid: groupid,
                            trpgDarkRollingfunction: [{
                                userid: userid,
                                diyName: alias,
                                displayname: displayname
                            }]
                        };
                        
                        records.pushTrpgDarkRollingFunction('trpgDarkRolling', temp, () => {
                            records.get('trpgDarkRolling', (msgs) => {
                                trpgDarkRollingfunction.trpgDarkRollingfunction = msgs;
                            });
                        });
                        
                        return '新增成功: ' + (alias || displayname || "");
                    } else {
                        return '新增失敗. 你已在GM列表';
                    }
                }
                
                case 'show': {
                    let result = '已註冊暗骰GM列表:';
                    let found = false;
                    
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction) {
                        for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                                for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                    found = true;
                                    result += "\n" + a + ": " + 
                                        (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName || 
                                         trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname);
                                }
                            }
                        }
                    }
                    
                    if (!found) {
                        result = '沒有已註冊的暗骰GM.';
                    }
                    
                    return result;
                }
                
                case 'del': {
                    const number = interaction.options.getString('number');
                    
                    if (number.toLowerCase() === 'all') {
                        // Delete all GMs
                        for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                                let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i];
                                temp.trpgDarkRollingfunction = [];
                                records.setTrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                                    records.get('trpgDarkRolling', (msgs) => {
                                        trpgDarkRollingfunction.trpgDarkRollingfunction = msgs;
                                    });
                                });
                                return '刪除所有在表GM';
                            }
                        }
                        return '沒有找到此頻道的GM列表';
                    } else if (/^\d+$/.test(number)) {
                        // Delete specific GM
                        for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid && 
                                parseInt(number) < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length && 
                                parseInt(number) >= 0) {
                                let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i];
                                temp.trpgDarkRollingfunction.splice(parseInt(number), 1);
                                records.setTrpgDarkRollingfunction('trpgDarkRolling', temp, () => {
                                    records.get('trpgDarkRolling', (msgs) => {
                                        trpgDarkRollingfunction.trpgDarkRollingfunction = msgs;
                                    });
                                });
                                return '刪除成功: ' + number;
                            }
                        }
                        return '沒有找到此編號的GM';
                    } else {
                        return '無效的編號，請輸入數字或all';
                    }
                }
                
                default:
                    return '未知的子命令';
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('dr')
            .setDescription('暗骰(結果只傳送給自己)')
            .addStringOption(option => 
                option.setName('command')
                    .setDescription('擲骰指令')
                    .setRequired(true)),
        async execute(interaction) {
            const command = interaction.options.getString('command');
            return `dr ${command}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('ddr')
            .setDescription('暗骰(結果傳送給GM和自己)')
            .addStringOption(option => 
                option.setName('command')
                    .setDescription('擲骰指令')
                    .setRequired(true)),
        async execute(interaction) {
            const command = interaction.options.getString('command');
            return `ddr ${command}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('dddr')
            .setDescription('暗骰(結果只傳送給GM)')
            .addStringOption(option => 
                option.setName('command')
                    .setDescription('擲骰指令')
                    .setRequired(true)),
        async execute(interaction) {
            const command = interaction.options.getString('command');
            return `dddr ${command}`;
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand
};