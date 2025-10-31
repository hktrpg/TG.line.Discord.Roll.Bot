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
                        image: "",
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
                        hasUnsavedChanges: false,
                        // Note modal state
                        modalNoteTitle: '',
                        modalNoteContent: '',
                        // Auth state reactivity
                        authStateVersion: 0
                    }
                },
                computed: {
                    // 根據 localStorage 判斷是否登入
                    isLoggedIn() {
                        // Force reactivity by depending on authStateVersion
                        this.authStateVersion;
                        try {
                            const hasUser = !!localStorage.getItem('userName');
                            const hasToken = !!localStorage.getItem('jwtToken');
                            return hasUser && hasToken;
                        } catch { return false; }
                    },
                    headerBadges() {
                        try {
                            const badges = [];
                            // characterDetails
                            if (Array.isArray(this.characterDetails)) {
                                for (const detail of this.characterDetails) {
                                    if (detail && detail.label && detail.value && detail.value.toString().trim() !== '') {
                                        const val = detail.value.toString().trim();
                                        if (this.withinHeaderTextLength(val)) {
                                            badges.push({ label: detail.label, value: val, icon: 'info-circle', source: 'detail' });
                                        }
                                    }
                                }
                            }
                            // state-derived badges: only current value, non-numeric, short
                            if (Array.isArray(this.state)) {
                                for (const attr of this.state) {
                                    if (!attr || !attr.name) continue;
                                    const a = (attr.itemA ?? '').toString();
                                    const b = (attr.itemB ?? '').toString();
                                    const onlyCurrent = !b || b.trim() === '';
                                    const nonNumeric = !this.isNumeric(a);
                                    if (onlyCurrent && nonNumeric && a.trim() !== '' && this.withinHeaderTextLength(a)) {
                                        badges.push({ label: attr.name, value: a.trim(), icon: 'tag', source: 'state' });
                                    }
                                }
                            }
                            // dedupe
                            const seen = new Set();
                            const unique = [];
                            for (const b of badges) {
                                const key = `${b.label}|${b.value}`;
                                if (!seen.has(key)) { seen.add(key); unique.push(b); }
                            }
                            return unique.slice(0, 6);
                        } catch (e) {
                            debugLog(`headerBadges compute failed: ${e && e.message}`, 'error');
                            return [];
                        }
                    }
                },
                mounted() {
                    try {
                        const path = (window && window.location && window.location.pathname) ? window.location.pathname : '';
                        const isTestPage = /cardtest/i.test(path);
                        if (isTestPage) {
                            this.loadTestData();
                        } else {
                            debugLog('Skipping test data seeding on non-test page', 'info');
                            // 確保啟動時為乾淨狀態
                            this.name = '';
                            this.image = '';
                            this.state = [];
                            this.roll = [];
                            this.notes = [];
                            this.characterDetails = [];
                        }
                    } catch {
                        // 安全保護：若出錯則不灌測試資料
                    }
                    this.setupGroupSelection();
                    try {
                        const badges = this.headerBadges || [];
                        debugLog(`Header badges computed (initial): ${badges.length}`,'info', badges.map(b=>({label:b.label,value:b.value,source:b.source})));
                    } catch {}
                    // 監聽 storage 事件以便登入狀態改變時觸發重繪
                    try {
                        this.__onStorage = (e) => {
                            if (!e || !e.key) return;
                            if (e.key === 'userName' || e.key === 'jwtToken') {
                                this.$forceUpdate();
                            }
                        };
                        window.addEventListener('storage', this.__onStorage);
                    } catch {}

                    // 監聽自定義認證狀態改變事件
                    try {
                        this.__onAuthStateChanged = (e) => {
                            debugLog('Auth state change event received', 'info', e.detail);
                            this.refreshAuthState();
                        };
                        window.addEventListener('authStateChanged', this.__onAuthStateChanged);
                    } catch {}
                },
                beforeUnmount() {
                    try { if (this.__onStorage) { window.removeEventListener('storage', this.__onStorage); this.__onStorage = null; } } catch {}
                    try { if (this.__onAuthStateChanged) { window.removeEventListener('authStateChanged', this.__onAuthStateChanged); this.__onAuthStateChanged = null; } } catch {}
                },
                watch: {
                    state: {
                        deep: true,
                        handler() {
                            try {
                                const badges = this.headerBadges || [];
                                debugLog(`Header badges recomputed (state changed): ${badges.length}`,'info', badges.map(b=>({label:b.label,value:b.value,source:b.source})));
                            } catch {}
                        }
                    },
                    characterDetails: {
                        deep: true,
                        handler() {
                            try {
                                const badges = this.headerBadges || [];
                                debugLog(`Header badges recomputed (details changed): ${badges.length}`,'info', badges.map(b=>({label:b.label,value:b.value,source:b.source})));
                            } catch {}
                        }
                    }
                },
                methods: {
                    // 是否為徽章屬性（非編輯模式時應隱藏於屬性格）
                    isBadgeAttribute(item) {
                        if (!item) return false;
                        // 正在內聯編輯的項目不應被視為徽章屬性
                        if (item.isInlineEditing) return false;
                        const a = (item.itemA ?? '').toString();
                        const b = (item.itemB ?? '').toString();
                        const onlyCurrent = !b || b.trim() === '';
                        const nonNumeric = !this.isNumeric(a);
                        const shortEnough = this.withinHeaderTextLength(a);
                        return !!item.name && onlyCurrent && nonNumeric && a.trim() !== '' && shortEnough;
                    },
                    isCjk(str) {
                        if (!str) return false;
                        return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(str);
                    },
                    withinHeaderTextLength(str) {
                        if (!str) return false;
                        const s = str.toString().trim();
                        const limit = this.isCjk(s) ? 10 : 30;
                        return s.length <= limit;
                    },
                    // 判斷筆記是否過長
                    isLongNote(item, limit = 160) {
                        try {
                            const text = (item && (item.itemA || item.content || '') || '').toString();
                            return text.length > limit;
                        } catch { return false; }
                    },
                    // 取得截斷後的筆記內容（純文字）
                    truncatedNote(item, limit = 160) {
                        try {
                            const raw = (item && (item.itemA || item.content || '') || '').toString();
                            const text = raw.replace(/\r\n|\n|\r/g, ' ');
                            if (text.length <= limit) return text;
                            return text.slice(0, limit).trim() + '…';
                        } catch { return ''; }
                    },
                    // 開啟筆記全文彈窗
                    openNoteModal(item) {
                        try {
                            this.modalNoteTitle = (item && (item.name || item.title || '')) || '';
                            const raw = (item && (item.itemA || item.content || '') || '').toString();
                            // 保留換行
                            this.modalNoteContent = raw.replace(/\n/g, '<br>');
                            $('#noteDetailModal').modal('show');
                            debugLog('Opened note detail modal', 'info', { title: this.modalNoteTitle, length: raw.length });
                        } catch (e) {
                            debugLog(`openNoteModal failed: ${e && e.message}`, 'error');
                        }
                    },
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

                        this.image = 'https://images2.imgbox.com/ea/b2/Bn8DmRTW_o.png';
                        
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
                            image: this.image,
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
                            image: this.image,
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
                        this.image = this.originalData.image;
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
                    
                    // 登入方法
                    login() {
                        if (typeof window.login === 'function') {
                            window.login();
                            // Force UI update after login attempt
                            setTimeout(() => {
                                this.refreshAuthState();
                            }, 100);
                        } else {
                            debugLog('Global login function not found', 'error');
                        }
                    },

                    // 重新整理認證狀態（強制更新UI）
                    refreshAuthState() {
                        this.authStateVersion++;
                        debugLog('Auth state refreshed', 'info', { isLoggedIn: this.isLoggedIn });
                    },

                    // 顯示登出模態框
                    showLogoutModal() {
                        $('#logoutModalCenter').modal('show');
                    },

                    // 圖片URL安全檢查
                    isSafeImageUrl(url) {
                        if (!url || typeof url !== 'string') return false;
                        try {
                            const u = new URL(url);
                            if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
                            const host = u.hostname.toLowerCase();
                            const blocked = [/^localhost$/i, /^127\./, /^192\.168\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^\[?::1\]?$/, /^\[?fe80:/i];
                            if (blocked.some(rx => rx.test(host))) return false;
                            return true;
                        } catch { return false; }
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
        // 防止重複初始化
        if (this.cardList) {
            debugLog('Card list already initialized, skipping', 'info');
            return;
        }

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
                    // 產出測試角色項目
                    testItem() {
                        return {
                            _id: '_test_',
                            id: '_test_',
                            name: '測試角色',
                            image: 'https://images2.imgbox.com/ea/b2/Bn8DmRTW_o.png',
                            state: [
                                { name: 'HP', itemA: '11', itemB: '11' },
                                { name: 'MP', itemA: '16', itemB: '16' },
                                { name: 'SAN', itemA: '80', itemB: '80' },
                                { name: '體格', itemA: '1', itemB: '' },
                                { name: 'DB', itemA: '＋1D4', itemB: '' },
                                { name: 'MOV', itemA: '8', itemB: '' },
                                { name: '護甲', itemA: '0', itemB: '' },
                                { name: '職業', itemA: '保險調查員', itemB: '' },
                                { name: '特徵', itemA: '野外活動愛好者', itemB: '' }
                            ],
                            roll: [
                                { name: '心理學', itemA: 'CC 10' },
                                { name: '信譽', itemA: 'CC 5' },
                                { name: '偵查', itemA: 'CC 25' },
                                { name: '鬥毆', itemA: 'CC 25' },
                                { name: '魔法', itemA: 'CC 1' },
                                { name: '小刀', itemA: 'CC 25' },
                                { name: '幸運', itemA: 'CC 50' },
                                { name: '占卜', itemA: 'CC 80' },
                            ],
                            notes: [
                                { name: '調查筆記', itemA: '這是測試筆記內容' },
                                { name: '戰鬥記錄', itemA: '戰鬥日誌記錄' }
                            ],
                            public: false
                        };
                    },
                    // 含測試角色置頂的清單，避免重複
                    listWithTest() {
                        const base = Array.isArray(this.list) ? this.list : [];
                        // 避免與伺服器回傳同 _id 重覆
                        const filteredBase = base.filter(x => x && x._id !== this.testItem._id);
                        return [this.testItem, ...filteredBase];
                    },
                    filteredList() {
                        const source = this.listWithTest;
                        if (!this.searchQuery || this.searchQuery.trim() === '') return source;
                        const q = this.searchQuery.trim().toLowerCase();
                        return source.filter(x => (x && x.name && x.name.toLowerCase().includes(q)));
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
                            cardManager.card.image = item.image || "";
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
