/**
 * Socket管理器 - 處理Socket.io通訊
 * 從 characterCardCommon.js 中分離出來的Socket通訊功能
 */
class SocketManager {
    constructor() {
        // Socket.io connection with reconnection options
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5
        });

        this.eventHandlers = new Map();
        this.publicListProcessed = false;
        this.publicCardLoadedId = null;

        // Retry management using RetryManager
        this.retryManager = window.retryManager;

        this.setupEventListeners();
        this.setupConnectionListeners();
    }

    /**
     * 設置連接狀態監聽器
     */
    setupConnectionListeners() {
        this.socket.on('connect', () => {
            debugLog('Socket connected successfully', 'info');
            this.resetRetryCounters();
        });

        this.socket.on('disconnect', (reason) => {
            debugLog(`Socket disconnected: ${reason}`, 'warn');
        });

        this.socket.on('connect_error', (error) => {
            debugLog(`Socket connection error: ${error.message}`, 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            debugLog(`Socket reconnected after ${attemptNumber} attempts`, 'info');
            this.resetRetryCounters();
        });

        this.socket.on('reconnect_failed', () => {
            debugLog('Socket reconnection failed permanently', 'error');
        });
    }

    /**
     * 重置重試計數器
     */
    resetRetryCounters() {
        // Reset all retry states using RetryManager
        this.retryManager.resetAllRetryStates();
    }

    /**
     * 計算重試延遲時間（委派給 RetryManager）
     * @param {number} retryCount - 當前重試次數
     * @returns {number} 延遲毫秒數
     */
    calculateRetryDelay(retryCount) {
        return this.retryManager.calculateRetryDelay(retryCount);
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
     * 處理列表資訊（私有角色卡）
     * @param {Object} listInfo - 列表資訊
     */
    handleListInfo(listInfo) {
        debugLog('Private list info received', 'info');

        // 將處理委派給authManager，但這裡進行重試管理
        if (authManager && typeof authManager.handleListInfoWithRetry === 'function') {
            authManager.handleListInfoWithRetry(listInfo);
        } else {
            // Fallback: 如果authManager沒有處理方法，則直接處理
            debugLog('authManager not available, processing directly', 'warn');
            if (authManager && typeof authManager.handleLoginResponse === 'function') {
                authManager.handleLoginResponse(listInfo);
            }
        }
    }

    /**
     * 處理公開列表資訊
     * @param {Object} listInfo - 公開列表資訊
     */
    handlePublicListInfo(listInfo) {
        const list = listInfo.temp;
        if (this.publicListProcessed) {
            debugLog('Public list already processed, skipping', 'info');
            return;
        }
        if (list) {
            const cardList = cardManager.getCardList();
            if (cardList && cardList.list !== undefined) {
                debugLog(`Setting card list with ${list.length} items`, 'info');
                cardList.list = list;
                this.publicListProcessed = true;

                // Try auto-select by saved public card id first
                try {
                    const savedId = localStorage.getItem('lastSelectedPublicCardId');
                    const selected = savedId && list.find((x) => x && x._id === savedId);
                    if (selected && selected._id) {
                        debugLog(`Auto-selecting saved card: ${selected.name}`, 'info');
                        const card = cardManager.getCard();
                        if (card) {
                            // 清除之前的原始數據，避免不同卡片的數據混合
                            card.originalData = null;
                            card.hasUnsavedChanges = false;

                            card._id = selected._id;
                            card.id = selected.id;
                            card.name = selected.name;
                            card.state = selected.state || [];
                            card.roll = selected.roll || [];
                            card.notes = selected.notes || [];
                            card.public = selected.public || false;
                            card.image = selected.image || "";
                            try { localStorage.setItem('lastSelectedPublicCardId', selected._id); } catch {}
                            try { $('#cardListModal').modal("hide"); } catch {}
                            this.publicCardLoadedId = selected._id;

                            // 保存新卡片的原始數據
                            card.$nextTick(() => {
                                card.saveOriginalData();
                            });
                            return;
                        }
                    }
                } catch (error) {
                    debugLog(`Auto-select failed: ${error.message}`, 'error');
                }

                // Show modal if no auto-selection
                try {
                    $('#cardListModal').modal("show");
                    debugLog('Card list modal shown', 'info');
                } catch (error) {
                    debugLog(`Failed to show card list modal: ${error.message}`, 'error');
                }
            } else {
                // Use RetryManager for retry logic
                const retryKey = 'publicCardList';

                this.retryManager.retry(
                    retryKey,
                    async () => {
                        const cardList = cardManager.getCardList();
                        if (cardList && cardList.list !== undefined) {
                            debugLog(`Setting card list with ${list.length} items`, 'info');
                            cardList.list = list;
                            this.publicListProcessed = true;

                            // Try auto-select by saved public card id first
                            try {
                                const savedId = localStorage.getItem('lastSelectedPublicCardId');
                                const selected = savedId && list.find((x) => x && x._id === savedId);
                                if (selected && selected._id) {
                                    debugLog(`Auto-selecting saved card: ${selected.name}`, 'info');
                                    const card = cardManager.getCard();
                                    if (card) {
                                        // 清除之前的原始數據，避免不同卡片的數據混合
                                        card.originalData = null;
                                        card.hasUnsavedChanges = false;

                                        card._id = selected._id;
                                        card.id = selected.id;
                                        card.name = selected.name;
                                        card.state = selected.state || [];
                                        card.roll = selected.roll || [];
                                        card.notes = selected.notes || [];
                                        card.public = selected.public || false;
                                        card.image = selected.image || "";
                                        try { localStorage.setItem('lastSelectedPublicCardId', selected._id); } catch {}
                                        try { $('#cardListModal').modal("hide"); } catch {}
                                        this.publicCardLoadedId = selected._id;

                                        // 保存新卡片的原始數據
                                        card.$nextTick(() => {
                                            card.saveOriginalData();
                                        });
                                        return;
                                    }
                                }
                            } catch (error) {
                                debugLog(`Auto-select failed: ${error.message}`, 'error');
                            }

                            // Show modal if no auto-selection
                            try {
                                $('#cardListModal').modal("show");
                                debugLog('Card list modal shown', 'info');
                            } catch (error) {
                                debugLog(`Failed to show card list modal: ${error.message}`, 'error');
                            }

                            return true; // Success
                        }
                        throw new Error('CardList Vue app not ready');
                    },
                    {
                        onRetry: (attemptCount, error) => {
                            debugLog(`CardList Vue app not ready, retrying (attempt ${attemptCount})`, 'warn');
                        },
                        onMaxRetries: (attemptCount, error) => {
                            debugLog(`CardList Vue app not ready after ${attemptCount} retries, giving up`, 'error');
                        }
                    }
                ).catch(error => {
                    debugLog(`Public card list assignment failed: ${error.message}`, 'error');
                });
            }
        } else {
            debugLog('No list data received', 'warn');
        }
    }

    /**
     * 處理公開角色卡資訊
     * @param {Object} cardInfo - 角色卡資訊
     */
    handlePublicCardInfo(cardInfo) {
        if (cardInfo && cardInfo.temp) {
            const cardData = cardInfo.temp;
            if (this.publicCardLoadedId && this.publicCardLoadedId === cardData._id) {
                return;
            }
            const card = cardManager.getCard();
            
            if (card) {
                card._id = cardData._id;
                card.id = cardData.id;
                card.name = cardData.name;
                card.image = cardData.image || "";
                card.state = cardData.state || [];
                card.roll = cardData.roll || [];
                card.notes = cardData.notes || [];
                card.public = cardData.public || false;
                try {
                    localStorage.setItem('lastSelectedPublicCardId', cardData._id);
                } catch {}
                $('#cardListModal').modal("hide");
                this.publicCardLoadedId = cardData._id;
            }
        } else {
            // ignore
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
            if (index !== -1) {
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
