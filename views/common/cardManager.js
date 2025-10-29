/**
 * 角色卡管理器 - 處理角色卡的核心邏輯
 * 從 characterCardCommon.js 中分離出來的角色卡管理功能
 */
class CardManager {
    constructor() {
        this.card = null;
        this.cardList = null;
        this.originalData = null;
        this.isPublic = false;
    }

    /**
     * 初始化角色卡Vue應用
     * @param {boolean} isPublic - 是否為公開模式
     * @param {string} templateContent - 模板內容
     */
    initializeCard(isPublic = false, templateContent = null) {
        this.isPublic = isPublic;
        
        try {
            // 獲取模板內容
            const finalTemplateContent = templateContent || document.getElementById('array-rendering').innerHTML;
            
            // 初始化主卡片應用
            this.card = Vue.createApp({
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
                        originalData: null,
                        hasUnsavedChanges: false
                    }
                },
                mounted() {
                    this.loadTestData();
                    this.setupGroupSelection();
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
                        
                        // 保存原始數據
                        this.saveOriginalData();
                        
                        this.$nextTick(() => {
                            this.applyButtonStyles();
                        });
                    },
                    
                    // 設置群組選擇
                    setupGroupSelection() {
                        if (this.selectedGroupId && this.selectedGroupId !== "") {
                            this.$nextTick(() => {
                                const radio = document.querySelector(`input[name="gpListRadio"][value="${this.selectedGroupId}"]`);
                                if (radio) {
                                    radio.checked = true;
                                }
                            });
                        } else {
                            this.$nextTick(() => {
                                const radio = document.querySelector('input[name="gpListRadio"][value=""]');
                                if (radio) {
                                    radio.checked = true;
                                }
                            });
                        }
                    },
                    
                    // 強制應用按鈕樣式
                    applyButtonStyles() {
                        const buttons = document.querySelectorAll('.value-btn');
                        const deleteButtons = document.querySelectorAll('.hover-delete-btn');
                        const floatingControls = document.querySelectorAll('.floating-edit-controls, .floating-save-controls');
                        const floatingButtons = document.querySelectorAll('.floating-btn');
                        
                        // 樣式化value按鈕（不覆蓋配色，交由CSS類別控制）
                        for (const btn of buttons) {
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
                            // 清理顏色相關內聯樣式，讓CSS控制最終配色
                            btn.style.backgroundColor = '';
                            btn.style.background = '';
                            btn.style.border = '';
                            btn.style.color = '';
                        }
                        
                        // 樣式化刪除按鈕
                        for (const btn of deleteButtons) {
                            btn.style.all = 'unset';
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
                            btn.style.opacity = '1';
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
                        }
                        
                        // 樣式化浮動控制容器
                        for (const container of floatingControls) {
                            container.style.all = 'unset';
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
                        }
                        
                        // 樣式化浮動按鈕
                        for (const btn of floatingButtons) {
                            btn.style.all = 'unset';
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
                        }
                    },
                    
                    // 計算屬性百分比
                    calculatePercentage(itemA, itemB) {
                        const a = Number.parseFloat(itemA) || 0;
                        const b = Number.parseFloat(itemB) || 0;
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
                            const currentValue = Number.parseInt(this.roll[index].itemA) || 0;
                            this.roll[index].itemA = Math.max(0, currentValue + change).toString();
                        }
                    },
                    
                    // 調整屬性數值
                    adjustAttributeValue(index, field, change) {
                        if (this.state[index] && this.state[index][field] !== undefined) {
                            const currentValue = Number.parseInt(this.state[index][field]) || 0;
                            this.state[index][field] = Math.max(0, currentValue + change).toString();
                        }
                    },
                    
                    // 新增項目
                    addItem(form) {
                        switch (form) {
                            case 0:
                                this.state.push({
                                    name: "",
                                    itemA: "",
                                    itemB: "",
                                    isNewItem: true,
                                    isInlineEditing: true
                                });
                                break;
                            case 1:
                                this.roll.push({
                                    name: "",
                                    itemA: "",
                                    isNewItem: true,
                                    isInlineEditing: true
                                });
                                break;
                            case 2:
                                this.notes.push({
                                    name: "",
                                    itemA: "",
                                    isNewItem: true,
                                    isInlineEditing: true
                                });
                                break;
                            default:
                                break;
                        }
                    },
                    
                    // 移除項目
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
                    
                    // 切換編輯模式
                    toggleEditMode() {
                        if (!this.editMode) {
                            this.backupData();
                        }
                        this.editMode = !this.editMode;
                    },
                    
                    // 關閉編輯模式
                    closeEditMode() {
                        this.revertChanges();
                    },
                    
                    // 備份數據
                    backupData() {
                        this.originalData = {
                            roll: JSON.parse(JSON.stringify(this.roll)),
                            state: JSON.parse(JSON.stringify(this.state)),
                            notes: JSON.parse(JSON.stringify(this.notes)),
                            characterDetails: JSON.parse(JSON.stringify(this.characterDetails))
                        };
                    },
                    
                    // 還原變更
                    revertChanges() {
                        if (this.originalData) {
                            this.roll = JSON.parse(JSON.stringify(this.originalData.roll));
                            this.state = JSON.parse(JSON.stringify(this.originalData.state));
                            this.notes = JSON.parse(JSON.stringify(this.originalData.notes));
                            this.characterDetails = JSON.parse(JSON.stringify(this.originalData.characterDetails));
                        }
                        this.editMode = false;
                    },
                    
                    // 只還原數據
                    revertDataOnly() {
                        if (this.originalData) {
                            this.roll = JSON.parse(JSON.stringify(this.originalData.roll));
                            this.state = JSON.parse(JSON.stringify(this.originalData.state));
                            this.notes = JSON.parse(JSON.stringify(this.originalData.notes));
                            this.characterDetails = JSON.parse(JSON.stringify(this.originalData.characterDetails));
                        }
                    },
                    
                    // 檢查是否為數字
                    isNumeric(value) {
                        if (value === null || value === undefined || value === '') {
                            return false;
                        }
                        const cleanValue = value.toString().replace(/^CC\s*/i, '');
                        const num = Number.parseFloat(cleanValue);
                        const isNum = !isNaN(num) && isFinite(num);
                        return isNum;
                    },
                    
                    // 調整值
                    adjustValue(index, type, delta) {
                        const item = this.state[index];
                        if (!item) {
                            return;
                        }
                        
                        const field = type === 'current' ? 'itemA' : 'itemB';
                        const currentValue = item[field];
                        
                        if (this.isNumeric(currentValue)) {
                            const num = Number.parseFloat(currentValue.toString().replace(/^CC\s*/i, ''));
                            const newValue = Math.max(0, num + delta);
                            item[field] = newValue.toString();
                            
                            // 在非編輯模式下標記有變更
                            if (!this.editMode) {
                                this.markAsChanged();
                            }
                        }
                    },
                    
                    // 移除頻道
                    removeChannel(channelId) {
                        const channelToRemove = this.gpList.find(channel => channel._id === channelId);
                        if (!channelToRemove) {
                            debugLog(`Channel with ID ${channelId} not found`, 'error');
                            return;
                        }

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

                        this.gpList = this.gpList.filter(channel => channel._id !== channelId);
                    },
                    
                    // 配置頻道
                    config() {
                        const isDeleteModeActive = this.gpList.length > 0 && this.gpList[0].showDeleteButton;
                        
                        this.gpList = this.gpList.map(group => ({
                            ...group,
                            showDeleteButton: !isDeleteModeActive,
                            showCancelButton: false,
                            confirmDelete: false
                        }));
                    },
                    
                    // 確認移除頻道
                    confirmRemoveChannel(channel) {
                        if (!channel.confirmDelete) {
                            channel.confirmDelete = true;
                            channel.showCancelButton = true;
                        } else {
                            this.removeChannel(channel._id);
                        }
                    },
                    
                    // 取消按鈕
                    cancelButton(channel) {
                        channel.showDeleteButton = true;
                        channel.showCancelButton = false;
                        channel.confirmDelete = false;
                    },
                    
                    // 儲存選中的群組ID
                    saveSelectedGroupId() {
                        localStorage.setItem("selectedGroupId", this.selectedGroupId || "");
                        debugLog(`Saving selected group ID: ${this.selectedGroupId}`, 'info');
                    },
                    
                    // 擲骰
                    rolling(name) {
                        debugLog(`Rolling for ${name}`, 'info');
                        this.selectedGroupId = document.querySelector('input[name="gpListRadio"]:checked')?.value || null;
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
                    
                    // 要求切換公開狀態（先確認再儲存）
                    requestTogglePublic() {
                        // 目前為私人 -> 切換為公開，先彈出確認
                        if (!this.public) {
                            $('#publicConfirmModal').modal('show');
                            return;
                        }

                        // 目前為公開 -> 切為私人，直接儲存
                        this.public = false;
                        this.updateCard();
                    },

                    // 確認公開
                    confirmMakePublic() {
                        this.public = true;
                        $('#publicConfirmModal').modal('hide');
                        this.updateCard();
                    },

                    // 取消公開
                    cancelMakePublic() {
                        $('#publicConfirmModal').modal('hide');
                    },
                    
                    // 更新角色卡
                    updateCard() {
                        if (typeof globalThis.updateCard === 'function') {
                            globalThis.updateCard();
                            // 更新成功後保存原始數據
                            this.$nextTick(() => {
                                this.saveOriginalData();
                            });
                        } else {
                            console.error('Global updateCard function not found');
                            this.showError('儲存功能不可用');
                        }
                    },
                    
                    // 顯示錯誤
                    showError(message) {
                        if (typeof globalThis.showError === 'function') {
                            globalThis.showError(message);
                        } else {
                            console.error('Error:', message);
                        }
                    },
                    
                    // 保存原始數據
                    saveOriginalData() {
                        this.originalData = {
                            name: this.name,
                            state: JSON.parse(JSON.stringify(this.state)),
                            roll: JSON.parse(JSON.stringify(this.roll)),
                            notes: JSON.parse(JSON.stringify(this.notes)),
                            characterDetails: JSON.parse(JSON.stringify(this.characterDetails)),
                            public: this.public
                        };
                        this.hasUnsavedChanges = false;
                    },
                    
                    // 檢查是否有未保存的變更
                    checkForChanges() {
                        if (!this.originalData) return false;
                        
                        const currentData = {
                            name: this.name,
                            state: this.state,
                            roll: this.roll,
                            notes: this.notes,
                            characterDetails: this.characterDetails,
                            public: this.public
                        };
                        
                        return JSON.stringify(currentData) !== JSON.stringify(this.originalData);
                    },
                    
                    // 還原變更 (非編輯模式)
                    revertChanges() {
                        if (!this.originalData) return;
                        
                        this.name = this.originalData.name;
                        this.state = JSON.parse(JSON.stringify(this.originalData.state));
                        this.roll = JSON.parse(JSON.stringify(this.originalData.roll));
                        this.notes = JSON.parse(JSON.stringify(this.originalData.notes));
                        this.characterDetails = JSON.parse(JSON.stringify(this.originalData.characterDetails));
                        this.public = this.originalData.public;
                        this.hasUnsavedChanges = false;
                    },
                    
                    // 標記有變更
                    markAsChanged() {
                        this.hasUnsavedChanges = true;
                    },
                    
                    // 獲取非數值屬性
                    getNonNumericAttributes() {
                        return this.state.filter(attr => {
                            // 檢查 itemA 是否為非數值
                            if (!attr.itemA || attr.itemA.trim() === '') return false;
                            
                            // 移除 CC 前綴後檢查是否為數值
                            const cleanValue = attr.itemA.toString().replace(/^CC\s*/i, '');
                            const num = Number.parseFloat(cleanValue);
                            const isNum = !isNaN(num) && isFinite(num);
                            
                            // 返回非數值屬性
                            return !isNum;
                        });
                    },
                    
                    // 確認內聯編輯
                    confirmInlineEdit(form, index) {
                        const item = this.getItemByForm(form, index);
                        if (!item) return;
                        
                        // 驗證必填欄位
                        if (!item.name || item.name.trim() === '') {
                            this.showError('請輸入名稱');
                            return;
                        }
                        
                        // 標記為已確認的新項目
                        item.isNewItem = false;
                        item.isInlineEditing = false;
                        
                        // 標記有變更
                        this.markAsChanged();
                    },
                    
                    // 取消內聯編輯
                    cancelInlineEdit(form, index) {
                        const item = this.getItemByForm(form, index);
                        if (!item) return;
                        
                        // 如果是新項目，直接移除
                        if (item.isNewItem) {
                            this.removeItem(form, index);
                        } else {
                            // 還原到原始狀態
                            item.isInlineEditing = false;
                        }
                    },
                    
                    // 根據表單類型獲取項目
                    getItemByForm(form, index) {
                        switch (form) {
                            case 0: return this.state[index];
                            case 1: return this.roll[index];
                            case 2: return this.notes[index];
                            default: return null;
                        }
                    },
                    
                    // 顯示登出模態框
                    showLogoutModal() {
                        $('#logoutModalCenter').modal('show');
                    }
                }
            }).mount('#array-rendering');

            // 初始化卡片列表應用
            this.initializeCardList();
            
            debugLog('Card Vue app initialized successfully', 'info');
        } catch (error) {
            debugLog(`Error initializing card: ${error.message}`, 'error');
        }
    }

    /**
     * 初始化卡片列表應用
     */
    initializeCardList() {
        const cardListElement = document.querySelector('#array-cardList');
        if (cardListElement) {
            this.cardList = Vue.createApp({
                data() {
                    return {
                        list: [],
                        searchQuery: localStorage.getItem('cardList.searchQuery') || '',
                        page: Number(localStorage.getItem('cardList.page') || 1),
                        pageSize: Number(localStorage.getItem('cardList.pageSize') || 24)
                    }
                },
                computed: {
                    filteredList() {
                        if (!this.searchQuery || this.searchQuery.trim() === '') return this.list;
                        const q = this.searchQuery.trim().toLowerCase();
                        return this.list.filter(x => (x && x.name && x.name.toLowerCase().includes(q)));
                    },
                    filteredCount() {
                        return this.filteredList.length;
                    },
                    totalPages() {
                        return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize));
                    },
                    pagedList() {
                        const start = (this.page - 1) * this.pageSize;
                        return this.filteredList.slice(start, start + this.pageSize);
                    }
                },
                watch: {
                    searchQuery(val) {
                        localStorage.setItem('cardList.searchQuery', val);
                        this.page = 1;
                        localStorage.setItem('cardList.page', String(this.page));
                    },
                    page(val) {
                        localStorage.setItem('cardList.page', String(val));
                    },
                    pageSize(val) {
                        localStorage.setItem('cardList.pageSize', String(val));
                        this.page = 1;
                        localStorage.setItem('cardList.page', String(this.page));
                    }
                },
                methods: {
                    prevPage() { if (this.page > 1) this.page--; },
                    nextPage() { if (this.page < this.totalPages) this.page++; },
                    getTheSelectedOneByItem(item) {
                        if (cardManager.card && item) {
                            cardManager.card._id = item._id;
                            cardManager.card.id = item.id;
                            cardManager.card.name = item.name;
                            cardManager.card.state = item.state;
                            cardManager.card.roll = item.roll;
                            cardManager.card.notes = item.notes;
                            cardManager.card.public = item.public;
                            // 記下本機最後選用的角色卡（依用戶分隔）
                            try {
                                const userKey = (localStorage.getItem('userName') || 'default');
                                localStorage.setItem(`lastSelectedCardId:${userKey}`, item._id);
                                // 若為公開頁面，同步記錄公開卡片選擇供自動載入
                                if (cardManager.card && cardManager.card.isPublic) {
                                    localStorage.setItem('lastSelectedPublicCardId', item._id);
                                }
                            } catch (error) {}
                            $('#cardListModal').modal("hide");
                        }
                    }
                }
            }).mount('#array-cardList');
            debugLog('CardList Vue app initialized successfully', 'info');
        }
    }

    /**
     * 獲取卡片實例
     */
    getCard() {
        return this.card;
    }

    /**
     * 獲取卡片列表實例
     */
    getCardList() {
        return this.cardList;
    }
}

// 創建全局實例
window.cardManager = new CardManager();
