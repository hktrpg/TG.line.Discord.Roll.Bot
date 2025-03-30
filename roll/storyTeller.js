"use strict";
const { SlashCommandBuilder } = require('discord.js');
const StoryEngine = require('../modules/storyTeller/storyEngine');
const schema = require('../modules/schema.js');
const debug = require('debug')('roll:storyTeller');
const crypto = require('crypto');

const gameName = function () {
    return '【故事引擎】'
}

const gameType = function () {
    return 'Story:Demo:hktrpg'
}

const prefixs = function () {
    return [{
        first: /^[.]st$/i,
        second: /^(import|start|load|save|choice|roll|debug|help)$/i
    }]
}

const initialize = function () {
    return {};
}

const getHelpMessage = function () {
    return `【故事引擎】
.st import - 匯入新的故事劇本
.st start [故事ID] - 開始一個故事
.st choice [選項ID] - 選擇一個選項
.st save - 儲存目前進度
.st load [存檔ID] - 載入存檔
.st var [名稱] [值] - 設置變量
.st stats - 顯示當前狀態
.st inventory - 顯示物品欄
.st debug - 顯示除錯資訊 (需要管理員權限)
.st help - 顯示此說明`;
}

const parseStoryScript = function (scriptText) {
    const lines = scriptText.split('\n');
    let currentChapter = '';
    const story = {
        title: '',
        chapters: [],
        labels: {},
        variables: [],
        stats: new Set(),  // 使用 Set 來儲存唯一的 stats
        content: []
    };

    let inIfBlock = false;
    let currentIfBlock = null;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('//')) continue;

        // Parse title
        if (line.startsWith('# ')) {
            story.title = line.substring(2).trim();
            continue;
        }

        // Parse chapter
        if (line.startsWith('== ') && line.endsWith(' ==')) {
            currentChapter = line.substring(3, line.length - 3).trim();
            story.chapters.push({
                name: currentChapter,
                content: []
            });
            continue;
        }

        // Parse commands
        if (line.startsWith('[') && line.includes(']')) {
            const commandPart = line.substring(1, line.indexOf(']'));
            const textPart = line.substring(line.indexOf(']') + 1).trim();
            const parts = commandPart.split(' ');
            const command = parts[0];

            let block = null;

            switch (command) {
                case 'text':
                    block = {
                        type: 'text',
                        content: textPart || line.substring(line.indexOf(']') + 1).trim()
                    };
                    if (inIfBlock) {
                        currentIfBlock.content.push(block);
                    } else {
                        story.content.push(block);
                    }
                    break;

                case 'stat_show':
                    const stats = parts.slice(1).join('').split(',').map(s => s.trim());
                    stats.forEach(stat => story.stats.add(stat));
                    block = {
                        type: 'stat_show',
                        stats: stats
                    };
                    break;

                case 'stat_modify':
                    if (parts.length >= 3) {
                        const stat = parts[1];
                        const value = parts.slice(2).join(' ');
                        story.stats.add(stat);
                        block = {
                            type: 'stat_modify',
                            stat: stat,
                            value: value
                        };
                    }
                    break;

                case 'choice':
                    block = {
                        type: 'choice',
                        content: textPart || '請選擇：',
                        choices: [],
                        labels: []
                    };
                    break;

                case 'if':
                    inIfBlock = true;
                    currentIfBlock = {
                        type: 'if',
                        condition: parts.slice(1).join(' '),
                        content: [],
                        elseContent: [],
                        hasElse: false
                    };
                    continue;

                case 'else':
                    if (inIfBlock && currentIfBlock) {
                        currentIfBlock.hasElse = true;
                    }
                    continue;

                case 'endif':
                    if (inIfBlock && currentIfBlock) {
                        block = currentIfBlock;
                        inIfBlock = false;
                        currentIfBlock = null;
                    }
                    break;

                case 'roll':
                    block = {
                        type: 'roll',
                        dice: parts.slice(1).join(' ')
                    };
                    break;

                case 'label':
                    const labelName = parts[1];
                    story.labels[labelName] = story.content.length;
                    debug(`Added label: ${labelName} at index ${story.content.length}`);
                    continue;

                case 'var':
                    const varMatch = line.match(/\[var\]\s+(\w+)\s*=\s*(.+)/);
                    if (varMatch) {
                        story.variables.push({
                            name: varMatch[1],
                            defaultValue: varMatch[2].trim()
                        });
                    }
                    continue;

                case 'image':
                    block = {
                        type: 'image',
                        path: parts[1]
                    };
                    break;

                case 'portrait':
                    block = {
                        type: 'portrait',
                        character: parts[1],
                        position: parts[2] || 'left'
                    };
                    break;

                case 'emote':
                    block = {
                        type: 'emote',
                        emotion: parts[1]
                    };
                    break;

                case 'debug':
                    block = {
                        type: 'debug',
                        command: parts[1],
                        params: parts.slice(2)
                    };
                    break;
            }

            if (block) {
                if (inIfBlock && currentIfBlock) {
                    currentIfBlock.content.push(block);
                } else {
                    story.content.push(block);
                }
            }
            continue;
        }

        // Parse choices
        if (line.startsWith('-> ')) {
            const choiceMatch = line.match(/->\s+(.+?)\s+\|\s+(\w+)/);
            if (choiceMatch) {
                const lastBlock = inIfBlock ? 
                    currentIfBlock.content[currentIfBlock.content.length - 1] :
                    story.content[story.content.length - 1];
                
                if (lastBlock && lastBlock.type === 'choice') {
                    if (!lastBlock.choices) {
                        lastBlock.choices = [];
                    }
                    
                    lastBlock.choices.push({
                        text: choiceMatch[1],
                        goto: choiceMatch[2],
                        id: choiceMatch[2]
                    });
                    
                    debug(`Added choice: ${choiceMatch[1]} -> ${choiceMatch[2]}`);
                }
            }
            continue;
        }
    }

    // Convert stats Set to Array
    story.stats = Array.from(story.stats);

    return story;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    try {
        switch (mainMsg[1]?.toLowerCase()) {
            case 'import':
                const scriptText = inputStr.substring(inputStr.indexOf('import') + 6).trim();
                if (!scriptText) {
                    return { text: '請提供故事劇本' };
                }

                const story = {
                    title: '',
                    content: [],
                    variables: [],
                    labels: {},
                    stats: []
                };

                const lines = scriptText.split('\n');
                let currentBlock = null;
                let textBuffer = [];

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i].trim();
                    if (!line || line.startsWith('//')) continue;

                    if (line.startsWith('# ')) {
                        story.title = line.substring(2).trim();
                        continue;
                    }

                    if (line.startsWith('[text]')) {
                        textBuffer.push({
                            type: 'text',
                            content: line.substring(line.indexOf(']') + 1).trim()
                        });
                    } else if (line.startsWith('[choice]')) {
                        // 先添加之前的文本
                        if (textBuffer.length > 0) {
                            story.content.push(...textBuffer);
                            textBuffer = [];
                        }

                        currentBlock = {
                            type: 'choice',
                            content: '請選擇：',
                            choices: []
                        };
                        story.content.push(currentBlock);
                    } else if (line.startsWith('-> ')) {
                        if (currentBlock && currentBlock.type === 'choice') {
                            const match = line.match(/->\s+(.+?)\s+\|\s+(\w+)/);
                            if (match) {
                                currentBlock.choices.push({
                                    text: match[1],
                                    goto: match[2],
                                    id: match[2]
                                });
                            }
                        }
                    } else if (line.startsWith('[stat_modify]')) {
                        const parts = line.substring(line.indexOf(']') + 1).trim().split(' ');
                        story.content.push({
                            type: 'stat_modify',
                            stat: parts[0],
                            value: parseInt(parts[1])
                        });
                    } else if (line.startsWith('[stat_show]')) {
                        const stats = line.substring(line.indexOf(']') + 1).trim().split(',').map(s => s.trim());
                        story.content.push({
                            type: 'stat_show',
                            stats: stats
                        });
                    } else if (line.startsWith('[label]')) {
                        const labelName = line.substring(line.indexOf(']') + 1).trim();
                        story.labels[labelName] = story.content.length;
                    } else if (line.startsWith('[var]')) {
                        const varMatch = line.match(/\[var\]\s+(\w+)\s*=\s*(.+)/);
                        if (varMatch) {
                            story.variables.push({
                                name: varMatch[1],
                                value: varMatch[2].trim()
                            });
                        }
                    } else if (line.startsWith('[image]')) {
                        story.content.push({
                            type: 'image',
                            path: line.substring(line.indexOf(']') + 1).trim()
                        });
                    } else if (line.startsWith('[portrait]')) {
                        story.content.push({
                            type: 'portrait',
                            character: line.substring(line.indexOf(']') + 1).trim().split(' ')[0],
                            position: line.substring(line.indexOf(']') + 1).trim().split(' ')[1] || 'left'
                        });
                    }
                }

                // 添加剩餘的文本
                if (textBuffer.length > 0) {
                    story.content.push(...textBuffer);
                }

                // 生成故事 ID
                const storyId = crypto.createHash('md5').update(scriptText).digest('hex').substring(0, 8);

                // 在保存前檢查並修復 choice 節點
                story.content = story.content.map(node => {
                    if (node.type === 'choice') {
                        return {
                            ...node,
                            choices: Array.isArray(node.choices) ? node.choices : [],
                            content: node.content || '請選擇：'
                        };
                    }
                    return node;
                });

                // 保存到數據庫
                await schema.storyScript.findOneAndUpdate(
                    { id: storyId },
                    {
                        $set: {
                            id: storyId,
                            title: story.title,
                            author: displayname,
                            content: story.content,
                            variables: story.variables,
                            labels: story.labels,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true, new: true }  // 添加 new: true 來獲取更新後的文檔
                );

                rply.text = `故事「${story.title}」已匯入！\n故事ID: ${storyId}\n使用 .st start ${storyId} 來開始遊戲`;
                break;

            case 'start':
                if (!mainMsg[2]) return { text: '請指定故事ID' };
                const engine = new StoryEngine(`${groupid || userid}-${Date.now()}`);
                const initialState = await engine.initialize(mainMsg[2], userid, groupid, channelid);
                rply.text = initialState.text;
                if (initialState.choices) {
                    rply.text += '\n\n選項:\n' + initialState.choices.map(c => `-> ${c.text}`).join('\n');
                }
                break;

            case 'choice':
                if (!mainMsg[2]) return { text: '請指定選項' };
                const choiceEngine = new StoryEngine(`${groupid || userid}`);
                const choiceResult = await choiceEngine.processCommand('choice', { choice: mainMsg[2] });
                rply.text = choiceResult.text;
                if (choiceResult.choices) {
                    rply.text += '\n\n選項:\n' + choiceResult.choices.map(c => `-> ${c.text}`).join('\n');
                }
                break;

            case 'save':
                const saveEngine = new StoryEngine(`${groupid || userid}`);
                const saveResult = await saveEngine.processCommand('save');
                rply.text = saveResult.text;
                break;

            case 'load':
                if (!mainMsg[2]) return { text: '請指定存檔ID' };
                const loadEngine = new StoryEngine(`${groupid || userid}`);
                const loadResult = await loadEngine.loadGame(mainMsg[2]);
                rply.text = loadResult.text;
                if (loadResult.choices) {
                    rply.text += '\n\n選項:\n' + loadResult.choices.map(c => `-> ${c.text}`).join('\n');
                }
                break;

            case 'var':
                if (!mainMsg[2] || !mainMsg[3]) {
                    return { text: '請指定變量名稱和值' };
                }
                const varEngine = new StoryEngine(`${groupid || userid}`);
                const varResult = await varEngine.processCommand('var', {
                    name: mainMsg[2],
                    value: mainMsg.slice(3).join(' ')
                });
                rply.text = varResult.text;
                break;

            case 'stats':
                const statsEngine = new StoryEngine(`${groupid || userid}`);
                const statsResult = await statsEngine.processCommand('stats');
                rply.text = '當前狀態：\n' + 
                    Object.entries(statsResult.stats)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                break;

            case 'inventory':
                const invEngine = new StoryEngine(`${groupid || userid}`);
                const invResult = await invEngine.processCommand('inventory');
                rply.text = '物品欄：\n' + 
                    invResult.inventory
                        .map(item => `${item.itemId} x${item.quantity}`)
                        .join('\n');
                break;

            case 'help':
                rply.text = getHelpMessage();
                break;

            case 'debug':
                if (userrole !== 3) return { text: '權限不足' };
                const debugEngine = new StoryEngine(`${groupid || userid}`);
                const debugResult = await debugEngine.processCommand('debug', { command: mainMsg[2] });
                rply.text = debugResult.text;
                break;

            default:
                rply.text = getHelpMessage();
                break;
        }
    } catch (error) {
        debug('Error in command:', error);
        rply.text = '發生錯誤:' + error.message;
    }

    return rply;
}

module.exports = {
    rollDiceCommand,
    initialize,
    prefixs,
    gameType,
    gameName,
    getHelpMessage
}; 