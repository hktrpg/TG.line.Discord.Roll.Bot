/**
 * Socket管理器 - 處理Socket.io通訊
 * 從 characterCardCommon.js 中分離出來的Socket通訊功能
 */
class SocketManager {
    constructor() {
        this.socket = io();
        this.eventHandlers = new Map();
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 擲骰結果監聽
        this.socket.on('rolling', (result) => {
            this.handleRolling(result);
        });

        // 公開擲骰結果監聽
        this.socket.on('publicRolling', (result) => {
            this.handlePublicRolling(result);
        });

        // 角色卡更新結果監聽
        this.socket.on('updateCard', (result) => {
            this.handleUpdateCard(result);
        });

        // 頻道移除結果監聽
        this.socket.on('removeChannel', (result) => {
            this.handleRemoveChannel(result);
        });

        // 獲取列表資訊監聽
        this.socket.on('getListInfo', (listInfo) => {
            this.handleListInfo(listInfo);
        });

        // 獲取公開列表資訊監聽
        this.socket.on('getPublicListInfo', (listInfo) => {
            this.handlePublicListInfo(listInfo);
        });

        // 獲取公開角色卡資訊監聽
        this.socket.on('getPublicCardInfo', (cardInfo) => {
            this.handlePublicCardInfo(cardInfo);
        });
    }

    /**
     * 處理擲骰結果
     * @param {string} result - 擲骰結果
     */
    handleRolling(result) {
        debugLog(`Received rolling result: ${result}`, 'info');
        if (result) {
            uiManager.showAlert(result, "warning", 4000, true);
        } else {
            uiManager.showError("擲骰失敗! 請檢查或向HKTRPG回報。", 4000);
            debugLog('Rolling failed', 'error');
        }
    }

    /**
     * 處理公開擲骰結果
     * @param {string} result - 擲骰結果
     */
    handlePublicRolling(result) {
        debugLog(`Received public rolling result: ${result}`, 'info');
        if (result) {
            uiManager.showAlert(result, "warning", 4000, true);
        } else {
            uiManager.showError("擲骰失敗! 請檢查或向HKTRPG回報。", 4000);
            debugLog('Public rolling failed', 'error');
        }
    }

    /**
     * 處理角色卡更新結果
     * @param {boolean} result - 更新結果
     */
    handleUpdateCard(result) {
        debugLog(`Update card result: ${result}`, 'info');
        if (result === true) {
            uiManager.showPopup(true);
            debugLog('Card updated successfully', 'info');
            
            // 關閉編輯模式
            const card = cardManager.getCard();
            if (card && card.editMode !== undefined) {
                card.editMode = false;
            }
            
            // 移除載入狀態
            this.removeLoadingState();
        } else {
            uiManager.showPopup(false);
            debugLog('Card update failed', 'error');
            
            // 移除載入狀態
            this.removeLoadingState();
        }
    }

    /**
     * 處理頻道移除結果
     * @param {Object} result - 移除結果
     */
    handleRemoveChannel(result) {
        if (result && result.success) {
            uiManager.showSuccess('頻道移除成功！', 3000);
        } else {
            uiManager.showError(`頻道移除失敗: ${result ? result.message : '未知錯誤'}`, 5000);
        }
    }

    /**
     * 處理列表資訊
     * @param {Object} listInfo - 列表資訊
     */
    handleListInfo(listInfo) {
        // 這個處理器會被 authManager 覆蓋，這裡只是預留
        debugLog('List info received', 'info');
    }

    /**
     * 處理公開列表資訊
     * @param {Object} listInfo - 公開列表資訊
     */
    handlePublicListInfo(listInfo) {
        const list = listInfo.temp;
        if (list) {
            const cardList = cardManager.getCardList();
            if (cardList && cardList.list) {
                cardList.list = list;
                $('#cardListModal').modal("show");
                debugLog('Public card list loaded successfully', 'info');
            } else {
                debugLog('CardList Vue app not initialized', 'error');
            }
        } else {
            debugLog('Failed to load public card list', 'error');
        }
    }

    /**
     * 處理公開角色卡資訊
     * @param {Object} cardInfo - 角色卡資訊
     */
    handlePublicCardInfo(cardInfo) {
        if (cardInfo && cardInfo.temp) {
            const cardData = cardInfo.temp;
            const card = cardManager.getCard();
            
            if (card) {
                card._id = cardData._id;
                card.id = cardData.id;
                card.name = cardData.name;
                card.state = cardData.state || [];
                card.roll = cardData.roll || [];
                card.notes = cardData.notes || [];
                card.public = cardData.public || false;
                try {
                    localStorage.setItem('lastSelectedPublicCardId', cardData._id);
                } catch {}
                $('#cardListModal').modal("hide");
                debugLog('Card data loaded successfully', 'info');
            }
        } else {
            debugLog('Failed to load card data', 'error');
        }
    }

    /**
     * 移除載入狀態
     */
    removeLoadingState() {
        const updateButton = document.querySelector('[onclick="updateCard()"]');
        if (updateButton) {
            uiManager.hideLoading(updateButton);
        }
        
        const cardElement = document.querySelector('.hybrid-card-container');
        if (cardElement) {
            cardElement.classList.remove('loading');
        }
    }

    /**
     * 發送擲骰請求
     * @param {Object} data - 擲骰資料
     */
    emitRolling(data) {
        this.socket.emit('rolling', data);
    }

    /**
     * 發送公開擲骰請求
     * @param {Object} data - 擲骰資料
     */
    emitPublicRolling(data) {
        this.socket.emit('publicRolling', data);
    }

    /**
     * 發送角色卡更新請求
     * @param {Object} data - 更新資料
     */
    emitUpdateCard(data) {
        this.socket.emit('updateCard', data);
    }

    /**
     * 發送獲取列表資訊請求
     * @param {Object} data - 請求資料
     */
    emitGetListInfo(data) {
        this.socket.emit('getListInfo', data);
    }

    /**
     * 發送獲取公開列表資訊請求
     */
    emitGetPublicListInfo() {
        this.socket.emit('getPublicListInfo');
    }

    /**
     * 發送獲取公開角色卡資訊請求
     * @param {Object} data - 請求資料
     */
    emitGetPublicCardInfo(data) {
        this.socket.emit('getPublicCardInfo', data);
    }

    /**
     * 發送移除頻道請求
     * @param {Object} data - 移除資料
     */
    emitRemoveChannel(data) {
        this.socket.emit('removeChannel', data);
    }

    /**
     * 添加自定義事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} handler - 事件處理器
     */
    addEventListener(event, handler) {
        this.socket.on(event, handler);
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * 移除自定義事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} handler - 事件處理器
     */
    removeEventListener(event, handler) {
        this.socket.off(event, handler);
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 獲取Socket實例
     * @returns {Socket} Socket.io實例
     */
    getSocket() {
        return this.socket;
    }

    /**
     * 檢查Socket連接狀態
     * @returns {boolean} 是否已連接
     */
    isConnected() {
        return this.socket.connected;
    }

    /**
     * 重新連接Socket
     */
    reconnect() {
        this.socket.connect();
    }

    /**
     * 斷開Socket連接
     */
    disconnect() {
        this.socket.disconnect();
    }
}

// 創建全局實例
window.socketManager = new SocketManager();
