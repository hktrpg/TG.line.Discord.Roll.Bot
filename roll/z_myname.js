"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [10, 20, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const MAX_HISTORY_RECORDS = 20;
const opt = {
    upsert: true,
    runValidators: true,
    returnDocument: 'after'
}
const gameName = function () {
    return '【你的名字】.myname / .me .me1 .me泉心'
}
const convertRegex = function (str) {
    return str.toString().replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`);
};
const gameType = function () {
    return 'Tool:myname:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.mehistory$/i,
        second: null
    }, {
        first: /^\.myname$|^\.me$|^\.mee$|^\.me\S+/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【👥角色扮演系統】(Discord限定)
╭──── 📝系統簡介 ────
│ • 可設定角色名字和頭像
│ • 快速切換角色進行對話
│ • 支援擲骰指令整合
│
├──── ⚙️角色管理 ────
│ ■ 新增角色:
│ • .myname "名字" 圖片網址 簡稱
│   範例: 
.myname "泉心 造史" 
https://imgur.com/xxx.jpg 造
│   *有空格的名字需要用""包住
│
│ ■ 管理指令:
│ • .myname show
│   顯示角色列表
│ • .myname delete 序號/簡稱
│   刪除指定角色
│
├──── 🎭扮演發言 ────
│ ■ 基本發言:
│ • .me 訊息內容
│   直接以普通方式發言
│
│ ■ 角色發言:
│ • .me序號 訊息內容
│   例: .me1 「早安！」
│
│ ■ 使用簡稱:
│ • .me簡稱 訊息內容
│   例: .me造 「來玩吧」
│
│ ■ 查看歷史:
│ • .mehistory
│   顯示群組最近${MAX_HISTORY_RECORDS}條.me發言記錄
│
│ ■ 整合擲骰:
│ • 在訊息中使用[[指令]]
│   範例: 
.me造 「我試試看！」
[[CC 80]] [[立FLAG]]
│
├──── ⚠️注意事項 ────
│ • 需要Webhook與訊息權限
│ • 圖片可使用Discord或Imgur連結
│ • 圖片無效時會用預設頭像
╰──────────────`
}
const errorMessage = `輸入出錯\n留意各個資料前要有空格分隔\n 
範例
.myname "泉心 造史" https://example.com/example.jpg 造史
.myname 泉心造史 https://example.com/example.jpg
`
const initialize = function () {

    return "";
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userid,
    botname,
    groupid,
    displayname,
    displaynameDiscord,
    channelid
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^\.mehistory$/i.test(mainMsg[0]): {
            if (!groupid) {
                rply.text = ".mehistory 這功能只可以在頻道中使用";
                rply.quotes = true;
                return rply;
            }

            try {
                // Fetch the last 20 records for this group
                const history = await getGroupHistory(channelid || groupid, botname);
                // Format the history entries as a string
                const formattedText = await formatHistory(history.records);
                rply.text = formattedText;
                rply.quotes = true;
                return rply;
            } catch (error) {
                console.error('Error in .mehistory command:', error);
                rply.text = "處理發言記錄時發生錯誤";
                rply.quotes = true;
                return rply;
            }
        }
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = await getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            rply.text = checkBotname(botname, rply);
            if (rply.text) return rply;

            let myNames = await schema.myName.find({ userID: userid }).lean();
            if (groupid) {
                let result = showNames(myNames);
                if (typeof result == 'string') rply.text = result;
                else rply.myNames = result;
            } else {
                rply.text = showNamesInText(myNames);
            }
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            rply.text = checkBotname(botname, rply);
            if (rply.text) return rply;
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                return rply
            }
            if (/\d+/.test(mainMsg[2])) {
                try {
                    let myNames = await schema.myName.find({ userID: userid })
                    let result = await myNames[mainMsg[2] - 1].deleteOne();
                    if (result) {
                        rply.text = `移除成功，${result.name} 已被移除`
                        return rply
                    } else {
                        rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                        return rply
                    }
                } catch {
                    //   console.error("移除角色失敗, inputStr: ", inputStr);
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    return rply
                }
            }

            try {
                let myNames = await schema.myName.findOneAndDelete({ userID: userid, shortName: mainMsg[2] })
                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    rply.quotes = true;
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    rply.quotes = true;
                    return rply
                }
            } catch {
                //   console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                rply.quotes = true;
                return rply
            }
        }
        case /^\.myname$/i.test(mainMsg[0]): {
            rply.text = checkBotname(botname, rply);
            if (rply.text) return rply;
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = errorMessage;
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.myName.countDocuments({ userID: userid });
            if (myNamesLength >= limit) {
                rply.text = '.myname 個人上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.name || !checkName.imageLink) {
                rply.text = errorMessage;
                rply.quotes = true;
                return rply;
            }
            if (!/^http/i.test(checkName.imageLink)) {
                rply.text = `輸入出錯\n 圖示link 必須符合 http/https 開頭`;
                rply.quotes = true;
                return rply;
            }
            let myName = {};
            try {
                myName = await schema.myName.findOneAndUpdate(
                    { userID: userid, name: checkName.name },
                    { imageLink: checkName.imageLink, shortName: checkName.shortName },
                    opt
                );
            } catch {
                rply.text = `發生了一點錯誤，請稍後再試`;
                return rply;
            }
            rply.text = `已新增角色 - ${myName.name}`;
            let myNames = await schema.myName.find({ userID: userid }).lean();
            let nameResult = showName(myNames, myName.name);
            if (groupid) {
                rply.myNames = [nameResult];
            } else {
                rply.text += nameResult.content;
            }
            return rply;
        }
        case /^\.me$|^\.mee$/i.test(mainMsg[0]): {
            // Handle standard .me command
            if (!groupid) {
                rply.text = ".me 這功能只可以在頻道中使用"
                rply.quotes = true;
                return rply;
            }

            try {
                // Process the input by removing the command prefix
                inputStr = inputStr.replace(/^\.mee\s*/i, ' ').replace(/^\.me\s*/i, ' ');
                if (/^\s*$/.test(inputStr)) {
                    rply.text = `.me 或 .mee 可以令HKTRPG機械人重覆你的說話\n請輸入復述內容`
                    rply.quotes = true;
                    return rply;
                }

                // Create a default myName object just for the message
                const defaultMyName = {
                    name: userid,  // Using userid as default name
                    imageLink: 'https://cdn.discordapp.com/embed/avatars/0.png',  // Default Discord avatar
                };

                rply.myspeck = showMessage(defaultMyName, ' ' + inputStr);

                // Save this usage to the record
                try {
                    if (groupid) {
                        // Content is the processed message without the command
                        const content = inputStr.trim();
                        // Don't await here to prevent blocking on DB operations
                        saveMyNameRecord(channelid || groupid, userid, null, defaultMyName.name, defaultMyName.imageLink, content, displaynameDiscord, displayname, botname)
                            .catch(error => console.error('Async error saving .me record:', error));
                    }
                } catch (error) {
                    console.error('Error saving .me record:', error);
                    // Continue anyway even if saving fails
                }

                return rply;
            } catch (error) {
                console.error('Error processing .me command:', error);
                rply.text = "處理訊息時發生錯誤";
                rply.quotes = true;
                return rply;
            }
        }
        case /^\.me\S+/i.test(mainMsg[0]): {
            rply.text = checkBotname(botname, rply);
            if (rply.text) return rply;
            try {
                //.meXXX handling
                if (!mainMsg[1]) {
                    return;
                }
                if (!groupid) {
                    rply.text = ".me(X) 這功能只可以在頻道中使用"
                    rply.quotes = true;
                    return rply;
                }
                let checkName = checkMeName(mainMsg[0]);
                let myName;
                if (typeof checkName == 'number') {
                    let myNameFind = await schema.myName.find({ userID: userid }).skip(((checkName - 1) < 0 ? 1 : (checkName - 1))).limit(1).lean();
                    if (myNameFind && myNameFind.length > 0) {
                        myName = myNameFind[0];
                    }
                }
                if (!myName) {
                    try {
                        myName = await schema.myName.findOne({ userID: userid, shortName: new RegExp('^' + convertRegex(checkName) + '$', 'i') }).lean();
                    } catch (error) {
                        console.error('Error finding myName by shortName:', error);
                        return rply;
                    }
                }
                if (!myName) {
                    return rply;
                }

                const messageContent = inputStr.replace(/^\s?\S+\s+/, '');
                const messageData = showMessage(myName, inputStr);
                rply.myNames = [messageData];  // Use myName for .meXXX commands

                // Save this usage to the record without awaiting
                try {
                    if (groupid) {
                        // Don't await here to prevent blocking on DB operations
                        saveMyNameRecord(channelid || groupid, userid, myName._id, myName.name, myName.imageLink, messageContent, displaynameDiscord, displayname, botname)
                            .catch(error => console.error('Async error saving .meXXX record:', error));
                    }
                } catch (error) {
                    console.error('Error saving .meXXX record:', error);
                    // Continue anyway even if saving fails
                }

                return rply;
            } catch (error) {
                console.error('Error processing .meXXX command:', error);
                rply.text = "處理角色訊息時發生錯誤";
                rply.quotes = true;
                return rply;
            }
        }
        default: {
            break;
        }
    }
}

// Function to save myName usage record for a group, keeping only the last 20 records
async function saveMyNameRecord(groupID, userID, myNameID, name, imageLink, content, displaynameDiscord, displayname, botname) {
    try {
        // Check if schema.myNameRecord exists and is a valid model
        if (!schema.myNameRecord) {
            console.error('myNameRecord model not found in schema');
            return null;
        }
        if (!botname) {
            botname = 'Unknown';
        }

        // Create the record data
        const recordData = {
            userID,
            myNameID,
            name,
            imageLink,
            content,
            displayname: displaynameDiscord || displayname || 'Unknown',
            timestamp: new Date()
        };

        // Use findOneAndUpdate with $push
        const record = await schema.myNameRecord.findOneAndUpdate(
            { groupID, botname },
            {
                $push: {
                    records: {
                        $each: [recordData],
                        $sort: { timestamp: -1 },
                        $slice: MAX_HISTORY_RECORDS
                    }
                }
            },
            { upsert: true, returnDocument: 'after' }
        );
        return record;
    } catch (error) {
        console.error('Error saving myName record:', error);
        return null;
    }
}

function showMessage(myName, inputStr) {
    let content = inputStr.replace(/^\s?\S+\s+/, '');

    // Check for dice commands in double brackets and process them
    if (content.includes('[[') && content.includes(']]')) {
        // This will be handled by the calling function
    }

    let result = {
        content: content,
        username: myName.name,
        avatarURL: myName.imageLink
    }
    return result;
}

function checkMyName(inputStr) {
    try {
        let name = inputStr.replace(/^\s?\S+\s+/, '');
        let finalName = {}
        if (/^".*"/.test(name)) {
            finalName = name.match(/"(.*)"\s+(\S+)\s*(\S*)/)
        } else {
            finalName = name.match(/^(\S+)\s+(\S+)\s*(\S*)/)
        }
        return { name: finalName[1], imageLink: finalName[2], shortName: finalName[3] };
    } catch {
        return {}
    }
}

function checkMeName(inputStr) {
    let name = inputStr.replace(/^\.me/i, '');
    if (/^\d+$/.test(name)) {
        name = Number(name)
    }
    return name;
}

function showNames(names) {
    let reply = [];
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply[index] = {
                content: `序號#${index + 1} \n${(name.shortName) ? `安安，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`}
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                username: name.name,
                avatarURL: name.imageLink
            }
        }
    } else reply = "沒有找到角色"
    return reply;
}

function showNamesInText(names) {
    let reply = '';
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply += `序號#${index + 1} \n${(name.shortName) ? `安安，我是${name.name}，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`} \n${name.imageLink} \n
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `
        }
    }
    else reply = "沒有找到角色"
    return reply;
}

function showName(names, targetName) {
    let reply = {};
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            if (names[index].name == targetName)
                reply = {
                    content: `序號#${index + 1} \n${(name.shortName) ? `Hello, 我的別名是${name.shortName}` : `你好，我的名字是${name.name}`} \n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                    username: name.name,
                    avatarURL: name.imageLink
                }
        }
    } else reply = "沒有找到角色"
    return reply;
}

// Function to get the history for a group
async function getGroupHistory(groupID, botname) {
    try {
        // Check if the myNameRecord model exists
        if (!schema.myNameRecord) {
            console.error('myNameRecord model not found in schema');
            return { records: [] };
        }

        // Find the record for this group
        const record = await schema.myNameRecord.findOne({ groupID, botname }).lean();
        // If no record exists or it has no records array, return an empty array for consistent handling
        if (!record || !record.records || !Array.isArray(record.records)) {
            return { records: [] };
        }

        // Sort records by timestamp in descending order (newest first)
        const sortedRecords = record.records.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });

        // Keep only the last 20 records
        return { records: sortedRecords.slice(0, MAX_HISTORY_RECORDS) };
    } catch (error) {
        console.error('Error getting group history:', error);
        // Return empty records object for consistent handling in case of errors
        return { records: [] };
    }
}

// Function to format the history records for display
function formatHistory(records) {
    if (!records || !Array.isArray(records) || records.length === 0) {
        return "此群組沒有.me發言記錄";
    }

    try {
        // Create a formatter for timestamps
        const formatter = new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        let formatted = "【最近的.me發言記錄】\n";
        formatted += "──────────────\n";
        // Process each record in the array
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if (!record) continue;

            let time = '未知時間';
            try {
                // Convert string timestamp to Date if needed
                if (record.timestamp) {
                    const timestamp = new Date(record.timestamp);
                    if (!Number.isNaN(timestamp.getTime())) {
                        time = formatter.format(timestamp);
                    }
                }
            } catch (error) {
                console.error('Error formatting timestamp:', error);
            }

            // Format the record with more details
            formatted += `${i + 1}. ${time}\n`;
            formatted += `使用者: ${record.displayname} (${record.userID})\n`;
            if (record.name !== record.userID) {
                formatted += `角色: ${record.name}\n`;
            }
            formatted += `內容: ${record.content}\n`;
            formatted += "──────────────\n";
        }

        return formatted;
    } catch (error) {
        console.error('Error in formatHistory:', error);
        return "處理記錄時發生錯誤，請稍後再試";
    }
}
function checkBotname(botname) {
    if (botname !== "Discord") {
        return '此功能只能在Discord中使用';
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('myname')
            .setDescription('角色扮演系統 - 角色管理')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增角色')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('角色名字')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('imageurl')
                            .setDescription('角色圖片網址')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('nickname')
                            .setDescription('角色簡稱')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示角色列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除角色')
                    .addStringOption(option =>
                        option.setName('target')
                            .setDescription('要刪除的角色序號或簡稱')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            if (subcommand === 'add') {
                const name = interaction.options.getString('name');
                const imageurl = interaction.options.getString('imageurl');
                const nickname = interaction.options.getString('nickname') || '';
                
                return `.myname "${name}" ${imageurl} ${nickname}`;
            }
            
            if (subcommand === 'show') {
                return `.myname show`;
            }
            
            if (subcommand === 'delete') {
                const target = interaction.options.getString('target');
                return `.myname delete ${target}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('me')
            .setDescription('角色扮演系統 - 以自己身分發言')
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('要發言的內容')
                    .setRequired(true)),
        async execute(interaction) {
            const message = interaction.options.getString('message');
            return `.me ${message}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('mee')
            .setDescription('角色扮演系統 - 以角色身分發言')
            .addStringOption(option =>
                option.setName('character')
                    .setDescription('角色序號或簡稱')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('要發言的內容')
                    .setRequired(true)),
        async execute(interaction) {
            const character = interaction.options.getString('character');
            const message = interaction.options.getString('message');
            return `.me${character} ${message}`;
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('mehistory')
            .setDescription('角色扮演系統 - 顯示群組最近發言記錄'),
        async execute() {
            return `.mehistory`;
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