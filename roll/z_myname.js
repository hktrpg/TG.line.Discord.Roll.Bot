"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [10, 20, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const { getT, resolveHelp, resolveGameName, DEFAULT_LOCALE } = require('../modules/roll-i18n.js');
const i18n = require('../modules/i18n.js');
const MAX_HISTORY_RECORDS = 20;
const opt = {
    upsert: true,
    runValidators: true,
    returnDocument: 'after'
}
const gameName = function (params = {}) {
    return resolveGameName(params, 'myname.game_name', '【你的名字】.myname / .me .me1 .me泉心');
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
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'myname.help');
}
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
    channelid,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^\.mehistory$/i.test(mainMsg[0]): {
            if (!groupid) {
                rply.text = translate('myname.channel_only', { command: '.mehistory' });
                rply.quotes = true;
                return rply;
            }

            try {
                // Fetch the last 20 records for this group
                const history = await getGroupHistory(channelid || groupid, botname);
                // Format the history entries as a string
                const formattedText = formatHistory(history.records, translate, locale);
                rply.text = formattedText;
                rply.quotes = true;
                return rply;
            } catch (error) {
                console.error('Error in .mehistory command:', error);
                rply.text = translate('myname.history_error');
                rply.quotes = true;
                return rply;
            }
        }
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            rply.text = checkBotname(botname, translate);
            if (rply.text) return rply;

            let myNames = await schema.myName.find({ userID: userid }).lean();
            if (groupid) {
                let result = showNames(myNames, translate);
                if (typeof result == 'string') rply.text = result;
                else rply.myNames = result;
            } else {
                rply.text = showNamesInText(myNames, translate);
            }
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            rply.text = checkBotname(botname, translate);
            if (rply.text) return rply;
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = translate('myname.delete_usage');
                return rply
            }
            if (/\d+/.test(mainMsg[2])) {
                try {
                    let myNames = await schema.myName.find({ userID: userid })
                    let result = await myNames[mainMsg[2] - 1].deleteOne();
                    if (result) {
                        rply.text = translate('myname.delete_success', { name: result.name })
                        return rply
                    } else {
                        rply.text = translate('myname.delete_error');
                        return rply
                    }
                } catch {
                    //   console.error("移除角色失敗, inputStr: ", inputStr);
                    rply.text = translate('myname.delete_error');
                    return rply
                }
            }

            try {
                let myNames = await schema.myName.findOneAndDelete({ userID: userid, shortName: mainMsg[2] })
                if (myNames) {
                    rply.text = translate('myname.delete_success', { name: myNames })
                    rply.quotes = true;
                    return rply
                } else {
                    rply.text = translate('myname.delete_error');
                    rply.quotes = true;
                    return rply
                }
            } catch {
                //   console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = translate('myname.delete_error');
                rply.quotes = true;
                return rply
            }
        }
        case /^\.myname$/i.test(mainMsg[0]): {
            rply.text = checkBotname(botname, translate);
            if (rply.text) return rply;
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = translate('myname.input_error');
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.myName.countDocuments({ userID: userid });
            if (myNamesLength >= limit) {
                rply.text = translate('myname.limit_reached', { limit });
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.name || !checkName.imageLink) {
                rply.text = translate('myname.input_error');
                rply.quotes = true;
                return rply;
            }
            if (!/^http/i.test(checkName.imageLink)) {
                rply.text = translate('myname.invalid_url');
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
                rply.text = translate('myname.add_error');
                return rply;
            }
            rply.text = translate('myname.add_success', { name: myName.name });
            let myNames = await schema.myName.find({ userID: userid }).lean();
            let nameResult = showName(myNames, myName.name, translate);
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
                rply.text = translate('myname.channel_only', { command: '.me' });
                rply.quotes = true;
                return rply;
            }

            try {
                // Process the input by removing the command prefix
                inputStr = inputStr.replace(/^\.mee\s*/i, ' ').replace(/^\.me\s*/i, ' ');
                if (/^\s*$/.test(inputStr)) {
                    rply.text = translate('myname.me_empty');
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
                rply.text = translate('myname.process_error');
                rply.quotes = true;
                return rply;
            }
        }
        case /^\.me\S+/i.test(mainMsg[0]): {
            rply.text = checkBotname(botname, translate);
            if (rply.text) return rply;
            try {
                //.meXXX handling
                if (!mainMsg[1]) {
                    return;
                }
                if (!groupid) {
                    rply.text = translate('myname.channel_only', { command: '.me(X)' });
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
                rply.text = translate('myname.role_error');
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

function showNames(names, translate) {
    let reply = [];
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply[index] = {
                content: name.shortName
                    ? translate('myname.show_embed_alias', { index: index + 1, shortName: name.shortName })
                    : translate('myname.show_embed_name', { index: index + 1, name: name.name }),
                username: name.name,
                avatarURL: name.imageLink
            }
        }
    } else reply = translate('myname.not_found');
    return reply;
}

function showNamesInText(names, translate) {
    let reply = '';
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply += name.shortName
                ? translate('myname.show_text_alias', {
                    index: index + 1,
                    name: name.name,
                    shortName: name.shortName,
                    image: name.imageLink
                })
                : translate('myname.show_text_name', {
                    index: index + 1,
                    name: name.name,
                    image: name.imageLink
                });
        }
    }
    else reply = translate('myname.not_found');
    return reply;
}

function showName(names, targetName, translate) {
    let reply = {};
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            if (names[index].name == targetName)
                reply = {
                    content: name.shortName
                        ? translate('myname.show_one_alias', { index: index + 1, shortName: name.shortName })
                        : translate('myname.show_one_name', { index: index + 1, name: name.name }),
                    username: name.name,
                    avatarURL: name.imageLink
                }
        }
    } else reply = translate('myname.not_found');
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
function formatHistory(records, translate, locale = DEFAULT_LOCALE) {
    if (!records || !Array.isArray(records) || records.length === 0) {
        return translate('myname.history_empty');
    }

    try {
        const formatter = new Intl.DateTimeFormat(i18n.toIntlLocale(locale), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        let formatted = translate('myname.history_title');
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if (!record) continue;

            let time = translate('myname.history_unknown_time');
            try {
                if (record.timestamp) {
                    const timestamp = new Date(record.timestamp);
                    if (!Number.isNaN(timestamp.getTime())) {
                        time = formatter.format(timestamp);
                    }
                }
            } catch (error) {
                console.error('Error formatting timestamp:', error);
            }

            formatted += translate('myname.history_entry', {
                num: i + 1,
                time,
                displayname: record.displayname,
                userID: record.userID
            });
            if (record.name !== record.userID) {
                formatted += translate('myname.history_character', { name: record.name });
            }
            formatted += translate('myname.history_content', { content: record.content });
        }

        return formatted;
    } catch (error) {
        console.error('Error in formatHistory:', error);
        return translate('myname.history_format_error');
    }
}
function checkBotname(botname, translate) {
    if (botname !== "Discord") {
        return translate('myname.discord_only');
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