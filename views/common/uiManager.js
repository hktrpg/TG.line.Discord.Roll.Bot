/**
 * UI管理器 - 處理UI控制、模態框、警告訊息等
 * 從 characterCardCommon.js 中分離出來的UI管理功能
 */
class UIManager {
    constructor() {
        this.modals = {};
        this.alerts = [];
        this.alertContainer = null;
    }

    /**
     * 顯示模態框
     * @param {string} modalId - 模態框ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            $(modal).modal("show");
            this.modals[modalId] = true;
        }
    }

    /**
     * 隱藏模態框
     * @param {string} modalId - 模態框ID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            $(modal).modal("hide");
            this.modals[modalId] = false;
        }
    }

    /**
     * 創建警告容器
     * @returns {HTMLElement} 警告容器元素
     */
    createAlertContainer() {
        if (this.alertContainer) {
            return this.alertContainer;
        }

        this.alertContainer = document.createElement('div');
        this.alertContainer.id = 'alerts-container';
        this.alertContainer.style.cssText = `
            position: fixed;
            width: 30%;
            left: 60%;
            top: 15%;
            margin: 0 auto;
            z-index: 9999;
        `;
        document.body.append(this.alertContainer);
        return this.alertContainer;
    }

    /**
     * 顯示警告訊息
     * @param {string} message - 訊息內容
     * @param {string} type - 訊息類型 (success, danger, warning, info)
     * @param {number} closeDelay - 自動關閉延遲時間（毫秒）
     * @param {boolean} allowHtml - 是否允許HTML
     */
    showAlert(message, type = "info", closeDelay = 5000, allowHtml = false) {
        const container = this.createAlertContainer();
        
        const alert = document.createElement('div');
        alert.className = `alert text-wrap text-break alert-dismissible fade show alert-${type}`;
        
        // 添加關閉按鈕
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'close';
        closeButton.dataset.dismiss = 'alert';
        closeButton.innerHTML = '&times;';
        alert.append(closeButton);
        
        // 添加訊息內容
        if (allowHtml) {
            alert.innerHTML += message;
        } else {
            alert.append(document.createTextNode(this.sanitizeHtml(message)));
        }

        container.insertBefore(alert, container.firstChild);
        
        // 自動關閉
        if (closeDelay) {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, closeDelay);
        }
        
        this.alerts.push(alert);
    }

    /**
     * 隱藏特定警告
     * @param {string} alertId - 警告ID
     */
    hideAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
            this.alerts = this.alerts.filter(a => a.id !== alertId);
        }
    }

    /**
     * HTML轉義函數
     * @param {string} str - 要轉義的字串
     * @returns {string} 轉義後的字串
     */
    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 顯示成功訊息
     * @param {string} message - 訊息內容
     * @param {number} duration - 顯示時間
     */
    showSuccess(message, duration = 3000) {
        this.showAlert(
            `<i class="fas fa-check-circle me-2"></i><strong>成功!</strong> ${message}`,
            "success",
            duration,
            true
        );
    }

    /**
     * 顯示錯誤訊息
     * @param {string} message - 訊息內容
     * @param {number} duration - 顯示時間
     */
    showError(message, duration = 5000) {
        this.showAlert(
            `<i class="fas fa-exclamation-triangle me-2"></i><strong>錯誤!</strong> ${message}`,
            "danger",
            duration,
            true
        );
    }

    /**
     * 顯示警告訊息
     * @param {string} message - 訊息內容
     * @param {number} duration - 顯示時間
     */
    showWarning(message, duration = 4000) {
        this.showAlert(
            `<i class="fas fa-exclamation-circle me-2"></i><strong>警告!</strong> ${message}`,
            "warning",
            duration,
            true
        );
    }

    /**
     * 顯示資訊訊息
     * @param {string} message - 訊息內容
     * @param {number} duration - 顯示時間
     */
    showInfo(message, duration = 3000) {
        this.showAlert(
            `<i class="fas fa-info-circle me-2"></i><strong>資訊!</strong> ${message}`,
            "info",
            duration,
            true
        );
    }

    /**
     * 顯示彈出訊息（用於更新結果）
     * @param {boolean} success - 是否成功
     */
    showPopup(success) {
        debugLog(`Showing popup with result: ${success}`, 'info');
        if (success) {
            this.showSuccess("更新成功! 你可以在聊天平台上使用新資料了。", 5000);
        } else {
            this.showError("更新失敗! 請檢查或向HKTRPG回報。", 5000);
        }
    }

    /**
     * 顯示載入狀態
     * @param {HTMLElement} element - 要顯示載入狀態的元素
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        }
    }

    /**
     * 隱藏載入狀態
     * @param {HTMLElement} element - 要隱藏載入狀態的元素
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    /**
     * 應用按鈕樣式
     */
    applyButtonStyles() {
        const buttons = document.querySelectorAll('.value-btn');
        const deleteButtons = document.querySelectorAll('.hover-delete-btn');
        const floatingControls = document.querySelectorAll('.floating-edit-controls, .floating-save-controls');
        const floatingButtons = document.querySelectorAll('.floating-btn');
        
        this.styleValueButtons(buttons);
        this.styleDeleteButtons(deleteButtons);
        this.styleFloatingControls(floatingControls);
        this.styleFloatingButtons(floatingButtons);
    }

    /**
     * 樣式化數值按鈕
     * @param {NodeList} buttons - 按鈕元素列表
     */
    styleValueButtons(buttons) {
        for (const btn of buttons) {
            btn.style.all = 'unset';
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
            
            if (btn.classList.contains('plus-btn')) {
                btn.style.backgroundColor = '#22c55e';
                btn.style.color = 'white';
                btn.style.border = '1px solid #16a34a';
            } else if (btn.classList.contains('minus-btn')) {
                btn.style.backgroundColor = '#f87171';
                btn.style.color = 'white';
                btn.style.border = '1px solid #ef4444';
            }
        }
    }

    /**
     * 樣式化刪除按鈕
     * @param {NodeList} buttons - 按鈕元素列表
     */
    styleDeleteButtons(buttons) {
        for (const btn of buttons) {
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
    }

    /**
     * 樣式化浮動控制容器
     * @param {NodeList} containers - 容器元素列表
     */
    styleFloatingControls(containers) {
        for (const container of containers) {
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
    }

    /**
     * 樣式化浮動按鈕
     * @param {NodeList} buttons - 按鈕元素列表
     */
    styleFloatingButtons(buttons) {
        for (const btn of buttons) {
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
    }

    /**
     * 強制應用按鈕樣式（多次嘗試）
     */
    forceButtonStyles() {
        // 嘗試多次，因為Vue可能還在渲染
        for (let attempt = 1; attempt <= 5; attempt++) {
            setTimeout(() => {
                this.applyButtonStyles();
            }, attempt * 500);
        }
    }

    /**
     * 清理所有警告
     */
    clearAllAlerts() {
        if (this.alertContainer) {
            this.alertContainer.innerHTML = '';
        }
        this.alerts = [];
    }

    /**
     * 獲取模態框狀態
     * @param {string} modalId - 模態框ID
     * @returns {boolean} 是否顯示
     */
    getModalState(modalId) {
        return this.modals[modalId] || false;
    }
}

// 創建全局實例
window.uiManager = new UIManager();
