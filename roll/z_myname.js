"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const VIP = require('../modules/patreon/veryImportantPerson');
const limitAtArr = [10, 20, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/db/schema.js');
const { findNextSerial, ensureSerials, findBySerial } = require('../modules/db/serial.js');
const { getT, resolveHelp, resolveGameName, DEFAULT_LOCALE } = require('../modules/i18n/roll-i18n.js');
const i18n = require('../modules/i18n/i18n.js');
const MAX_HISTORY_RECORDS = 20;
const MYNAME_SERIAL_START = 1;
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
        case /^\.me$/i.test(mainMsg[0]): {
            if (/^help$/i.test(mainMsg[1])) {
                rply.text = await getHelpMessage({ locale, t });
                rply.quotes = true;
                return rply;
            }
            if (/^(reg|register|登記)$/i.test(mainMsg[1])) {
                return handleMeRegister({ rply, translate, userid, botname, mainMsg, groupid });
            }
            return speakAsRegisteredMe({
                rply, translate, inputStr, userid, botname, groupid, channelid, displayname, displaynameDiscord
            });
        }
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

            let myNames = await ensureMyNameSerials(userid);
            sortMyNamesBySerial(myNames);
            if (groupid) {
                let result = showNames(myNames, translate);
                if (typeof result == 'string') rply.text = result;
                else rply.myNames = result;
            } else {
                rply.text = showNamesInText(myNames, translate);
            }
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^(del|delete)$/i.test(mainMsg[1]): {
            rply.text = checkBotname(botname, translate);
            if (rply.text) return rply;
            if (!mainMsg[2]) {
                rply.text = translate('myname.delete_usage');
                return rply
            }
            if (/^\d+$/.test(mainMsg[2])) {
                try {
                    const myNames = await ensureMyNameSerials(userid);
                    const myName = findBySerial(myNames, mainMsg[2]);
                    if (!myName) {
                        rply.text = translate('myname.delete_error');
                        return rply;
                    }
                    const result = await schema.myName.deleteOne({ _id: myName._id });
                    if (result.deletedCount) {
                        await clearMyNameDefault(userid, myName._id);
                        rply.text = translate('myname.delete_success', {
                            name: myName.name,
                            serial: myName.serial,
                            shortNameLine: myName.shortName
                                ? translate('myname.delete_success_alias', { shortName: myName.shortName })
                                : ''
                        })
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
                    await clearMyNameDefault(userid, myNames._id);
                    rply.text = translate('myname.delete_success', {
                        name: myNames.name,
                        serial: myNames.serial,
                        shortNameLine: myNames.shortName
                            ? translate('myname.delete_success_alias', { shortName: myNames.shortName })
                            : ''
                    })
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
                const existingMyName = await schema.myName.findOne({ userID: userid, name: checkName.name }).lean();
                if (!existingMyName) {
                    const lv = await VIP.viplevelCheckUser(userid, botname);
                    const limit = limitAtArr[lv];
                    const myNamesLength = await schema.myName.countDocuments({ userID: userid });
                    if (myNamesLength >= limit) {
                        rply.text = translate('myname.limit_reached', { limit });
                        rply.quotes = true;
                        return rply;
                    }
                }
                const myNames = await ensureMyNameSerials(userid);
                const serial = findNextSerial(myNames.map(name => name.serial), MYNAME_SERIAL_START);
                myName = await schema.myName.findOneAndUpdate(
                    { userID: userid, name: checkName.name },
                    {
                        $set: { imageLink: checkName.imageLink, shortName: checkName.shortName },
                        $setOnInsert: { serial }
                    },
                    opt
                );
            } catch {
                rply.text = translate('myname.add_error');
                return rply;
            }
            const useHint = myName.shortName
                ? `.me${myName.serial} / .me${myName.shortName}`
                : `.me${myName.serial}`;
            rply.text = translate('myname.add_success', {
                name: myName.name,
                serial: myName.serial,
                shortNameLine: myName.shortName
                    ? translate('myname.add_success_alias', { shortName: myName.shortName })
                    : '',
                hint: useHint
            });
            let myNames = await ensureMyNameSerials(userid);
            sortMyNamesBySerial(myNames);
            let nameResult = showName(myNames, myName.name, translate);
            if (groupid) {
                rply.myNames = [nameResult];
            } else {
                rply.text += nameResult.content;
            }
            return rply;
        }
        case /^\.mee$/i.test(mainMsg[0]): {
            // Text .mee is not a speak command. Slash /mee becomes .meN.
            rply.text = translate('myname.me_use_mee');
            rply.quotes = true;
            return rply;
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
                const myName = await findMyNameForUser(userid, checkMeName(mainMsg[0]));
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

async function findMyNameForUser(userid, token) {
    if (token === undefined || token === null || token === '') return null;
    const asText = String(token);
    if (typeof token === 'number' || /^\d+$/.test(asText)) {
        await ensureMyNameSerials(userid);
        const serial = typeof token === 'number' ? token : Number(asText);
        const bySerial = await schema.myName.findOne({ userID: userid, serial }).lean();
        if (bySerial) return bySerial;
    }
    try {
        return await schema.myName.findOne({
            userID: userid,
            shortName: new RegExp('^' + convertRegex(asText) + '$', 'i')
        }).lean();
    } catch (error) {
        console.error('Error finding myName by shortName:', error);
        return null;
    }
}

async function getDefaultMyName(userid, groupid) {
    if (!schema.myNameDefault || !userid || !groupid) return null;
    const doc = await schema.myNameDefault.findOne({ userID: userid, groupID: groupid }).lean();
    if (!doc?.myNameID) return null;
    const myName = await schema.myName.findById(doc.myNameID).lean();
    if (!myName || myName.userID !== userid) {
        await schema.myNameDefault.deleteOne({ userID: userid, groupID: groupid });
        return null;
    }
    return myName;
}

async function clearMyNameDefault(userID, myNameID) {
    try {
        if (!schema.myNameDefault || !userID || !myNameID) return;
        await schema.myNameDefault.deleteMany({ userID, myNameID });
    } catch (error) {
        console.error('Error clearing .me registration:', error);
    }
}

function formatRegisteredMe(myName, translate) {
    return translate('myname.me_reg_current', {
        name: myName.name,
        serial: myName.serial,
        shortNameLine: myName.shortName
            ? translate('myname.me_reg_alias', { shortName: myName.shortName })
            : ''
    });
}

async function handleMeRegister({ rply, translate, userid, botname, mainMsg, groupid }) {
    rply.quotes = true;
    rply.text = checkBotname(botname, translate);
    if (rply.text) return rply;
    if (!groupid) {
        rply.text = translate('myname.channel_only', { command: '.me reg' });
        return rply;
    }
    if (!schema.myNameDefault) {
        rply.text = translate('myname.add_error');
        return rply;
    }

    try {
        const target = mainMsg[2];
        if (!target) {
            const bound = await getDefaultMyName(userid, groupid);
            rply.text = bound ? formatRegisteredMe(bound, translate) : translate('myname.me_reg_usage');
            return rply;
        }
        if (/^(del|delete|off|clear|取消)$/i.test(target)) {
            await schema.myNameDefault.deleteOne({ userID: userid, groupID: groupid });
            rply.text = translate('myname.me_reg_cleared');
            return rply;
        }

        const myName = await findMyNameForUser(userid, target);
        if (!myName) {
            rply.text = translate('myname.me_reg_not_found');
            return rply;
        }
        await schema.myNameDefault.findOneAndUpdate(
            { userID: userid, groupID: groupid },
            { $set: { userID: userid, groupID: groupid, myNameID: myName._id } },
            { upsert: true }
        );
        rply.text = translate('myname.me_reg_success', {
            name: myName.name,
            serial: myName.serial,
            shortNameLine: myName.shortName
                ? translate('myname.me_reg_alias', { shortName: myName.shortName })
                : ''
        });
        return rply;
    } catch (error) {
        console.error('Error registering .me character:', error);
        rply.text = translate('myname.process_error');
        return rply;
    }
}

async function speakAsRegisteredMe({
    rply, translate, inputStr, userid, botname, groupid, channelid, displayname, displaynameDiscord
}) {
    try {
        const text = inputStr.replace(/^\.me\s*/i, '').trim();
        const bound = await getDefaultMyName(userid, groupid);
        if (!bound) {
            rply.text = translate('myname.me_use_mee');
            rply.quotes = true;
            return rply;
        }
        if (!text) {
            rply.text = formatRegisteredMe(bound, translate);
            rply.quotes = true;
            return rply;
        }

        rply.text = checkBotname(botname, translate);
        if (rply.text) return rply;
        if (!groupid) {
            rply.text = translate('myname.channel_only', { command: '.me' });
            rply.quotes = true;
            return rply;
        }

        rply.myNames = [showMessage(bound, `.me ${text}`)];
        saveMyNameRecord(
            channelid || groupid, userid, bound._id, bound.name, bound.imageLink,
            text, displaynameDiscord, displayname, botname
        ).catch(error => console.error('Async error saving registered .me record:', error));
        return rply;
    } catch (error) {
        console.error('Error processing registered .me:', error);
        rply.text = translate('myname.process_error');
        rply.quotes = true;
        return rply;
    }
}

function checkMeName(inputStr) {
    let name = inputStr.replace(/^\.me/i, '');
    if (/^\d+$/.test(name)) {
        name = Number(name)
    }
    return name;
}

async function ensureMyNameSerials(userID) {
    const myNames = await schema.myName.find({ userID }).lean();
    const missingSerials = myNames.filter(name =>
        typeof name.serial !== 'number' || !Number.isFinite(name.serial)
    );
    const { changed } = ensureSerials(myNames, MYNAME_SERIAL_START);
    if (changed) {
        await Promise.all(missingSerials.map(name =>
            schema.myName.updateOne({ _id: name._id }, { $set: { serial: name.serial } })
        ));
    }
    return myNames;
}

function sortMyNamesBySerial(names) {
    names.sort((a, b) => a.serial - b.serial);
}

function showNames(names, translate) {
    let reply = [];
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply[index] = {
                content: name.shortName
                    ? translate('myname.show_embed_alias', { index: name.serial, shortName: name.shortName })
                    : translate('myname.show_embed_name', { index: name.serial, name: name.name }),
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
                    index: name.serial,
                    name: name.name,
                    shortName: name.shortName,
                    image: name.imageLink
                })
                : translate('myname.show_text_name', {
                    index: name.serial,
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
                        ? translate('myname.show_one_alias', { index: name.serial, shortName: name.shortName })
                        : translate('myname.show_one_name', { index: name.serial, name: name.name }),
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
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
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
            
            if (subcommand === 'delete' || subcommand === 'del') {
                const target = interaction.options.getString('target');
                return `.myname del ${target}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('me')
            .setDescription('登記後以該角色發言。未登記請看 .myname help')
            .addStringOption(option =>
                option.setName('character')
                    .setDescription('登記這個群組的角色序號或簡稱')
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName('clear')
                    .setDescription('取消這個群組的登記')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('要發言的內容')
                    .setRequired(false)),
        async execute(interaction) {
            if (interaction.options.getBoolean('clear')) return '.me reg del';
            const character = interaction.options.getString('character');
            if (character) return `.me reg ${character}`;
            const message = interaction.options.getString('message');
            return message ? `.me ${message}` : '.me';
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