"use strict";
if (!process.env.mongoURL) {
    return;
}
let variables = {};
const mathjs = require('mathjs');
const { SlashCommandBuilder } = require('discord.js');
const records = require('../modules/records.js'); // eslint-disable-line no-unused-vars
const VIP = require('../modules/veryImportantPerson');
const schema = require('../modules/schema.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const rollDice = require('./rollbase').rollDiceCommand;
const rollDiceCoc = require('./2-coc').rollDiceCommand;
const rollDiceAdv = require('./0-advroll').rollDiceCommand;
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];
const gameName = (params = {}) => resolveGameName(params, 'character.game_name', '【角色卡功能】 .char (add edit show delete use nonuse button) .ch (set show showall button)');
const gameType = () => 'Tool:trpgcharacter:hktrpg';
const prefixs = () => [{ first: /(^[.]char$)|(^[.]ch$)/ig, second: null }];
const regexName = new RegExp(/name\[(.*?)\]~/, 'i');
const regexState = new RegExp(/state\[(.*?)\]~/, 'i');
const regexRoll = new RegExp(/roll\[(.*?)\]~/, 'i');
const regexNotes = new RegExp(/notes\[(.*?)\]~/, 'i');
const regexImage = new RegExp(/image\[(.*?)\]~/, 'i');
const re = new RegExp(/(.*?):(.*?)(;|$)/, 'ig');
const regexRollDice = new RegExp(/<([^<>]*)>/, 'ig');
// Discord message link regex: https://discord.com/channels/{guildId}/{channelId}/{messageId}
const discordLinkRegex = new RegExp(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/, 'i'); // eslint-disable-line no-unused-vars

const opt = { upsert: true, runValidators: true };
const convertRegex = str => str.replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`);

/**
 * Convert number to emoji digits with zero-padding
 * @param {number} num - The number to convert
 * @param {number} minDigits - Minimum number of digits (for zero-padding)
 * @returns {string} Emoji representation of the number
 */
function numberToEmoji(num, minDigits = 2) {
    const emojiMap = {
        '0': '0️⃣',
        '1': '1️⃣',
        '2': '2️⃣',
        '3': '3️⃣',
        '4': '4️⃣',
        '5': '5️⃣',
        '6': '6️⃣',
        '7': '7️⃣',
        '8': '8️⃣',
        '9': '9️⃣'
    };
    
    // Convert to string and pad with zeros
    const numStr = String(num).padStart(minDigits, '0');
    
    // Convert each digit to emoji
    return [...numStr].map(digit => emojiMap[digit] || digit).join('');
}

/*
TODO?
COC export to roll20?
*/

const getHelpMessage = async (params = {}) => resolveHelp(params, 'character.help');

const initialize = () => variables;

// eslint-disable-next-line no-unused-vars
const rollDiceCommand = async function ({ inputStr, mainMsg, groupid, botname, userid, channelid, discordMessage, discordClient, locale, t }) {
    const translate = getT({ locale, t });
    let rply = { default: 'on', type: 'text', text: '', characterReRoll: false, characterName: '', characterReRollName: '' };
    let filter = {}; // eslint-disable-line no-unused-vars
    let docSwitch = {}; // eslint-disable-line no-unused-vars
    let Card = {}; // eslint-disable-line no-unused-vars
    let temp; // eslint-disable-line no-unused-vars
    let tempMain = {}; // eslint-disable-line no-unused-vars
    let lv; // eslint-disable-line no-unused-vars
    let limit = FUNCTION_LIMIT[0]; // eslint-disable-line no-unused-vars
    let check; // eslint-disable-line no-unused-vars

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        // ...existing code...

        case /(^[.]char$)/i.test(mainMsg[0]) && /^public+/i.test(mainMsg[1]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^unpublic+/i.test(mainMsg[1]):
            return await handlePublicUnpublic(mainMsg, inputStr, userid, rply, translate);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show\d+/i.test(mainMsg[1]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            return await handleShow(mainMsg, userid, rply, translate);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^edit$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleAddEdit(mainMsg, inputStr, userid, groupid, rply, translate);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^use$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
        case /(^[.]char$)/i.test(mainMsg[0]) && /^nonuse$/i.test(mainMsg[1]):
            return await handleUseNonuse(mainMsg, inputStr, userid, groupid, channelid, rply, translate);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleDelete(mainMsg, inputStr, userid, rply, translate);
        case /(^[.]char$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]):
            return await handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply, translate);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^button$/i.test(mainMsg[1]):
            return await handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply, translate);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^set$/i.test(mainMsg[1]) && /^\S+$/i.test(mainMsg[2]) && /^\S+$/i.test(mainMsg[3]):
            return await handleSet(mainMsg, inputStr, userid, groupid, channelid, rply, translate);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^showall$/i.test(mainMsg[1]):
            return await handleShowCh(mainMsg, inputStr, userid, groupid, channelid, rply, translate);
        case /(^[.]ch$)/i.test(mainMsg[0]) && /^\S+$/i.test(mainMsg[1]):
            return await handleCh(mainMsg, inputStr, userid, groupid, channelid, rply, translate);

        default:
            break;
    }
};

async function handlePublicUnpublic(mainMsg, inputStr, userid, rply, translate) {
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+(public|unpublic)\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = translate('character.not_found');
        return rply;
    }
    try {
        doc.public = /^public+/i.test(mainMsg[1]);
        await doc.save();
    } catch (error) {
        console.error('[Character] Update failed:', error);
        rply.text = translate('character.edit_failed', { error });
        return rply;
    }
    rply.text = translate('character.edit_public_success', {
        name: doc.name,
        public: doc.public ? translate('character.public') : translate('character.private')
    });
    return rply;
}

async function handleShow(mainMsg, userid, rply, translate) {
    let filter = { id: userid };
    if (/^show\d+/i.test(mainMsg[1])) {
        let index = Number.parseInt(mainMsg[1].replace(/^show/i, ''));
        let doc = await schema.characterCard.findOne(filter).skip(index).lean().catch(error => console.error('[Character] MongoDB error in show0:', error));
        if (!doc) {
            rply.text = translate('character.show_not_found');
            return rply;
        }
        rply.text = await showCharacter(doc, 'showMode', translate);
        return rply;
    } else {
        rply.text += translate('character.show_list_header');
        let doc = await schema.characterCard.find(filter).lean().catch(error => console.error('[Character] MongoDB error in show:', error));
        rply.buttonCreate = [];
        
        // Calculate minimum digits needed for zero-padding
        // If total count >= 10, pad to 2 digits; if >= 100, pad to 3 digits, etc.
        const totalCount = doc.length;
        const minDigits = totalCount >= 10 ? String(totalCount - 1).length : 1;
        
        rply.text += doc.reduce((text, { name }, index) => {
            rply.buttonCreate.push(`.char use ${name}`);
            const emojiNumber = numberToEmoji(index, minDigits);
            return text + `│ ${emojiNumber} ${name}\n`;
        }, '');

        rply.text += translate('character.show_list_footer');
        return rply;
    }
}

async function handleAddEdit(mainMsg, inputStr, userid, groupid, rply, translate) {
    let Card = await analysicInputCharacterCard(inputStr);
    // Validate input: prohibit duplicate titles and overly long content
    const validationError = await validateCharacterCardInput(Card, translate);
    if (validationError) {
        rply.text = validationError;
        return rply;
    }
    if (!Card.name) {
        rply.text = translate('character.no_name_input');
        return rply;
    }
    let lv = await VIP.viplevelCheckUser(userid);
    let gpLv = await VIP.viplevelCheckGroup(groupid);
    lv = Math.max(gpLv, lv);
    let limit = FUNCTION_LIMIT[lv];
    let check = await schema.characterCard.find({ id: userid }).lean();
    if (check.length >= limit) {
        rply.text = translate('character.limit_reached', { limit });
        return rply;
    }
    let filter = { id: userid, name: new RegExp('^' + convertRegex(Card.name) + '$', "i") };
    let doc = await schema.characterCard.findOne(filter).lean();
    if (doc) {
        doc.name = Card.name;
        Card.state = await Merge(doc.state, Card.state, 'name');
        Card.roll = await Merge(doc.roll, Card.roll, 'name');
        Card.notes = await Merge(doc.notes, Card.notes, 'name');
    }
    try {
        await schema.characterCard.updateOne(filter, Card, opt);
    } catch (error) {
        console.error('[Character] Add character card error:', error);
        rply.text = translate('character.add_failed', { error: error.message });
        return rply;
    }
    rply.text = await showCharacter(Card, 'addMode', translate);
    return rply;
}

async function handleUseNonuse(mainMsg, inputStr, userid, groupid, channelid, rply, translate) {
    if (!groupid) {
        rply.text = translate('character.group_only');
        return rply;
    }
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+use\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = translate('character.not_found');
        return rply;
    }
    try {
        await schema.characterGpSwitch.findOneAndUpdate({
            gpid: channelid || groupid,
            id: userid,
        }, {
            name: doc.name,
            cardId: doc._id
        }, opt);
    } catch (error) {
        console.error('[Character] Update failed:', error);
        rply.text = translate('character.edit_failed', { error });
        return rply;
    }
    rply.text = translate('character.use_success', { name: doc.name });
    return rply;
}

async function handleDelete(mainMsg, inputStr, userid, rply, translate) {
    let filter = { id: userid, name: inputStr.replaceAll(/^\.char\s+delete\s+/ig, '') };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = translate('character.not_found_delete');
        return rply;
    }
    try {
        let filterRemove = { cardId: doc._id };
        await schema.characterCard.findOneAndDelete(filter);
        await schema.characterGpSwitch.deleteMany(filterRemove);
    } catch (error) {
        console.error('[Character] Delete character card error:', error);
        rply.text = translate('character.delete_failed');
        return rply;
    }
    rply.text = translate('character.delete_success', { name: doc.name });
    return rply;
}

async function handleButton(mainMsg, inputStr, userid, groupid, channelid, botname, rply, translate) {
    if (!groupid) {
        rply.text = translate('character.group_only');
        return rply;
    }
    if (botname !== "Discord") {
        rply.text = translate('character.discord_only');
        return rply;
    }
    if (/^\.ch\s+button/i.test(inputStr)) {
        const filter = {
            id: userid,
            gpid: channelid || groupid,
        }
        const docSwitch = await schema.characterGpSwitch.findOne(filter);
        if (docSwitch && docSwitch.cardId) {
            const doc = await schema.characterCard.findOne({
                _id: docSwitch.cardId
            });
            if (doc.roll) {
                rply.requestRollingCharacter = [handleRequestRollingChMode(doc), doc.name, 'ch'];
            }
            return rply;
        }
    }
    let filter = {
        id: userid,
        name: new RegExp('^' + convertRegex(inputStr.replace(/^\.char\s+button\s+/i, '')) + '$', "i")
    };
    let doc = await schema.characterCard.findOne(filter);
    if (!doc) {
        rply.text = translate('character.not_found');
        return rply;
    }
    if (doc.roll)
        rply.requestRollingCharacter = [handleRequestRolling(doc), doc.name, 'char'];
    return rply;
}

async function handleSet(mainMsg, inputStr, userid, groupid, channelid, rply, translate) {
    if (!groupid) {
        rply.text = translate('character.group_only');
        return rply;
    }
    if (!mainMsg[3]) {
        return;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let doc;
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = translate('character.no_registered');
    }
    if (doc) {
        let useTarget = new RegExp(mainMsg[0] + String.raw`\s+` + mainMsg[1] + String.raw`\s+` + convertRegex(mainMsg[2]));
        let useName = convertRegex(mainMsg[2]);
        let useItemA = inputStr.replace(useTarget, '').replace(/^\s+/, '');
        let useCard = [{ name: useName, itemA: useItemA.replace(/^[.]ch\s+/, '').replace(/^[.]char\s+/, '') }];
        doc.state = await Merge(doc.state, useCard, 'name', true);
        doc.roll = await Merge(doc.roll, useCard, 'name', true);
        doc.notes = await Merge(doc.notes, useCard, 'name', true);
        try {
            let a = await doc.save();
            if (a) {
                let resutltState = await findObject(doc.state, mainMsg[2]) || '';
                let resutltNotes = await findObject(doc.notes, mainMsg[2]) || '';
                let resutltRoll = await findObject(doc.roll, mainMsg[2]) || '';
                if (resutltState) {
                    rply.text += a.name + '\n' + resutltState.name + ': ' + resutltState.itemA;
                    rply.text += (resutltState.itemB) ? '/' + resutltState.itemB : '';
                }
                if (resutltNotes) {
                    rply.text += a.name + '\n' + resutltNotes.name + ': ' + resutltNotes.itemA;
                }
                if (resutltRoll) {
                    rply.text += a.name + '\n' + resutltRoll.name + ': ' + resutltRoll.itemA;
                }
                return rply;
            }
        } catch (error) {
            console.error('doc error', doc);
            console.error('inputSTR:', inputStr);
            console.error('[Character] Document save error:', error);
            console.error('更新角色卡失敗:', error);
            rply.text = translate('character.update_failed');
            return rply;
        }
    }
    return;
}

async function handleShowCh(mainMsg, inputStr, userid, groupid, channelid, rply, translate) {
    if (!groupid) {
        rply.text = translate('character.group_only');
        return rply;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    let doc;
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = translate('character.no_registered');
        return rply;
    }
    rply.text = await showCharacter(doc, mainMsg[1] === 'showall' ? 'showAllMode' : 'showMode', translate);
    return rply;
}

async function handleCh(mainMsg, inputStr, userid, groupid, channelid, rply, translate) {
    if (!groupid) {
        rply.text = translate('character.group_only');
        return rply;
    }
    let filter = {
        id: userid,
        gpid: channelid || groupid,
    };
    let docSwitch = await schema.characterGpSwitch.findOne(filter);
    let doc;
    if (docSwitch && docSwitch.cardId) {
        doc = await schema.characterCard.findOne({ _id: docSwitch.cardId });
    } else {
        rply.text = translate('character.no_registered');
        return rply;
    }
    let tempMain = await mainCharacter(doc, mainMsg, inputStr, translate);
    rply = Object.assign({}, rply, tempMain);
    rply.characterName = doc.name;
    return rply;
}

function handleRequestRolling(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        const itemName = new RegExp(convertRegex(roll.name) + '$', 'i');
        text[index] = (itemName.test(roll.itemA)) ? `${roll.itemA}` : `${roll.itemA} [${roll.name}]`;
        text[index] = text[index].slice(0, 80);
    }
    text.push = `.ch use ${doc.name}`;
    return text;
}

function handleRequestRollingChMode(doc) {
    const rolls = doc.roll;
    let text = [];
    for (let index = 0; index < rolls.length; index++) {
        const roll = rolls[index];
        text[index] = `.ch ${roll.name}`;
        text[index] = text[index].slice(0, 80);
    }
    return text;
}

async function mainCharacter(doc, mainMsg, inputStr, translate) {
    let tempMsg = await replacePlaceholders(mainMsg, inputStr, doc);
    mainMsg = tempMsg.split(/\s+/);
    mainMsg.shift();
    let findState = [];
    let findNotes = [];
    let findRoll = {};
    let last = "";
    let tempRply = {
        characterReRoll: false,
        text: '',
        characterReRollName: ''
    };

    // 檢查是否找到任何匹配項
    let foundAnyMatch = false;
    let similarItems = {
        state: [],
        notes: [],
        roll: []
    };

    for (let name in mainMsg) {
        let resutltState = await findObject(doc.state, mainMsg[name]);
        let resutltNotes = await findObject(doc.notes, mainMsg[name]);
        let resutltRoll = await findObject(doc.roll, mainMsg[name]);

        if (resutltRoll) {
            findRoll = resutltRoll;
            last = 'roll';
            foundAnyMatch = true;
        } else if (resutltNotes) {
            last = 'notes';
            await findNotes.push(resutltNotes);
            foundAnyMatch = true;
        } else if (resutltState) {
            last = 'state';
            await findState.push(resutltState);
            foundAnyMatch = true;
        } else if (/^[+-/*]\d+/i.test(mainMsg[name]) && last == 'state') {
            last = '';
            let res = mainMsg[name].charAt(0);
            let number = await countNum(mainMsg[name].slice(1));
            number ? await findState.push(res + number) : null;
        } else if (/^\d+$/i.test(mainMsg[name]) && last == 'state') {
            last = '';
            await findState.push(mainMsg[name]);
        } else {
            last = '';
            // 收集相似項目
            if (doc.state) {
                for (const item of doc.state) {
                    if (item.name.toLowerCase().includes(mainMsg[name].toLowerCase())) {
                        similarItems.state.push(item.name);
                    }
                }
            }
            if (doc.notes) {
                for (const item of doc.notes) {
                    if (item.name.toLowerCase().includes(mainMsg[name].toLowerCase())) {
                        similarItems.notes.push(item.name);
                    }
                }
            }
            if (doc.roll) {
                for (const item of doc.roll) {
                    if (item.name.toLowerCase().includes(mainMsg[name].toLowerCase())) {
                        similarItems.roll.push(item.name);
                    }
                }
            }
        }
    }

    // 如果沒有找到任何匹配項，生成詳細的錯誤訊息
    if (!foundAnyMatch && mainMsg[0]) {
        let errorMessage = translate('character.item_not_found_header');
        errorMessage += translate('character.item_not_found_line', { item: mainMsg[0] });

        if (similarItems.state.length > 0 || similarItems.notes.length > 0 || similarItems.roll.length > 0) {
            errorMessage += translate('character.item_similar_header');

            if (similarItems.state.length > 0) {
                errorMessage += translate('character.item_similar_state');
                for (const item of similarItems.state) {
                    errorMessage += translate('character.item_similar_entry', { name: item });
                }
            }

            if (similarItems.notes.length > 0) {
                errorMessage += translate('character.item_similar_notes');
                for (const item of similarItems.notes) {
                    errorMessage += translate('character.item_similar_entry', { name: item });
                }
            }

            if (similarItems.roll.length > 0) {
                errorMessage += translate('character.item_similar_roll');
                for (const item of similarItems.roll) {
                    errorMessage += translate('character.item_similar_entry', { name: item });
                }
            }
        }

        errorMessage += translate('character.item_usage_footer');

        tempRply.text = errorMessage;
        return tempRply;
    }

    async function myAsyncFn(match, p1) {
        let result = await replacer(doc, p1);
        return result;
    }
    if (Object.keys(findRoll).length > 0) {
        tempRply.characterReRollItem = await replaceAsync(findRoll.itemA, /\{(.*?)\}/ig, await myAsyncFn);
        tempRply.characterReRollItem = await replaceAsync(tempRply.characterReRollItem, /\[\[(.*?)\]\]/ig, await myAsyncFn2);
        tempRply.characterReRollName = findRoll.name;
        tempRply.characterReRoll = true;
    }
    if (Object.keys(findState).length > 0 || Object.keys(findNotes).length > 0) {
        for (let i = 0; i < findState.length; i++) {
            if (typeof (findState[i]) == 'object' && typeof (findState[i + 1]) == 'string') {
                // eslint-disable-next-line unicorn/no-array-for-each
                doc.state.forEach(async (element, index) => {
                    if (element.name === findState[i].name) {
                        if (/^([0-9]*[.])?[0-9]+$/i.test(findState[i + 1])) {
                            doc.state[index].itemA = findState[i + 1];
                        } else {
                            try {
                                // Ensure the current value is a number
                                const currentValue = Number.parseFloat(doc.state[index].itemA);
                                if (Number.isNaN(currentValue)) {
                                    console.error('Invalid current value:', doc.state[index].itemA);
                                    return;
                                }
                                
                                // Parse the operation value
                                const operationValue = Number.parseFloat(findState[i + 1].replace('--', '-'));
                                if (Number.isNaN(operationValue)) {
                                    console.error('Invalid operation value:', findState[i + 1]);
                                    return;
                                }
                                
                                // Perform the operation
                                const result = currentValue + operationValue;
                                if (!Number.isNaN(result)) {
                                    doc.state[index].itemA = result;
                                }
                                    } catch {
            console.error('error of Char:', findState[i + 1]);
                            }
                        }
                    }
                });
            }
            if (typeof (findState[i]) == 'object') {
                tempRply.text += findState[i].name + ': ' + findState[i].itemA;
                if (findState[i].itemB) {
                    tempRply.text += "/" + findState[i].itemB;
                }
                tempRply.text += '　\n';
            }
        }
        try {
            if (doc && doc.db)
                await doc.save();
        } catch (error) {
            console.error('doc SAVE GET ERROR:', error);
        }
        if (findNotes.length > 0) {
            for (let i = 0; i < findNotes.length; i++) {
                tempRply.text += findNotes[i].name + ': ' + findNotes[i].itemA + '　\n';
            }
        }
        if (findState.length > 0 || findNotes.length > 0) {
            tempRply.text = doc.name + '　\n' + tempRply.text;
        }
    }
    return tempRply;
}

async function findObject(doc, mainMsg) {
    let re = mainMsg.replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`);
    let resutlt = doc.find(element => {
        if (element.name)
            return element.name.match(new RegExp('^' + re + '$', 'i'));
    });
    return resutlt;
}
const colorEmoji = [
    "🟫", "🟥", "🟧", "🟨",
];
const colorEmoji2 = [
    "🟢", "🔵", "🟤", "🟣"
];

async function showCharacter(Card, mode, translate) {
    const t = translate || getT({});
    let returnStr = '';
    if (mode == 'addMode') {
        returnStr += t('character.add_success');
        returnStr += t('character.edit_web_hint');
    }
    returnStr += Card.name + '　\n';
    let a = 0;
    if (Card.state.length > 0) {
        for (let i = 0; i < Card.state.length; i++) {
            if (a != 0 && (a) % 4 == 0 && (Card.state[i].itemA || Card.state[i].itemB)) {
                returnStr += '　\n';
            }
            returnStr += colorEmoji[(i + 1) % 4];
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.state[i].name + ': ' + Card.state[i].itemA;
                returnStr += (Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            } else {
                returnStr += (Card.state[i].itemA) ? Card.state[i].name + ': ' + Card.state[i].itemA : '';
                returnStr += (Card.state[i].itemA && Card.state[i].itemB) ? '/' + Card.state[i].itemB : '';
            }
            if (Card.state[i].itemA || Card.state[i].itemB) {
                a++;
            }
            if ((Card.state[i].itemA || Card.state[i].itemB) && mode == 'addMode' || mode == 'showAllMode') {
                returnStr += ' ';
            } else if (Card.state[i].itemA) {
                returnStr += ' ';
            }
        }
        returnStr += '\n-------\n';
    }
    if (Card.roll.length > 0) {
        for (let i = 0; i < Card.roll.length; i++) {
            returnStr += colorEmoji2[(i + 1) % 4];
            if (mode == 'addMode' || mode == 'showAllMode') {
                returnStr += Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ';
            } else {
                returnStr += (Card.roll[i].itemA) ? Card.roll[i].name + ': ' + Card.roll[i].itemA + '  ' : '';
            }
            if (i != 0 && ((i + 1) % 2 == 0 || (i == Card.roll.length - 1))) {
                returnStr += '　\n';
            }
        }
        returnStr += '-------\n';
    }
    if (mode == 'addMode' || mode == 'showAllMode')
        if (Card.notes.length > 0) {
            for (let i = 0; i < Card.notes.length; i++) {
                returnStr += Card.notes[i].name + ': ' + Card.notes[i].itemA + '　\n';
            }
            returnStr += '-------';
        }
    return returnStr;
}

async function replacer(doc, match) {
    let result = "";
    let state = await findObject(doc.state, match);
    if (state && state.itemA) {
        result = state.itemA;
    } else {
        let note = await findObject(doc.notes, match);
        if (note && note.itemA) {
            result = note.itemA;
        }
    }
    return result;
}

async function analysicInputCharacterCard(inputStr) {
    let characterName = (regexName.test(inputStr)) ? inputStr.match(regexName)[1] : '';
    let characterStateTemp = (regexState.test(inputStr)) ? inputStr.match(regexState)[1] : '';
    let characterRollTemp = (regexRoll.test(inputStr)) ? inputStr.match(regexRoll)[1] : '';
    let characterNotesTemp = (regexNotes.test(inputStr)) ? inputStr.match(regexNotes)[1] : '';
    let characterImage = (regexImage.test(inputStr)) ? (inputStr.match(regexImage)[1] || '').trim() : '';
    let characterState = (characterStateTemp) ? await analysicStr(characterStateTemp, true) : [];
    let characterRoll = (characterRollTemp) ? await analysicStr(characterRollTemp, false) : [];
    let characterNotes = (characterNotesTemp) ? await analysicStr(characterNotesTemp, false, 'notes') : [];
    // 不再自動去重，交由驗證階段阻擋重複
    let character = {
        name: characterName.replace(/^\s+/, '').replace(/\s+$/, ''),
        state: characterState,
        roll: characterRoll,
        notes: characterNotes,
        image: characterImage
    };
    return character;
}

// 伺服器端驗證：阻擋重複標題與欄位長度超標
async function validateCharacterCardInput(Card, translate) {
    if (!Card) return translate('character.validation_invalid_input');
    const trimLower = (s) => (s || '').toString().trim().toLowerCase();

    // 名稱長度
    const name = (Card.name || '').toString().trim();
    if (!name) return translate('character.validation_name_empty');
    if (name.length > 50) return translate('character.validation_name_too_long');

    // 工具：找出重複
    const findDuplicates = (arr) => {
        const seen = new Set();
        const dups = new Set();
        for (const it of (arr || [])) {
            const key = trimLower(it && it.name);
            if (!key) continue;
            if (seen.has(key)) dups.add((it.name || '').toString());
            else seen.add(key);
        }
        return [...dups];
    };

    // 欄位長度限制符合 schema.js
    const tooLong = (val, max) => (val || '').toString().length > max;

    const stateDups = findDuplicates(Card.state);
    const rollDups = findDuplicates(Card.roll);
    const notesDups = findDuplicates(Card.notes);
    if (stateDups.length > 0 || rollDups.length > 0 || notesDups.length > 0) {
        let msg = translate('character.validation_duplicates_header');
        if (stateDups.length > 0) msg += translate('character.validation_dup_state', { names: stateDups.join(', ') });
        if (rollDups.length > 0) msg += translate('character.validation_dup_roll', { names: rollDups.join(', ') });
        if (notesDups.length > 0) msg += translate('character.validation_dup_notes', { names: notesDups.join(', ') });
        return msg.trim();
    }

    // 狀態長度
    for (const it of (Card.state || [])) {
        if (!it || !it.name || !it.name.toString().trim()) return translate('character.validation_state_name_empty');
        if (tooLong(it.name, 50)) return translate('character.validation_state_name_too_long', { name: it.name });
        if (tooLong(it.itemA, 50)) return translate('character.validation_state_value_a_too_long', { name: it.name });
        if (tooLong(it.itemB, 50)) return translate('character.validation_state_value_b_too_long', { name: it.name });
    }

    // 擲骰長度
    for (const it of (Card.roll || [])) {
        if (!it || !it.name || !it.name.toString().trim()) return translate('character.validation_roll_name_empty');
        if (tooLong(it.name, 50)) return translate('character.validation_roll_name_too_long', { name: it.name });
        if (tooLong(it.itemA, 150)) return translate('character.validation_roll_content_too_long', { name: it.name });
    }

    // 備註長度
    for (const it of (Card.notes || [])) {
        if (!it || !it.name || !it.name.toString().trim()) return translate('character.validation_notes_name_empty');
        if (tooLong(it.name, 50)) return translate('character.validation_notes_name_too_long', { name: it.name });
        if (tooLong(it.itemA, 1500)) return translate('character.validation_notes_content_too_long', { name: it.name });
    }

    return null;
}

async function analysicStr(inputStr, state, term) {
    let character = [];
    let myArray = [];
    while ((myArray = re.exec(inputStr)) !== null) {
        if (/.*?\/.*/.test(myArray[2]) && state) {
            let temp2 = /(.*)\/(.*)/.exec(myArray[2]);
            myArray[2] = temp2[1];
            myArray[3] = temp2[2];
        }
        myArray[3] = (myArray[3] == ';') ? '' : myArray[3];
        myArray[1] = myArray[1].replaceAll(/\s+/g, '');
        if (term !== "notes") {
            myArray[2] = myArray[2].replace(/\s+[.]ch\s+/i, ' ').replace(/\s+[.]char\s+/i, ' ');
        }
        myArray[2] = myArray[2].replace(/^\s+/, '').replace(/\s+$/, '');
        myArray[3] = myArray[3].replace(/^\s+/, '').replace(/\s+$/, '');
        if (state)
            character.push({
                name: myArray[1],
                itemA: myArray[2],
                itemB: myArray[3]
            });
        else
            character.push({
                name: myArray[1],
                itemA: myArray[2]
            });
    }
    return character;
}

async function Merge(target, source, prop, updateMode) {
    if (!target) target = [];
    if (!source) source = [];
    const mergeByProperty = (target, source, prop) => {
        for (const sourceElement of source) {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop].match(new RegExp('^' + convertRegex(targetElement[prop]) + '$', 'i'));
            });
            if (updateMode)
                targetElement ? Object.assign(targetElement, sourceElement) : '';
            else
                targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        }
    };
    mergeByProperty(target, source, prop);
    return target;
}

async function replacePlaceholders(mainMsg, inputStr, doc) {
    const matches = [...inputStr.matchAll(regexRollDice)];
    const replacedMatches = await Promise.all(matches.map(async (match) => {
        const content = match[1];
        const contentSplit = content.split(/\s+/);
        let replacedContent = content;
        for (const str of contentSplit) {
            const result = await findObject(doc.state, str);
            if (result !== undefined) {
                replacedContent = replacedContent.replace(str, result.itemA);
            }
        }
        return replacedContent;
    }));
    const results = await Promise.all(replacedMatches.map(async (match) => {
        const contentSplit = match.split(/\s+/);
        const [resultOne, resultTwo, resultThree] = await Promise.all([
            rollDice({ mainMsg: contentSplit, inputStr: match }),
            rollDiceCoc({ mainMsg: contentSplit, inputStr: match }),
            rollDiceAdv({ mainMsg: contentSplit, inputStr: match })
        ]);
        const texts = [resultOne?.text, resultTwo?.text, resultThree?.text];
        const numbers = texts
            .map(text => (text ? text.match(/(\d+)(?=\D*$)/) : null))
            .filter(num => num !== null)
            .map(num => num[0]);
        return numbers.length > 0 ? numbers.at(-1) : match;
    }));
    let resultString = inputStr;
    for (const [index, match] of matches.entries()) {
        resultString = resultString.replace(match[0], results[index]);
    }
    return resultString;
}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

async function myAsyncFn2(match, p1) {
    let result = '';
    try {
        result = mathjs.evaluate(p1);
    } catch {
        result = p1;
    }
    return result;
}

async function countNum(num) {
    let result;
    let temp = await rollDice({ mainMsg: [num] });
    if (temp && temp.text) {
        result = temp.text.match(/[+-]?([0-9]*[.])?[0-9]+$/)[0];
    } else if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(num)) {
        result = num;
    }
    return result;
}

// Discord slash commands
const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('char')
            .setDescription('【角色卡功能】管理你的角色卡')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('建立新角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('state')
                            .setDescription('狀態數值 (格式: HP:15/15;MP:10/10;San:80)'))
                    .addStringOption(option =>
                        option.setName('roll')
                            .setDescription('擲骰指令 (格式: 鬥毆: cc 50;射擊: cc 45)'))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註內容')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('edit')
                    .setDescription('修改現有角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('state')
                            .setDescription('狀態數值'))
                    .addStringOption(option =>
                        option.setName('roll')
                            .setDescription('擲骰指令'))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註內容')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示角色卡列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show0')
                    .setDescription('顯示角色卡0號詳細'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('use')
                    .setDescription('使用指定的角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('nonuse')
                    .setDescription('停用當前角色卡'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除指定的角色卡')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('button')
                    .setDescription('生成角色卡按鈕')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('角色卡名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('public')
                    .setDescription('公開角色卡'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unpublic')
                    .setDescription('取消公開角色卡')),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            const name = interaction.options.getString('name');
            const state = interaction.options.getString('state');
            const roll = interaction.options.getString('roll');
            const notes = interaction.options.getString('notes');

            switch (subcommand) {
                case 'add':
                    return `.char add name[${name}]~${state ? `\nstate[${state}]~` : ''}${roll ? `\nroll[${roll}]~` : ''}${notes ? `\nnotes[${notes}]~` : ''}`;
                case 'edit':
                    return `.char edit name[${name}]~${state ? `\nstate[${state}]~` : ''}${roll ? `\nroll[${roll}]~` : ''}${notes ? `\nnotes[${notes}]~` : ''}`;
                case 'show':
                    return `.char show`;
                case 'show0':
                    return `.char show0`;
                case 'use':
                    return `.char use ${name}`;
                case 'nonuse':
                    return `.char nonuse`;
                case 'delete':
                    return `.char delete ${name}`;
                case 'button':
                    return `.char button ${name}`;
                case 'public':
                    return `.char public ${name}`;
                case 'unpublic':
                    return `.char unpublic ${name}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('ch')
            .setDescription('【角色卡操作】操作當前使用的角色卡')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示當前角色卡狀態'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('showall')
                    .setDescription('顯示當前角色卡全部內容'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('button')
                    .setDescription('生成角色卡狀態按鈕'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('設定角色卡數值')
                    .addStringOption(option =>
                        option.setName('item')
                            .setDescription('項目名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('新數值')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('modify')
                    .setDescription('修改角色卡數值')
                    .addStringOption(option =>
                        option.setName('item')
                            .setDescription('項目名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('operation')
                            .setDescription('運算符號 (+/-/*//)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('數值或擲骰指令')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'show':
                    return `.ch show`;
                case 'showall':
                    return `.ch showall`;
                case 'button':
                    return `.ch button`;
                case 'set':
                    return `.ch set ${interaction.options.getString('item')} ${interaction.options.getString('value')}`;
                case 'modify':
                    return `.ch ${interaction.options.getString('item')} ${interaction.options.getString('operation')}${interaction.options.getString('value')}`;
            }
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
    mainCharacter: mainCharacter,
    discordCommand: discordCommand
};