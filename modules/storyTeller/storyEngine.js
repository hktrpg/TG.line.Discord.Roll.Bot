const schema = require('../schema.js');
const debug = require('debug')('storyTeller:engine');

class StoryEngine {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.currentState = {
            currentNodeIndex: 0,
            stats: {},
            inventory: [],
            variables: {},
            storyId: null  // 確保初始化時有這個字段
        };
        this.story = null;
        this.visitedLabels = [];
    }

    async initialize(storyId, userId, groupId = null, channelId = null) {
        console.log(`[StoryEngine] Initializing story session - Story ID: ${storyId}, User ID: ${userId}`);
        await this._logDebug(`Initializing story session - Story ID: ${storyId}, User ID: ${userId}`);
        
        // 載入故事腳本
        this.story = await schema.storyScript.findOne({ id: storyId });
        console.log(`[StoryEngine] Found story:`, this.story ? 'yes' : 'no');
        
        if (!this.story) {
            const error = new Error(`Story not found with ID: ${storyId}`);
            console.error(`[StoryEngine] ${error.message}`);
            await this._logError(error);
            throw error;
        }

        // 檢查故事內容
        if (!this.story.content) {
            this.story.content = [];  // 初始化為空數組而不是 undefined
            await this._logDebug('Story content initialized as empty array');
        }

        await this._logDebug(`Found story: ${this.story.title}`);
        await this._logDebug(`Story content: ${JSON.stringify(this.story.content)}`);
        console.log(`[StoryEngine] Story content length: ${this.story.content.length}`);

        // 創建或載入進度
        let existingProgress = await schema.storyProgress.findOne({ 
            sessionId: this.sessionId 
        });

        if (existingProgress) {
            console.log(`[StoryEngine] Found existing progress for session ${this.sessionId}`);
            await this._logDebug(`Found existing progress for session ${this.sessionId}`);
            this.currentState = existingProgress;
        } else {
            console.log(`[StoryEngine] Creating new progress`);
            await this._logDebug('Creating new progress');
            const initialState = {
                sessionId: this.sessionId,
                storyId,
                userId,
                groupId,
                channelId,
                currentNodeIndex: 0,
                variables: this._initializeVariables(),
                stats: this._initializeStats(),
                inventory: [],
                completed: false,
                lastUpdated: new Date()
            };
            
            this.currentState = await schema.storyProgress.create(initialState);
            
            if (this.currentState.currentNodeIndex === undefined) {
                this.currentState.currentNodeIndex = 0;
                await this._logDebug('Fixing currentNodeIndex to 0');
            }
        }

        console.log(`[StoryEngine] Current node index: ${this.currentState.currentNodeIndex}`);
        await this._logDebug(`Current node index: ${this.currentState.currentNodeIndex}`);
        
        // 確保保存 storyId
        this.currentState.storyId = storyId;
        
        // 更新進度
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    storyId,
                    lastUpdated: new Date()
                }
            }
        );

        // 在載入故事後初始化標籤
        await this._initializeLabels();

        const result = await this._processCurrentNode(true);
        console.log(`[StoryEngine] Process result:`, result);
        return {
            ...result,
            sessionId: this.sessionId
        };
    }

    _initializeVariables() {
        const variables = {};
        if (this.story && this.story.variables) {
            this.story.variables.forEach(v => {
                variables[v.name] = v.defaultValue;
            });
        }
        // 添加一些基本變數
        variables.roll_result = 0;
        variables.last_choice = '';
        variables.game_started = new Date().toISOString();
        
        return variables;
    }

    _initializeStats() {
        const stats = {};
        if (this.story && this.story.content) {
            this.story.content.forEach(node => {
                if (node.type === 'stat_modify') {
                    // 檢查 value 是否已經是數字
                    if (typeof node.value === 'number') {
                        stats[node.stat] = node.value;
                    } else if (typeof node.value === 'string') {
                        // 如果是字符串，先檢查是否有運算符
                        const operator = node.value.charAt(0);
                        if (['+', '-', '*', '/'].includes(operator)) {
                            // 如果有運算符，取運算符後面的數值
                            stats[node.stat] = parseInt(node.value.substring(1));
                        } else {
                            // 如果沒有運算符，直接轉換為數字
                            stats[node.stat] = parseInt(node.value);
                        }
                    }
                }
            });
        }
        return stats;
    }

    async getInitialState() {
        if (!this.story || !this.currentState) {
            throw new Error('Story not initialized');
        }

        return await this._processCurrentNode();
    }

    async _processCurrentNode(isInitial = false) {
        await this._logDebug(`Processing node - Index: ${this.currentState.currentNodeIndex}, Initial: ${isInitial}`);
        
        if (!this.story || !this.story.content) {
            throw new Error('Story or content not found');
        }

        // 如果是初始狀態，收集所有文本直到第一個選項
        if (isInitial) {
            let currentIndex = 0;
            let combinedText = [];
            let images = [];
            
            while (currentIndex < this.story.content.length) {
                const node = this.story.content[currentIndex];
                await this._logDebug(`Processing node at index ${currentIndex}: ${JSON.stringify(node)}`);
                
                if (!node) {
                    await this._logDebug(`Invalid node at index ${currentIndex}`);
                    currentIndex++;
                    continue;
                }

                switch (node.type) {
                    case 'text':
                        combinedText.push(node.content);
                        currentIndex++;
                        break;
                        
                    case 'stat_show':
                        const statsText = node.stats
                            .map(stat => `${stat}: ${this.currentState.stats[stat] || 0}`)
                            .join(', ');
                        combinedText.push(statsText);
                        currentIndex++;
                        break;
                        
                    case 'image':
                        images.push({ type: 'background', path: node.path });
                        currentIndex++;
                        break;
                        
                    case 'portrait':
                        images.push({ type: 'portrait', path: node.character, position: node.position });
                        currentIndex++;
                        break;
                        
                    case 'stat_modify':
                        await this._modifyStat(node.stat, node.value);
                        currentIndex++;
                        break;
                        
                    case 'choice':
                        await this._logDebug(`Found choice node: ${JSON.stringify(node)}`);
                        this.currentState.currentNodeIndex = currentIndex;
                        
                        if (!node.choices) {
                            await this._logDebug('No choices found in choice node');
                            node.choices = [];
                        }
                        
                        // 更新數據庫中的當前節點索引
                        await schema.storyProgress.updateOne(
                            { sessionId: this.sessionId },
                            { 
                                $set: { 
                                    currentNodeIndex: currentIndex,
                                    lastUpdated: new Date()
                                }
                            }
                        );
                        
                        return {
                            text: combinedText.join('\n\n'),
                            choices: node.choices.map(choice => ({
                                text: choice.text,
                                id: choice.goto
                            })),
                            stats: this.currentState.stats,
                            inventory: this.currentState.inventory,
                            images: images
                        };
                        
                    default:
                        currentIndex++;
                        break;
                }
            }
            
            return {
                text: combinedText.join('\n\n'),
                choices: [],
                stats: this.currentState.stats,
                inventory: this.currentState.inventory,
                images: images,
                completed: true
            };
        }

        // 非初始狀態的處理邏輯
        const node = this.story.content[this.currentState.currentNodeIndex];
        if (!node) {
            await this._logDebug('No node found at current index');
            return {
                text: '故事結束',
                completed: true,
                stats: this.currentState.stats,
                inventory: this.currentState.inventory
            };
        }

        await this._logDebug(`Processing node: ${JSON.stringify(node)}`);
        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats,
            inventory: this.currentState.inventory,
            images: []
        };

        switch (node.type) {
            case 'text':
                result.text = node.content;
                await this._moveToNextNode();
                break;
            case 'choice':
                result.text = node.content;
                result.choices = node.choices;
                // Don't automatically move to next node for choice nodes
                break;
            case 'stat_modify':
                await this._modifyStat(node.stat, node.value);
                await this._moveToNextNode();
                break;
            case 'stat_show':
                result.stats = this.currentState.stats;
                await this._moveToNextNode();
                break;
            case 'image':
                result.images.push({ type: 'background', path: node.path });
                await this._moveToNextNode();
                break;
            case 'portrait':
                result.images.push({ type: 'portrait', path: node.character, position: node.position });
                await this._moveToNextNode();
                break;
            case 'item_add':
                await this._addItem(node.itemId, node.quantity || 1);
                await this._moveToNextNode();
                break;
            case 'roll':
                const rollResult = await this._handleRoll(node.dice);
                this.currentState.variables.roll_result = rollResult;
                result.text = `擲骰結果: ${rollResult}`;
                result.roll = {
                    dice: node.dice,
                    result: rollResult
                };
                await this._moveToNextNode();
                break;
            case 'if':
                const condition = await this._evaluateCondition(node.condition);
                if (condition) {
                    if (node.content && Array.isArray(node.content)) {
                        for (const contentNode of node.content) {
                            await this._processNode(contentNode, result);
                        }
                    }
                } else if (node.hasElse && node.elseContent) {
                    for (const contentNode of node.elseContent) {
                        await this._processNode(contentNode, result);
                    }
                }
                await this._moveToNextNode();
                break;
            default:
                await this._moveToNextNode();
                break;
        }

        // If we processed a node that didn't generate any content, process the next node
        if (!result.text && !result.choices.length && this.currentState.currentNodeIndex < this.story.content.length) {
            const nextResult = await this._processCurrentNode();
            result = { ...result, ...nextResult };
        }

        await this._logDebug('Processed node result - Text:', result.text, ', Choices:', result.choices.length);
        await this._saveProgress();

        return result;
    }

    async _handleChoice(choiceId) {
        const currentNode = this._getCurrentNode();
        if (currentNode.type !== 'choice') {
            await this._logDebug('Not a choice node:', currentNode);
            return false;
        }

        const selectedChoice = currentNode.choices.find(c => c.id === choiceId || c.goto === choiceId);
        if (!selectedChoice) {
            await this._logDebug('Invalid choice:', choiceId);
            return false;
        }

        await this._logDebug('Selected choice:', JSON.stringify(selectedChoice));

        // Find the target node index for the selected choice
        const targetIndex = await this._findLabelByGoto(selectedChoice.goto);
        if (targetIndex === -1) {
            await this._logDebug('Target node not found for goto:', selectedChoice.goto);
            return false;
        }

        await this._logDebug(`Found target node at index: ${targetIndex}`);

        // If the target is the same as current node, move to next node
        if (targetIndex === this.currentState.currentNodeIndex) {
            await this._moveToNextNode();
        } else {
            this.currentState.currentNodeIndex = targetIndex;
        }

        // Process the target node and any subsequent nodes
        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats,
            inventory: this.currentState.inventory,
            images: []
        };

        // Process nodes until we hit another choice or the end
        while (this.currentState.currentNodeIndex < this.story.content.length) {
            const node = this.story.content[this.currentState.currentNodeIndex];
            if (!node) {
                await this._moveToNextNode();
                continue;
            }

            await this._logDebug(`Processing node after choice: ${JSON.stringify(node)}`);

            if (node.type === 'choice') {
                result.choices = node.choices;
                await this._logDebug('Found next choice node, stopping processing');
                break;
            }

            const nodeResult = await this._processNode(node);
            if (nodeResult) {
                result.text += (result.text ? '\n\n' : '') + (nodeResult.text || '');
                result.images = [...result.images, ...(nodeResult.images || [])];
            }

            await this._moveToNextNode();
        }
        
        // Save progress after processing the choice
        await this._saveProgress();
        
        // Return the result with the session ID
        return {
            ...result,
            sessionId: this.sessionId
        };
    }

    _findLabelByGoto(goto) {
        // First try direct label lookup
        if (this.story.labels && this.story.labels[goto] !== undefined) {
            return this.story.labels[goto];
        }

        // If not found, search through content for matching label
        for (let i = 0; i < this.story.content.length; i++) {
            const node = this.story.content[i];
            if (node.label === goto || (node.type === 'choice' && node.label === goto)) {
                return i;
            }
        }

        // If still not found, try to find a node with matching content
        for (let i = 0; i < this.story.content.length; i++) {
            const node = this.story.content[i];
            if (node.type === 'text' && node.content && node.content.includes(goto)) {
                return i;
            }
        }

        return -1;
    }

    async _saveProgress() {
        await this._logDebug('Saving progress');
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    currentNodeIndex: this.currentState.currentNodeIndex,
                    stats: this.currentState.stats,
                    inventory: this.currentState.inventory,
                    variables: this.currentState.variables,
                    lastUpdated: new Date()
                }
            },
            { upsert: true }
        );
    }

    async _moveToNextNode() {
        await this._logDebug(`Moving to next node - Current: ${this.currentState.currentNodeIndex}`);
        this.currentState.currentNodeIndex++;
        await this._logDebug(`New node index: ${this.currentState.currentNodeIndex}`);
        
        // 更新數據庫中的當前節點索引
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    currentNodeIndex: this.currentState.currentNodeIndex,
                    lastUpdated: new Date()
                }
            }
        );
    }

    async _gotoLabel(label) {
        await this._logDebug(`Going to label: ${label}`);
        
        // 確保故事和標籤存在
        if (!this.story || !this.story.labels) {
            const error = new Error('Story or labels not found');
            await this._logError(error);
            throw error;
        }

        const labelIndex = this.story.labels[label];
        if (labelIndex === undefined) {
            const error = new Error(`Label not found: ${label}`);
            await this._logError(error);
            throw error;
        }

        await this._logDebug(`Found label index: ${labelIndex}`);
        
        this.currentState.currentNodeIndex = labelIndex;
        
        // 更新進度
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    currentNodeIndex: labelIndex,
                    lastUpdated: new Date()
                }
            }
        );
    }

    async _evaluateCondition(condition) {
        await this._logDebug(`Evaluating condition: ${condition}`);
        try {
            // Handle logical operators (&&, ||)
            if (condition.includes('&&') || condition.includes('||')) {
                const parts = condition.split(/(&&|\|\|)/).map(s => s.trim());
                let result = await this._evaluateCondition(parts[0]);
                
                for (let i = 1; i < parts.length; i += 2) {
                    const operator = parts[i];
                    const nextResult = await this._evaluateCondition(parts[i + 1]);
                    
                    if (operator === '&&') {
                        result = result && nextResult;
                    } else if (operator === '||') {
                        result = result || nextResult;
                    }
                }
                
                return result;
            }

            // Handle stat comparisons
            if (condition.includes('>')) {
                const [stat1, stat2] = condition.split('>').map(s => s.trim());
                const value1 = this.currentState.stats[stat1] || 0;
                const value2 = parseInt(stat2) || 0;
                await this._logDebug(`Comparing ${stat1}(${value1}) > ${stat2}(${value2})`);
                return value1 > value2;
            }

            // Handle variable comparisons
            if (condition.includes('===') || condition.includes('==')) {
                const [left, right] = condition.split(/===|==/).map(s => s.trim());
                
                // Get the actual values from variables
                let leftValue = this.currentState.variables[left];
                let rightValue = right;

                // If the right side is a variable name, get its value
                if (this.currentState.variables[right] !== undefined) {
                    rightValue = this.currentState.variables[right];
                }

                // Remove quotes if present
                leftValue = String(leftValue || '').replace(/"/g, '');
                rightValue = String(rightValue || '').replace(/"/g, '');
                
                await this._logDebug(`Comparing values: "${leftValue}" === "${rightValue}"`);
                return leftValue === rightValue;
            }

            return false;
        } catch (error) {
            await this._logError(error);
            return false;
        }
    }

    async _modifyStat(stat, modification) {
        await this._logDebug(`Modifying stat ${stat} with value ${modification}`);
        const currentValue = this.currentState.stats[stat] || 0;
        
        if (typeof modification === 'number') {
            this.currentState.stats[stat] = currentValue + modification;
            await this._logDebug(`Stat ${stat} updated to ${this.currentState.stats[stat]}`);
            return;
        }

        if (typeof modification === 'string') {
            const operator = modification.charAt(0);
            const value = parseInt(modification.substring(1));

            switch (operator) {
                case '+': 
                    this.currentState.stats[stat] = currentValue + value; 
                    break;
                case '-': 
                    this.currentState.stats[stat] = currentValue - value; 
                    break;
                case '*': 
                    this.currentState.stats[stat] = currentValue * value; 
                    break;
                case '/': 
                    this.currentState.stats[stat] = currentValue / value; 
                    break;
                default: 
                    this.currentState.stats[stat] = currentValue + parseInt(modification);
            }
            await this._logDebug(`Stat ${stat} updated to ${this.currentState.stats[stat]}`);
        }
    }

    async _addItem(itemId, quantity) {
        if (!this.currentState.inventory) {
            this.currentState.inventory = [];
        }

        // 從故事內容中查找物品描述
        const itemDescription = await this._findItemDescription(itemId);
        
        const existingItem = this.currentState.inventory.find(i => i.itemId === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.currentState.inventory.push({ 
                itemId, 
                quantity,
                description: itemDescription
            });
        }

        // 更新數據庫
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    inventory: this.currentState.inventory,
                    variables: this.currentState.variables,
                    lastUpdated: new Date()
                }
            }
        );
    }

    async _findItemDescription(itemId) {
        if (!this.story || !this.story.content) {
            return '';
        }

        // 尋找物品描述節點
        for (const node of this.story.content) {
            if (node.type === 'item_description' && node.itemId === itemId) {
                return node.description;
            }
        }

        return '';
    }

    async _handleRoll(diceString) {
        await this._logDebug(`Rolling dice: ${diceString}`);
        const parts = diceString.split('+').map(p => p.trim());
        let total = 0;
        let details = [];

        for (const part of parts) {
            if (part.includes('d')) {
                const [count, sides] = part.split('d').map(Number);
                let subtotal = 0;
                for (let i = 0; i < count; i++) {
                    const roll = Math.floor(Math.random() * sides) + 1;
                    subtotal += roll;
                }
                total += subtotal;
                details.push(`${part}: ${subtotal}`);
            } else if (this.currentState.stats[part]) {
                total += this.currentState.stats[part];
                details.push(`${part}: ${this.currentState.stats[part]}`);
            } else {
                const num = parseInt(part);
                if (!isNaN(num)) {
                    total += num;
                    details.push(`${num}`);
                }
            }
        }

        await this._logDebug(`Roll details: ${details.join(' + ')}`);
        await this._logDebug(`Roll total: ${total}`);
        return total;
    }

    async saveGame() {
        if (!this.currentState) throw new Error('No game in progress');
        
        await this._logDebug('Saving game');
        await schema.storyProgress.findOneAndUpdate(
            { sessionId: this.sessionId },
            { $set: { lastUpdated: new Date() } }
        );

        return {
            text: '遊戲已儲存',
            sessionId: this.sessionId
        };
    }

    async loadGame(sessionId) {
        const savedState = await schema.storyProgress.findOne({ sessionId });
        if (!savedState) {
            throw new Error('Save file not found');
        }

        this.currentState = savedState;
        this.story = await schema.storyScript.findOne({ id: savedState.storyId });
        
        await this._logDebug('Game loaded');
        return this.getInitialState();
    }

    async _logDebug(message) {
        try {
            // 保存到資料庫
            await schema.storyLog.create({
                sessionId: this.sessionId,
                type: 'debug',
                content: message,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('Failed to save debug log:', err);
        }
        
        // 確保一定會輸出到 console
        console.log(`[StoryEngine Debug][${this.sessionId}] ${message}`);
        debug(message);
    }

    async _logError(error) {
        try {
            // 保存到資料庫
            await schema.storyLog.create({
                sessionId: this.sessionId,
                type: 'error',
                content: {
                    message: error.message,
                    stack: error.stack
                },
                timestamp: new Date()
            });
        } catch (err) {
            console.error('Failed to save error log:', err);
        }
        
        // 確保一定會輸出到 console
        console.error(`[StoryEngine Error][${this.sessionId}]`, error);
        debug('Error:', error);
    }

    async importStory(scriptText) {
        await this._logDebug('Starting story import');
        try {
            const lines = scriptText.split('\n');
            const story = {
                title: '',
                content: [],
                variables: new Map(),
                labels: {},
                stats: []
            };

            let currentNodeIndex = 0;
            let currentNode = null;

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line || line.startsWith('//')) continue;

                await this._logDebug(`Processing line: ${line}`);

                // 處理標籤
                if (line.startsWith('[label]')) {
                    const labelName = line.substring(line.indexOf(']') + 1).trim();
                    if (currentNode) {
                        currentNode.label = labelName;
                        story.labels[labelName] = currentNodeIndex;
                    }
                    await this._logDebug(`Added label: ${labelName} at index ${currentNodeIndex}`);
                    continue;
                }

                // 處理其他節點類型
                if (line.startsWith('[text]')) {
                    currentNode = {
                        type: 'text',
                        content: line.substring(line.indexOf(']') + 1).trim()
                    };
                    story.content.push(currentNode);
                    currentNodeIndex++;
                } else if (line.startsWith('[choice]')) {
                    currentNode = {
                        type: 'choice',
                        content: '請選擇：',
                        choices: []
                    };
                    story.content.push(currentNode);
                    currentNodeIndex++;

                    // 處理選項
                    while (i + 1 < lines.length && lines[i + 1].trim().startsWith('-> ')) {
                        i++;
                        const choiceLine = lines[i].trim();
                        const match = choiceLine.match(/->\s+(.+?)\s+\|\s+(\w+)/);
                        if (match) {
                            currentNode.choices.push({
                                text: match[1],
                                goto: match[2],
                                id: match[2]
                            });
                        }
                    }
                } else if (line.startsWith('[var]')) {
                    // 修改變量處理邏輯
                    const varMatch = line.match(/\[var\]\s+(\w+)\s*=\s*(.+)/);
                    if (varMatch) {
                        const [_, name, value] = varMatch;
                        // 直接存儲為對象的屬性
                        story.variables.set(name, value.trim());
                        await this._logDebug(`Added variable: ${name} = ${value.trim()}`);
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
                } else if (line.startsWith('[image]')) {
                    story.content.push({
                        type: 'image',
                        path: line.substring(line.indexOf(']') + 1).trim()
                    });
                } else if (line.startsWith('[portrait]')) {
                    const parts = line.substring(line.indexOf(']') + 1).trim().split(' ');
                    story.content.push({
                        type: 'portrait',
                        character: parts[0],
                        position: parts[1] || 'left'
                    });
                } else if (line.startsWith('[roll]')) {
                    const dice = line.substring(line.indexOf(']') + 1).trim();
                    story.content.push({
                        type: 'roll',
                        dice: dice
                    });
                    currentNodeIndex++;
                } else if (line.startsWith('[if]')) {
                    const condition = line.substring(line.indexOf(']') + 1).trim();
                    const ifNode = {
                        type: 'if',
                        condition: condition,
                        content: [],
                        elseContent: [],
                        hasElse: false
                    };
                    
                    // 收集 if 塊的內容
                    while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('[endif]')) {
                        i++;
                        const contentLine = lines[i].trim();
                        if (contentLine.startsWith('[else]')) {
                            ifNode.hasElse = true;
                            continue;
                        }
                        
                        const content = this._parseContentLine(contentLine);
                        if (content) {
                            if (ifNode.hasElse) {
                                ifNode.elseContent.push(content);
                            } else {
                                ifNode.content.push(content);
                            }
                        }
                    }
                    
                    story.content.push(ifNode);
                    currentNodeIndex++;
                } else if (line.startsWith('[item_description]')) {
                    const match = line.match(/\[item_description\]\s*(\w+)\s*:\s*(.+)/);
                    if (match) {
                        const [_, itemId, description] = match;
                        currentNode = {
                            type: 'item_description',
                            itemId: itemId,
                            description: description.trim()
                        };
                        story.content.push(currentNode);
                        currentNodeIndex++;
                    }
                } else if (line.startsWith('[item_add]')) {
                    const match = line.match(/\[item_add\]\s*(\w+)\s*(\d+)?/);
                    if (match) {
                        const [_, itemId, quantity] = match;
                        currentNode = {
                            type: 'item_add',
                            itemId: itemId,
                            quantity: parseInt(quantity || '1')
                        };
                        story.content.push(currentNode);
                        currentNodeIndex++;
                    }
                }
            }

            // 生成故事 ID
            const storyId = require('crypto')
                .createHash('md5')
                .update(scriptText)
                .digest('hex')
                .substring(0, 8);

            await this._logDebug(`Story labels: ${JSON.stringify(story.labels)}`);
            await this._logDebug(`Story content: ${JSON.stringify(story.content)}`);

            // 保存到數據庫
            const savedStory = await schema.storyScript.findOneAndUpdate(
                { id: storyId },
                { 
                    $set: {
                        id: storyId,
                        title: story.title,
                        content: story.content,
                        variables: Object.fromEntries(story.variables),
                        labels: story.labels,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            await this._logDebug(`Story imported successfully with ID: ${storyId}`);
            
            return {
                success: true,
                id: storyId,
                title: story.title,
                message: `故事「${story.title}」已匯入！\n故事ID: ${storyId}\n使用 .st start ${storyId} 來開始遊戲`,
                contentLength: story.content.length,
                labelCount: Object.keys(story.labels).length
            };

        } catch (error) {
            await this._logError(error);
            throw new Error('Failed to import story: ' + error.message);
        }
    }

    _parseContentLine(line) {
        if (line.startsWith('[text]')) {
            return {
                type: 'text',
                content: line.substring(line.indexOf(']') + 1).trim()
            };
        } else if (line.startsWith('[goto]')) {
            return {
                type: 'goto',
                goto: line.substring(line.indexOf(']') + 1).trim()
            };
        } else if (line.startsWith('[stat_modify]')) {
            const parts = line.substring(line.indexOf(']') + 1).trim().split(' ');
            return {
                type: 'stat_modify',
                stat: parts[0],
                value: parseInt(parts[1])
            };
        }
        return null;
    }

    async _processNodes(nodes) {
        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats,
            inventory: this.currentState.inventory,
            images: []
        };

        for (const node of nodes) {
            const nodeResult = await this._processCurrentNode(node);
            result = {
                ...result,
                text: result.text + (result.text ? '\n' : '') + nodeResult.text,
                choices: [...result.choices, ...nodeResult.choices],
                images: [...result.images, ...nodeResult.images],
                stats: nodeResult.stats,
                inventory: nodeResult.inventory
            };
        }

        return result;
    }

    async _processNode(node) {
        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats,
            inventory: this.currentState.inventory,
            images: [],
            debug: `Processing single node: ${node.type}`
        };

        switch (node.type) {
            case 'text':
                result.text = node.content;
                break;

            case 'choice':
                if (!node.choices) {
                    node.choices = [];
                }
                if (!Array.isArray(node.choices)) {
                    node.choices = [];
                }
                
                await this._logDebug(`Processing choice node: ${JSON.stringify(node)}`);
                
                result.text = node.content || '請選擇：';
                result.choices = node.choices.map(choice => ({
                    text: choice.text || '',
                    id: choice.goto || choice.id || ''
                }));
                
                await this._logDebug(`Processed choice node with ${result.choices.length} options`);
                break;

            case 'stat_modify':
                await this._modifyStat(node.stat, node.value);
                break;

            case 'if':
                const ifResult = await this._processIfNode(node);
                result.text = ifResult.text;
                result.choices = ifResult.choices;
                await this._moveToNextNode();
                
                // Continue processing next nodes if available
                const ifNextNode = this._getCurrentNode();
                if (ifNextNode && (ifNextNode.type === 'text' || ifNextNode.type === 'if')) {
                    const nextResult = await this._processCurrentNode();
                    result.text = result.text + (result.text && nextResult.text ? '\n\n' : '') + (nextResult.text || '');
                    result.choices = nextResult.choices;
                }
                break;

            case 'image':
                result.images.push({ type: 'background', path: node.path });
                break;

            case 'portrait':
                result.images.push({ type: 'portrait', path: node.character, position: node.position });
                break;

            case 'item_add':
                await this._addItem(node.itemId, node.quantity || 1);
                break;

            case 'roll':
                const rollResult = await this._handleRoll(node.dice);
                this.currentState.variables.roll_result = rollResult;
                result.text = `擲骰結果: ${rollResult}`;
                result.roll = {
                    dice: node.dice,
                    result: rollResult
                };
                break;

            case 'goto':
                const gotoIndex = await this._findLabelByGoto(node.goto);
                if (gotoIndex !== -1) {
                    this.currentState.currentNodeIndex = gotoIndex;
                    const nextResult = await this._processCurrentNode();
                    result = {
                        ...result,
                        text: result.text + (result.text && nextResult.text ? '\n\n' : '') + (nextResult.text || ''),
                        choices: nextResult.choices || [],
                        images: [...result.images, ...(nextResult.images || [])]
                    };
                }
                break;
        }

        return result;
    }

    // 添加變量處理方法
    async _evaluateVariable(varName) {
        await this._logDebug(`Evaluating variable: ${varName}`);
        if (!this.currentState.variables) {
            this.currentState.variables = {};
        }
        return this.currentState.variables[varName] || '';
    }

    // 修改 _processRollSequence 方法
    async _processRollSequence(rollNode) {
        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats,
            inventory: this.currentState.inventory,
            images: []
        };

        // 處理骰子擲骰
        const rollResult = await this._handleRoll(rollNode.dice);
        this.currentState.variables.roll_result = rollResult;
        result.text = `擲骰: ${rollNode.dice}\n結果: ${rollResult}`;
        result.roll = {
            dice: rollNode.dice,
            result: rollResult
        };
        
        await this._moveToNextNode();

        // 處理後續的 if 節點
        const ifNode = this.story.content[this.currentState.currentNodeIndex];
        if (ifNode && ifNode.type === 'if') {
            const condition = await this._evaluateCondition(ifNode.condition);
            const contentNodes = condition ? ifNode.content : (ifNode.hasElse ? ifNode.elseContent : []);
            
            for (const contentNode of contentNodes) {
                if (contentNode.type === 'text') {
                    result.text += `\n${contentNode.content}`;
                } else if (contentNode.type === 'goto') {
                    const targetLabel = contentNode.goto;
                    // 檢查是否已經訪問過該標籤
                    if (this.visitedLabels.includes(targetLabel)) {
                        continue;
                    }
                    this.visitedLabels.push(targetLabel);
                    
                    const nextIndex = await this._findLabelByGoto(targetLabel);
                    if (nextIndex !== -1) {
                        this.currentState.currentNodeIndex = nextIndex;
                        const nextResult = await this._processCurrentNode();
                        result = {
                            ...result,
                            text: `${result.text}\n${nextResult.text}`,
                            choices: nextResult.choices || []
                        };
                    }
                    break;
                }
            }
            
            await this._moveToNextNode();
        }
        
        return result;
    }

    // 修改 _initializeLabels 方法
    async _initializeLabels() {
        if (!this.story.labels) {
            this.story.labels = {};
        }

        // Reset labels
        this.story.labels = {};

        // First pass: Map all explicit labels in the content
        for (let i = 0; i < this.story.content.length; i++) {
            const node = this.story.content[i];
            if (node.label) {
                this.story.labels[node.label] = i;
                await this._logDebug(`Mapped label ${node.label} to index ${i}`);
            }
        }

        // Second pass: Map choice targets to their corresponding nodes
        for (let i = 0; i < this.story.content.length; i++) {
            const node = this.story.content[i];
            if (node.type === 'choice' && node.choices) {
                for (const choice of node.choices) {
                    if (!this.story.labels[choice.goto]) {
                        // Search through all nodes for a matching label
                        for (let j = 0; j < this.story.content.length; j++) {
                            const targetNode = this.story.content[j];
                            if (targetNode.label === choice.goto) {
                                this.story.labels[choice.goto] = j;
                                await this._logDebug(`Mapped choice goto ${choice.goto} to index ${j}`);
                                break;
                            }
                        }
                    }
                }
            }
        }

        await this._logDebug(`Initialized labels: ${JSON.stringify(this.story.labels)}`);
    }

    async _findTargetNodeIndex(targetLabel) {
        for (let i = 0; i < this.story.content.length; i++) {
            const node = this.story.content[i];
            if (node.label === targetLabel || 
                (node.type === 'text' && node.content && node.content.includes(targetLabel))) {
                return i;
            }
        }
        return -1;
    }

    // 修改 _processItemSequence 方法
    async _processItemSequence() {
        let result = {
            inventory: this.currentState.inventory,
            messages: [],
            text: ''
        };

        let currentNode = this.story.content[this.currentState.currentNodeIndex];
        
        // 處理物品相關節點
        while (currentNode && 
               (currentNode.type === 'item_add' || 
                currentNode.type === 'text' || 
                currentNode.type === 'image')) {
            
            if (currentNode.type === 'item_add') {
                await this._addItem(currentNode.itemId, currentNode.quantity || 1);
                const description = await this._findItemDescription(currentNode.itemId);
                if (description) {
                    result.messages.push(`獲得了${description}`);
                }
            } else if (currentNode.type === 'text') {
                result.text += (result.text ? '\n' : '') + currentNode.content;
            }
            
            await this._moveToNextNode();
            currentNode = this.story.content[this.currentState.currentNodeIndex];
        }

        return result;
    }

    // 添加新的方法來處理條件節點
    async _processIfNode(ifNode) {
        await this._logDebug(`Processing if node: ${JSON.stringify(ifNode)}`);
        
        // Set personality type variables based on stat comparisons first
        if (ifNode.condition.includes('>')) {
            const [stat1, stat2] = ifNode.condition.split('>').map(s => s.trim());
            if (stat1 === 'E' && stat2 === 'I') {
                this.currentState.variables.type_ei = this.currentState.stats['E'] > this.currentState.stats['I'] ? 'E' : 'I';
            } else if (stat1 === 'S' && stat2 === 'N') {
                this.currentState.variables.type_sn = this.currentState.stats['S'] > this.currentState.stats['N'] ? 'S' : 'N';
            } else if (stat1 === 'T' && stat2 === 'F') {
                this.currentState.variables.type_tf = this.currentState.stats['T'] > this.currentState.stats['F'] ? 'T' : 'F';
            } else if (stat1 === 'J' && stat2 === 'P') {
                this.currentState.variables.type_jp = this.currentState.stats['J'] > this.currentState.stats['P'] ? 'J' : 'P';
            }
        }

        // Evaluate the condition
        const condition = await this._evaluateCondition(ifNode.condition);
        await this._logDebug(`Condition result: ${condition}`);

        let result = {
            text: '',
            choices: [],
            stats: this.currentState.stats
        };

        // Process the content based on condition
        const contentNodes = condition ? ifNode.content : (ifNode.hasElse ? ifNode.elseContent : []);
        
        for (const contentNode of contentNodes) {
            if (contentNode.type === 'text') {
                result.text += (result.text ? '\n' : '') + contentNode.content;
            }
        }

        // Save the updated variables
        await schema.storyProgress.updateOne(
            { sessionId: this.sessionId },
            { 
                $set: { 
                    variables: this.currentState.variables,
                    lastUpdated: new Date()
                }
            }
        );

        return result;
    }

    _getCurrentNode() {
        if (!this.story || !this.story.content || this.currentState.currentNodeIndex >= this.story.content.length) {
            return null;
        }
        return this.story.content[this.currentState.currentNodeIndex];
    }
}

module.exports = StoryEngine; 