// Common JavaScript code for character card pages
let TITLE = "HKTRPG 角色卡";

// XSS Protection function
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Simple encryption/decryption for localStorage (not cryptographically secure, but better than plain text)
function simpleEncrypt(text) {
    if (!text) return '';
    return btoa(encodeURIComponent(text));
}

function simpleDecrypt(encodedText) {
    if (!encodedText) return '';
    try {
        return decodeURIComponent(atob(encodedText));
    } catch (error) {
        console.warn('Failed to decrypt stored data:', error.message);
        return '';
    }
}

// Debug logging with sensitive data filtering
function debugLog(message) {
    // Filter out sensitive information
    if (typeof message === 'string') {
        // Replace potential passwords, tokens, and other sensitive data
        message
            .replaceAll(/password['":\s]*['"]\w+['"]/gi, 'password: "[REDACTED]"')
            .replaceAll(/token['":\s]*['"]\w+['"]/gi, 'token: "[REDACTED]"')
            .replaceAll(/userPassword['":\s]*['"]\w+['"]/gi, 'userPassword: "[REDACTED]"')
            .replaceAll(/auth['":\s]*['"]\w+['"]/gi, 'auth: "[REDACTED]"');
    }
    //console.log(`[${new Date().toISOString()}] [${type}] ${filteredMessage}`);
}

// Socket.io Setup
let socket = io();

// Vue Applications
let card = null;
let cardList = null;

function initializeVueApps(isPublic = false, skipUITemplateLoad = false) {
    try {
        // Set title based on card type
        TITLE = isPublic ? "HKTRPG 公開角色卡" : "HKTRPG 私人角色卡";
        
        // Only load UI template if not already loaded (skipUITemplateLoad = true means UI is already loaded)
        if (!skipUITemplateLoad) {
            $("#array-rendering").load("/common/characterCardUI.html", function() {
                initializeVueAppsInternal(isPublic, null);
            });
        } else {
            // Load the hybrid UI template into a temporary container first
            const tempContainer = document.createElement('div');
            tempContainer.style.display = 'none';
            document.body.appendChild(tempContainer);
            
            $(tempContainer).load("/common/hybridCharacterCardUI.html", function() {
                const templateContent = tempContainer.innerHTML;
                
                // Remove the temporary container
                document.body.removeChild(tempContainer);
                
                initializeVueAppsInternal(isPublic, templateContent);
            });
        }
    } catch (error) {
        console.error('Error in initializeVueApps:', error);
    }
}

function initializeVueAppsInternal(isPublic = false, templateContent = null) {
    try {
        // Initialize main card app
        
        // Get the template content - use provided content or get from DOM
        const finalTemplateContent = templateContent || document.getElementById('array-rendering').innerHTML;
        
        card = Vue.createApp({
            template: finalTemplateContent,
                data() {
                    return {
                        id: "",
                        name: "",
                        state: [],
                        roll: [],
                        notes: [],
                        characterDetails: [],
                        gpList: [],
                        selectedGroupId: localStorage.getItem("selectedGroupId") || null,
                        public: isPublic,
                        editMode: false,
                        isPublic: isPublic,
                        originalData: null
                    }
                },
                mounted() {
                    // Initialize character details if empty - no default data
                    // characterDetails will be populated from server data
                    
                    // Add test data for debugging
                    this.loadTestData();
                    
                    // Set the correct radio button based on saved selectedGroupId
                    if (this.selectedGroupId && this.selectedGroupId !== "") {
                        this.$nextTick(() => {
                            const radio = document.querySelector(`input[name="gpListRadio"][value="${this.selectedGroupId}"]`);
                            if (radio) {
                                radio.checked = true;
                            }
                        });
                    } else {
                        // Default to "no group" option
                        this.$nextTick(() => {
                            const radio = document.querySelector('input[name="gpListRadio"][value=""]');
                            if (radio) {
                                radio.checked = true;
                            }
                        });
                    }
                },
                methods: {
                    // 載入測試數據
                    loadTestData() {
                        this.name = "測試角色";
                        this.state = [
                            { name: 'HP', itemA: '11', itemB: '11' },
                            { name: 'MP', itemA: '16', itemB: '16' },
                            { name: 'SAN', itemA: '80', itemB: '80' },
                            { name: '體格', itemA: '1', itemB: '' },
                            { name: 'DB', itemA: '＋1D4', itemB: '' },
                            { name: 'MOV', itemA: '8', itemB: '' },
                            { name: '護甲', itemA: '0', itemB: '' },
                            { name: '職業', itemA: '保險調查員', itemB: '' },
                            { name: '特徵', itemA: '野外活動愛好者', itemB: '' }
                        ].filter(item => item && item.name);
                        this.roll = [
                            { name: '心理學', itemA: '10' },
                            { name: '信譽', itemA: '0' },
                            { name: '偵查', itemA: '25' },
                            { name: '鬥毆', itemA: '25' },
                            { name: '魔法', itemA: '1' },
                            { name: '小刀', itemA: '25' },
                            { name: '幸運', itemA: '50' }
                        ].filter(item => item && item.name);
                        this.notes = [
                            { name: '調查筆記', itemA: '這是測試筆記內容' },
                            { name: '戰鬥記錄', itemA: '戰鬥日誌記錄' }
                        ].filter(item => item && item.name);
                        this.characterDetails = [
                            { label: '職業', value: '保險調查員' },
                            { label: '特徵', value: '野外活動愛好者' }
                        ].filter(detail => detail && detail.label && detail.value);
                        
                        
                        // Check for value controls after data is loaded
                        this.$nextTick(() => {
                            
                            // 強制應用按鈕樣式
                            this.applyButtonStyles();
                            
                        });
                    },
                    
                    // 強制應用按鈕樣式
                    applyButtonStyles() {
                        const buttons = document.querySelectorAll('.value-btn');
                        const deleteButtons = document.querySelectorAll('.hover-delete-btn');
                        const floatingControls = document.querySelectorAll('.floating-edit-controls');
                        const floatingButtons = document.querySelectorAll('.floating-btn');
                        
                        // 樣式化value按鈕
                        buttons.forEach((btn, index) => {
                            
                            // 重置所有樣式
                            btn.style.all = 'unset';
                            
                            // 應用基本樣式
                            btn.style.width = '16px';
                            btn.style.height = '16px';
                            btn.style.border = 'none';
                            btn.style.borderRadius = '3px';
                            btn.style.display = 'flex';
                            btn.style.alignItems = 'center';
                            btn.style.justifyContent = 'center';
                            btn.style.fontSize = '10px';
                            btn.style.fontWeight = '700';
                            btn.style.cursor = 'pointer';
                            btn.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                            btn.style.flexShrink = '0';
                            btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)';
                            btn.style.position = 'relative';
                            btn.style.overflow = 'hidden';
                            btn.style.padding = '0';
                            btn.style.margin = '0';
                            btn.style.outline = 'none';
                            btn.style.textDecoration = 'none';
                            btn.style.verticalAlign = 'middle';
                            btn.style.userSelect = 'none';
                            btn.style.appearance = 'none';
                            btn.style.webkitAppearance = 'none';
                            btn.style.mozAppearance = 'none';
                            btn.style.boxSizing = 'border-box';
                            
                            // 應用顏色
                            if (btn.classList.contains('plus-btn')) {
                                btn.style.backgroundColor = '#22c55e';
                                btn.style.color = 'white';
                                btn.style.border = '1px solid #16a34a';
                            } else if (btn.classList.contains('minus-btn')) {
                                btn.style.backgroundColor = '#f87171';
                                btn.style.color = 'white';
                                btn.style.border = '1px solid #ef4444';
                            }
                            
                        });
                        
                        // 樣式化刪除按鈕
                        deleteButtons.forEach((btn, index) => {
                            
                            // 重置所有樣式
                            btn.style.all = 'unset';
                            
                            // 應用X按鈕樣式
                            btn.style.position = 'absolute';
                            btn.style.top = '8px';
                            btn.style.right = '8px';
                            btn.style.width = '24px';
                            btn.style.height = '24px';
                            btn.style.borderRadius = '50%';
                            btn.style.background = '#dc3545';
                            btn.style.backgroundColor = '#dc3545';
                            btn.style.color = 'white';
                            btn.style.border = 'none';
                            btn.style.display = 'flex';
                            btn.style.alignItems = 'center';
                            btn.style.justifyContent = 'center';
                            btn.style.fontSize = '12px';
                            btn.style.opacity = '1'; // 強制設置為可見
                            btn.style.transition = 'all 0.2s ease';
                            btn.style.zIndex = '10';
                            btn.style.cursor = 'pointer';
                            btn.style.padding = '0';
                            btn.style.margin = '0';
                            btn.style.outline = 'none';
                            btn.style.textDecoration = 'none';
                            btn.style.verticalAlign = 'middle';
                            btn.style.userSelect = 'none';
                            btn.style.appearance = 'none';
                            btn.style.webkitAppearance = 'none';
                            btn.style.mozAppearance = 'none';
                            btn.style.boxSizing = 'border-box';
                            
                        });
                        
                        // 樣式化浮動控制容器
                        floatingControls.forEach((container, index) => {
                            
                            // 重置所有樣式
                            container.style.all = 'unset';
                            
                            // 應用浮動容器樣式
                            container.style.position = 'fixed';
                            container.style.bottom = '20px';
                            container.style.right = '20px';
                            container.style.display = 'flex';
                            container.style.flexDirection = 'column';
                            container.style.gap = '10px';
                            container.style.zIndex = '1000';
                            container.style.margin = '0';
                            container.style.padding = '0';
                            container.style.border = 'none';
                            container.style.background = 'transparent';
                            container.style.width = 'auto';
                            container.style.height = 'auto';
                            
                        });
                        
                        // 樣式化浮動按鈕
                        floatingButtons.forEach((btn, index) => {
                            
                            // 重置所有樣式
                            btn.style.all = 'unset';
                            
                            // 應用浮動按鈕樣式
                            btn.style.display = 'flex';
                            btn.style.alignItems = 'center';
                            btn.style.gap = '8px';
                            btn.style.padding = '12px 16px';
                            btn.style.border = 'none';
                            btn.style.borderRadius = '25px';
                            btn.style.fontSize = '14px';
                            btn.style.fontWeight = '600';
                            btn.style.cursor = 'pointer';
                            btn.style.transition = 'all 0.3s ease';
                            btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            btn.style.minWidth = '120px';
                            btn.style.justifyContent = 'center';
                            btn.style.margin = '0';
                            btn.style.outline = 'none';
                            btn.style.textDecoration = 'none';
                            btn.style.verticalAlign = 'middle';
                            btn.style.userSelect = 'none';
                            btn.style.appearance = 'none';
                            btn.style.webkitAppearance = 'none';
                            btn.style.mozAppearance = 'none';
                            btn.style.boxSizing = 'border-box';
                            btn.style.fontFamily = 'inherit';
                            btn.style.lineHeight = 'inherit';
                            btn.style.textTransform = 'none';
                            btn.style.textIndent = '0px';
                            btn.style.textShadow = 'none';
                            btn.style.textAlign = 'center';
                            btn.style.letterSpacing = 'normal';
                            btn.style.wordSpacing = 'normal';
                            btn.style.overflow = 'visible';
                            
                            // 應用特定按鈕顏色
                            if (btn.classList.contains('save-btn')) {
                                btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                                btn.style.backgroundColor = '#28a745';
                                btn.style.color = 'white';
                            } else if (btn.classList.contains('revert-btn')) {
                                btn.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
                                btn.style.backgroundColor = '#ffc107';
                                btn.style.color = 'white';
                            } else if (btn.classList.contains('close-btn')) {
                                btn.style.background = 'linear-gradient(135deg, #dc3545, #e83e8c)';
                                btn.style.backgroundColor = '#dc3545';
                                btn.style.color = 'white';
                            }
                            
                        });
                    },
                    
                    // 計算屬性百分比
                    calculatePercentage(itemA, itemB) {
                        const a = parseFloat(itemA) || 0;
                        const b = parseFloat(itemB) || 0;
                        if (b === 0) return 0;
                        return Math.round((a / b) * 100);
                    },
                    
                    
                    // 獲取屬性卡片樣式類
                    getAttributeCardClass(index) {
                        const classes = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
                        return classes[index % classes.length];
                    },
                    
                    // 調整數值方法
                    adjustValue(form, index, change) {
                        if (form === 1 && this.roll[index]) {
                            const currentValue = parseInt(this.roll[index].itemA) || 0;
                            this.roll[index].itemA = Math.max(0, currentValue + change).toString();
                        }
                    },
                    
                    // 調整屬性數值
                    adjustAttributeValue(index, field, change) {
                        if (this.state[index] && this.state[index][field] !== undefined) {
                            const currentValue = parseInt(this.state[index][field]) || 0;
                            this.state[index][field] = Math.max(0, currentValue + change).toString();
                        }
                    },
                    
                    addItem(form) {
                        switch (form) {
                            case 0:
                                this.state.push({
                                    name: "",
                                    itemA: "",
                                    itemB: ""
                                });
                                break;
                            case 1:
                                this.roll.push({
                                    name: "",
                                    itemA: ""
                                });
                                break;
                            case 2:
                                this.notes.push({
                                    name: "",
                                    itemA: ""
                                });
                                break;
                            default:
                                break;
                        }
                    },
                    removeItem(form, index = null) {
                        switch (form) {
                            case 0:
                                if (index !== null) {
                                    this.state.splice(index, 1);
                                } else {
                                    this.state.pop();
                                }
                                break;
                            case 1:
                                if (index !== null) {
                                    this.roll.splice(index, 1);
                                } else {
                                    this.roll.pop();
                                }
                                break;
                            case 2:
                                if (index !== null) {
                                    this.notes.splice(index, 1);
                                } else {
                                    this.notes.pop();
                                }
                                break;
                            default:
                                break;
                        }
                    },
                    
                    toggleEditMode() {
                        if (!this.editMode) {
                            // 進入編輯模式時備份原始數據
                            this.backupData();
                        }
                        this.editMode = !this.editMode;
                    },
                    
                    closeEditMode() {
                        // 關閉編輯模式並還原數據
                        this.revertChanges();
                    },
                    
                    backupData() {
                        // 備份當前數據
                        this.originalData = {
                            roll: JSON.parse(JSON.stringify(this.roll)),
                            state: JSON.parse(JSON.stringify(this.state)),
                            notes: JSON.parse(JSON.stringify(this.notes)),
                            characterDetails: JSON.parse(JSON.stringify(this.characterDetails))
                        };
                    },
                    
                    revertChanges() {
                        if (this.originalData) {
                            // 還原到備份的數據
                            this.roll = JSON.parse(JSON.stringify(this.originalData.roll));
                            this.state = JSON.parse(JSON.stringify(this.originalData.state));
                            this.notes = JSON.parse(JSON.stringify(this.originalData.notes));
                            this.characterDetails = JSON.parse(JSON.stringify(this.originalData.characterDetails));
                        }
                        this.editMode = false;
                    },
                    
                    revertDataOnly() {
                        // 只還原數據，不退出編輯模式
                        if (this.originalData) {
                            // 還原到備份的數據
                            this.roll = JSON.parse(JSON.stringify(this.originalData.roll));
                            this.state = JSON.parse(JSON.stringify(this.originalData.state));
                            this.notes = JSON.parse(JSON.stringify(this.originalData.notes));
                            this.characterDetails = JSON.parse(JSON.stringify(this.originalData.characterDetails));
                        }
                    },
                    
                    isNumeric(value) {
                        // 檢查值是否為數字（包括字符串形式的數字）
                        if (value === null || value === undefined || value === '') {
                            return false;
                        }
                        const cleanValue = value.toString().replace(/^CC\s*/i, '');
                        const num = parseFloat(cleanValue);
                        const isNum = !isNaN(num) && isFinite(num);
                        return isNum;
                    },
                    
                    adjustValue(index, type, delta) {
                        // 調整屬性值
                        const item = this.state[index];
                        if (!item) {
                            return;
                        }
                        
                        const field = type === 'current' ? 'itemA' : 'itemB';
                        const currentValue = item[field];
                        
                        if (this.isNumeric(currentValue)) {
                            const num = parseFloat(currentValue.toString().replace(/^CC\s*/i, ''));
                            const newValue = Math.max(0, num + delta);
                            item[field] = newValue.toString();
                        }
                    },
                    
                    removeChannel(channelId) {
                        // Find the channel to get its details
                        const channelToRemove = this.gpList.find(channel => channel._id === channelId);
                        if (!channelToRemove) {
                            debugLog(`Channel with ID ${channelId} not found`, 'error');
                            return;
                        }

                        // Send remove request to server
                        const userName = localStorage.getItem("userName");
                        const token = localStorage.getItem("jwtToken");
                        
                        if (!userName || !token) {
                            debugLog('User not logged in or token missing, cannot remove channel', 'error');
                            return;
                        }

                        socket.emit('removeChannel', {
                            userName: userName,
                            token: token,
                            channelId: channelToRemove.id,
                            botname: channelToRemove.botname
                        });

                        // Remove from local list
                        this.gpList = this.gpList.filter(channel => channel._id !== channelId);
                    },
                    config() {
                        // Check if delete mode is already active
                        const isDeleteModeActive = this.gpList.length > 0 && this.gpList[0].showDeleteButton;
                        
                        // Toggle delete mode
                        this.gpList = this.gpList.map(group => ({
                            ...group,
                            showDeleteButton: !isDeleteModeActive,
                            showCancelButton: false,
                            confirmDelete: false
                        }));
                    },
                    confirmRemoveChannel(channel) {
                        if (!channel.confirmDelete) {
                            // First click: show confirmation
                            channel.confirmDelete = true;
                            channel.showCancelButton = true;
                        } else {
                            // Second click: actually remove the channel
                            this.removeChannel(channel._id);
                        }
                    },
                    cancelButton(channel) {
                        channel.showDeleteButton = true;
                        channel.showCancelButton = false;
                        channel.confirmDelete = false;
                    },
                    saveSelectedGroupId() {
                        localStorage.setItem("selectedGroupId", this.selectedGroupId || "");
                        debugLog(`Saving selected group ID: ${this.selectedGroupId}`, 'info');
                    },
                    rolling(name) {
                        debugLog(`Rolling for ${name}`, 'info');
                        // Get the selected group ID from the radio button
                        this.selectedGroupId = document.querySelector('input[name="gpListRadio"]:checked')?.value || null;
                        // Save the selection to localStorage for persistence
                        this.saveSelectedGroupId();
                        
                        if (this.isPublic) {
                            socket.emit('publicRolling', {
                                item: name,
                                userName: localStorage.getItem("userName"),
                                token: localStorage.getItem("jwtToken"),
                                doc: {
                                    name: this.name,
                                    state: this.state,
                                    roll: this.roll,
                                    notes: this.notes
                                }
                            });
                        } else {
                            socket.emit('rolling', {
                                item: name,
                                userName: localStorage.getItem("userName"),
                                token: localStorage.getItem("jwtToken"),
                                cardName: this.name,
                                selectedGroupId: this.selectedGroupId,
                                doc: {
                                    name: this.name,
                                    state: this.state,
                                    roll: this.roll,
                                    notes: this.notes
                                }
                            });
                        }
                    },
                    
                    updateCard() {
                        // 調用全局的updateCard函數
                        if (typeof globalThis.updateCard === 'function') {
                            globalThis.updateCard();
                        } else {
                            console.error('Global updateCard function not found');
                            this.showError('儲存功能不可用');
                        }
                    },
                    
                    showError(message) {
                        // 調用全局的showError函數
                        if (typeof globalThis.showError === 'function') {
                            globalThis.showError(message);
                        } else {
                            console.error('Error:', message);
                        }
                    }
                }
            }).mount('#array-rendering');

            
            

            // Initialize card list app if element exists
            const cardListElement = document.querySelector('#array-cardList');
            if (cardListElement) {
                cardList = Vue.createApp({
                    data() {
                        return {
                            list: []
                        }
                    },
                    methods: {
                        getTheSelectedOne(index) {
                            if (card) {
                                card._id = this.list[index]._id;
                                card.id = this.list[index].id;
                                card.name = this.list[index].name;
                                card.state = this.list[index].state;
                                card.roll = this.list[index].roll;
                                card.notes = this.list[index].notes;
                                card.public = this.list[index].public;
                                $('#cardListModal').modal("hide");
                            }
                        }
                    }
                }).mount('#array-cardList');
                debugLog('CardList Vue app initialized successfully', 'info');
            }

            debugLog('Vue applications initialized successfully', 'info');

        // Set up login form for private cards
        if (!isPublic) {
            setupLoginForm();
        }
    } catch (error) {
        debugLog(`Error initializing Vue apps internal: ${error.message}`, 'error');
    }
}

// Login form setup
function setupLoginForm() {
    debugLog('Setting up login form', 'info');
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 100; // ms

    function trySetupLoginForm() {
        const userNameInput = document.querySelector('#userName');
        const userPasswordInput = document.querySelector('#userPassword_id');
        const warningElement = document.querySelector('#warning');

        if (userNameInput && userPasswordInput && warningElement) {
            // Set initial values from localStorage
            const userName = localStorage.getItem("userName");
            const userPassword = simpleDecrypt(localStorage.getItem("userPassword"));
            
            if (userName) userNameInput.value = userName;
            if (userPassword) userPasswordInput.value = userPassword;

            // Check if user is already logged in
            if (userName && userPassword) {
                debugLog('User already logged in, attempting to get card list', 'info');
                socket.emit('getListInfo', {
                    userName: userName,
                    userPassword: userPassword
                });

                socket.once("getListInfo", function (listInfo) {
                    let list = listInfo.temp;
                    if (listInfo && listInfo.id && listInfo.id.length > 0) {
                        card.gpList = listInfo.id;
                    }
                    
                    // 🔐 存儲JWT token（自動登入時也需要）
                    if (listInfo.token) {
                        localStorage.setItem('jwtToken', listInfo.token);
                    }
                    
                    if (list) {
                        warningElement.style.display = "none";
                        cardList.list = list;
                        $('#cardListModal').modal("show");
                    } else {
                        // If login failed, show login modal
                        $('#loginModalCenter').modal("show");
                    }
                });
            } else {
                // If no stored credentials, show login modal
                $('#loginModalCenter').modal("show");
            }
            
            debugLog('Login form setup completed successfully', 'info');
            return true;
        }

        if (retryCount < maxRetries) {
            retryCount++;
            debugLog(`Login form elements not found, retrying (${retryCount}/${maxRetries})`, 'info');
            setTimeout(trySetupLoginForm, retryInterval);
            return false;
        }

        debugLog('Failed to find login form elements after maximum retries', 'error');
        return false;
    }

    trySetupLoginForm();
}

// Login function
function login() {
    const userNameInput = document.querySelector('#userName');
    const userPasswordInput = document.querySelector('#userPassword_id');
    const warningElement = document.querySelector('#warning');

    if (!userNameInput || !userPasswordInput || !warningElement) {
        debugLog('Login form elements not found', 'error');
        return;
    }

    const userName = userNameInput.value;
    const userPassword = userPasswordInput.value;

    localStorage.setItem('userName', userName);
    localStorage.setItem('userPassword', simpleEncrypt(userPassword)); // Encrypt password

    if (userName && userName.length >= 4 && userPassword && userPassword.length >= 6) {
        socket.emit('getListInfo', {
            userName: userName,
            userPassword: userPassword // Use original password for transmission
        });

        socket.on("getListInfo", function (listInfo) {
            let list = listInfo.temp;
            if (listInfo && listInfo.id && listInfo.id.length > 0) {
                card.gpList = listInfo.id;
            }
            
            // 🔐 存儲JWT token
            if (listInfo.token) {
                localStorage.setItem('jwtToken', listInfo.token);
            }
            
            if (list) {
                warningElement.style.display = "none";
                cardList.list = list;
                $('#loginModalCenter').modal("hide");
                $('#cardListModal').modal("show");
            } else {
                warningElement.style.display = "block";
                $('#loginModalCenter').modal("show");
            }
        });
    } else {
        $('#loginModalCenter').modal("show");
    }
}

// Logout function
function logout() {
    const warningElement = document.querySelector('#warning');
    if (warningElement) {
        warningElement.style.display = "none";
    }
    $('#loginModalCenter').modal("show");
    if (card) {
        card._id = "";
        card.id = "";
        card.name = "";
        card.notes = "";
        card.roll = "";
        card.state = "";
        card.public = false;
    }
}

// DOM Ready Handler
$(function () {
    debugLog('DOM ready, initializing components', 'info');
    $("#header").load("includes/header.html", function () {
        $("#title").text(TITLE);
    });
    $("#footer").load("includes/footer.html");
});

// Alert Functions
function popup(result) {
    debugLog(`Showing popup with result: ${result}`, 'info');
    if (result) {
        addElement("更新成功! 你可以在聊天平台上使用新資料了。", "success", 5000);
        debugLog('Success alert shown', 'info');
    } else {
        addElement("更新失敗! 請檢查或向HKTRPG回報。", "danger", 5000);
        debugLog('Error alert shown', 'info');
    }
}

function addElement(message, type, closeDelay, allowHtml = false) {
    let $cont = $("#alerts-container");
    if ($cont.length === 0) {
        $cont = $('<div id="alerts-container">')
            .css({
                position: "fixed",
                width: "30%",
                left: "60%",
                top: "15%",
                margin: "0 auto",
                zIndex: "9999"
            })
            .appendTo($("body"));
    }

    type = type || "info";
    let alert = $('<div>')
        .addClass("alert text-wrap text-break alert-dismissible fade show alert-" + type)
        .append($('<button type="button" class="close" data-dismiss="alert">').append("&times;"));
    
    // 根據 allowHtml 參數決定是否使用 HTML 或純文字
    if (allowHtml) {
        alert.append(message);
    } else {
        alert.append(sanitizeHtml(message));
    }

    $cont.prepend(alert);
    if (closeDelay) {
        globalThis.setTimeout(() => alert.alert("close"), closeDelay);
    }
}

// Modal Functions
function readme() {
    $('#readmeModalCenter').modal("show");
}

function selectCard() {
    $('#cardListModal').modal("show");
}

// Socket event handlers
socket.on("rolling", function (result) {
    debugLog(`Received rolling result: ${result}`, 'info');
    if (result) {
        addElement(result, "warning", 4000, true); // 允許 HTML 格式
    } else {
        addElement("<strong>擲骰失敗!</strong> 請檢查或向HKTRPG回報。", "danger", 4000, true);
        debugLog('Rolling failed', 'error');
    }
});

socket.on("publicRolling", function (result) {
    debugLog(`Received public rolling result: ${result}`, 'info');
    if (result) {
        addElement(result, "warning", 4000, true); // 允許 HTML 格式
    } else {
        addElement("<strong>擲骰失敗!</strong> 請檢查或向HKTRPG回報。", "danger", 4000, true);
        debugLog('Public rolling failed', 'error');
    }
});

socket.on("updateCard", function (result) {
    debugLog(`Update card result: ${result}`, 'info');
    if (result === true) {
        popup(true);
        debugLog('Card updated successfully', 'info');
    } else {
        popup(false);
        debugLog('Card update failed', 'error');
    }
});

// Add socket listener for removeChannel response
socket.on("removeChannel", function (result) {
    if (result && result.success) {
        addElement('頻道移除成功！', 'success', 3000);
    } else {
        addElement(`頻道移除失敗: ${result ? result.message : '未知錯誤'}`, 'danger', 5000);
    }
});

// Update card function for hybrid UI
function updateCard() {
    const userName = localStorage.getItem("userName");
    const token = localStorage.getItem("jwtToken");

    console.log('updateCard called - userName:', userName, 'token exists:', !!token);

    if (!userName || !token) {
        console.log('updateCard failed - missing credentials:', { userName: !!userName, token: !!token });
        showError('請先登入才能更新角色卡');
        return;
    }

    // Show loading state
    const updateButton = document.querySelector('[onclick="updateCard()"]');
    if (updateButton) {
        updateButton.classList.add('btn-loading');
        updateButton.disabled = true;
    }

    // Add loading class to card
    const cardElement = document.querySelector('.hybrid-card-container');
    if (cardElement) {
        cardElement.classList.add('loading');
    }

    const data = {
        userName: userName,
        token: token,
        card: {
            _id: card._id,
            id: card.id,
            state: card.state,
            roll: card.roll,
            notes: card.notes,
            characterDetails: card.characterDetails,
            public: card.public
        }
    };

    debugLog(`Attempting to update card with data:`);
    socket.emit('updateCard', data);
}

// Enhanced error display
function showError(message) {
    addElement(`<i class="fas fa-exclamation-triangle me-2"></i><strong>錯誤!</strong> ${message}`, "danger", 5000, true);
}

// Enhanced success display
function showSuccess(message) {
    addElement(`<i class="fas fa-check-circle me-2"></i><strong>成功!</strong> ${message}`, "success", 3000, true);
}

// Export functions for use in other files
globalThis.initializeVueApps = initializeVueApps;
globalThis.debugLog = debugLog;
globalThis.login = login;
globalThis.logout = logout;
globalThis.readme = readme;
globalThis.selectCard = selectCard;
globalThis.updateCard = updateCard;
globalThis.showError = showError;
globalThis.showSuccess = showSuccess; 