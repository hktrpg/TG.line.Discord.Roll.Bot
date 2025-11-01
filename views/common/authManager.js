/**
 * 認證管理器 - 處理登入、登出和認證相關功能
 * 從 characterCardCommon.js 中分離出來的認證管理功能
 */
class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.userName = null;
        this.token = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryInterval = 100;
    }

    /**
     * 簡單加密函數
     * @param {string} text - 要加密的文字
     * @returns {string} 加密後的文字
     */
    encrypt(text) {
        if (!text) return '';
        return btoa(encodeURIComponent(text));
    }

    /**
     * 簡單解密函數
     * @param {string} encodedText - 加密的文字
     * @returns {string} 解密後的文字
     */
    decrypt(encodedText) {
        if (!encodedText) return '';
        try {
            return decodeURIComponent(atob(encodedText));
        } catch (error) {
            console.warn('Failed to decrypt stored data:', error.message);
            return '';
        }
    }

    /**
     * 儲存憑證到本地儲存
     * @param {string} userName - 用戶名
     * @param {string} password - 密碼
     */
    saveCredentials(userName, password) {
        localStorage.setItem('userName', userName);
        localStorage.setItem('userPassword', this.encrypt(password));
    }

    /**
     * 從本地儲存載入憑證
     * @returns {Object} 包含用戶名和密碼的物件
     */
    loadCredentials() {
        const userName = localStorage.getItem("userName");
        const userPassword = this.decrypt(localStorage.getItem("userPassword"));
        return { userName, userPassword };
    }

    /**
     * 清除本地儲存的憑證
     */
    clearCredentials() {
        localStorage.removeItem('userName');
        localStorage.removeItem('userPassword');
        localStorage.removeItem('jwtToken');
    }

    /**
     * 檢查認證狀態
     * @returns {boolean} 是否已登入
     */
    checkAuthStatus() {
        const { userName, userPassword } = this.loadCredentials();
        const token = localStorage.getItem("jwtToken");
        
        this.isLoggedIn = !!(userName && userPassword && token);
        this.userName = userName;
        this.token = token;
        
        return this.isLoggedIn;
    }

    /**
     * 設置登入表單
     */
    setupLoginForm() {
        debugLog('Setting up login form', 'info');
        this.retryCount = 0;
        this.trySetupLoginForm();
    }

    /**
     * 嘗試設置登入表單
     */
    trySetupLoginForm() {
        const userNameInput = document.querySelector('#userName');
        const userPasswordInput = document.querySelector('#userPassword_id');
        const warningElement = document.querySelector('#warning');

        if (userNameInput && userPasswordInput && warningElement) {
            // 從本地儲存設置初始值
            const { userName, userPassword } = this.loadCredentials();
            
            if (userName) userNameInput.value = userName;
            if (userPassword) userPasswordInput.value = userPassword;

            // 檢查用戶是否已經登入
            if (userName && userPassword) {
                debugLog('User already logged in, attempting to get card list', 'info');
                this.attemptAutoLogin(userName, userPassword);
            } else {
                // 如果沒有儲存的憑證，顯示登入模態框
                $('#loginModalCenter').modal("show");
            }
            
            debugLog('Login form setup completed successfully', 'info');
            return true;
        }

        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            debugLog(`Login form elements not found, retrying (${this.retryCount}/${this.maxRetries})`, 'info');
            setTimeout(() => this.trySetupLoginForm(), this.retryInterval);
            return false;
        }

        debugLog('Failed to find login form elements after maximum retries', 'error');
        return false;
    }

    /**
     * 嘗試自動登入
     * @param {string} userName - 用戶名
     * @param {string} userPassword - 密碼
     */
    attemptAutoLogin(userName, userPassword) {
        socket.emit('getListInfo', {
            userName: userName,
            userPassword: userPassword
        });

        socket.once("getListInfo", (listInfo) => {
            this.handleLoginResponse(listInfo);
        });
    }

    /**
     * 處理登入回應
     * @param {Object} listInfo - 登入回應資訊
     */
    handleLoginResponse(listInfo) {
        const list = listInfo.temp;
        const warningElement = document.querySelector('#warning');
        
        if (listInfo && listInfo.id && listInfo.id.length > 0) {
            cardManager.getCard().gpList = listInfo.id;
        }
        
        // 儲存JWT token
        if (listInfo.token) {
            localStorage.setItem('jwtToken', listInfo.token);
            this.token = listInfo.token;
        }
        
        if (list) {
            if (warningElement) {
                warningElement.style.display = "none";
            }
            // cardList Vue app may not be mounted yet; guard and retry briefly
            const assignListSafely = (attemptsLeft = 10) => {
                const cardListApp = cardManager.getCardList();
                if (cardListApp && cardListApp.list !== undefined) {
                    cardListApp.list = list;
                    return true;
                }
                if (attemptsLeft > 0) {
                    setTimeout(() => assignListSafely(attemptsLeft - 1), 100);
                    return false;
                }
                return false;
            };
            assignListSafely();
            // 嘗試自動載入上次選用的角色卡（依用戶分隔）
            try {
                const userKey = (localStorage.getItem('userName') || 'default');
                const savedId = localStorage.getItem(`lastSelectedCardId:${userKey}`);
                if (savedId) {
                    const selected = list.find((item) => item && item._id === savedId);
                    if (selected && cardManager.getCard()) {
                        const card = cardManager.getCard();

                        // 清除之前的原始數據，避免不同卡片的數據混合
                        card.originalData = null;
                        card.hasUnsavedChanges = false;

                        card._id = selected._id;
                        card.id = selected.id;
                        card.name = selected.name;
                        card.image = selected.image || "";
                        card.state = selected.state || [];
                        card.roll = selected.roll || [];
                        card.notes = selected.notes || [];
                        card.public = selected.public || false;
                        $('#cardListModal').modal("hide");

                        // 保存新卡片的原始數據
                        card.$nextTick(() => {
                            card.saveOriginalData();
                        });
                    } else {
                        $('#cardListModal').modal("show");
                    }
                } else {
                    $('#cardListModal').modal("show");
                }
            } catch {
                $('#cardListModal').modal("show");
            }
            this.isLoggedIn = true;

            // 觸發登入狀態更新事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: true, userName: this.userName }
            }));
        } else {
            // 如果登入失敗，顯示登入模態框
            $('#loginModalCenter').modal("show");
            this.isLoggedIn = false;

            // 觸發登入狀態更新事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: false, userName: null }
            }));
        }
    }

    /**
     * 執行登入
     */
    login() {
        const userNameInput = document.querySelector('#userName');
        const userPasswordInput = document.querySelector('#userPassword_id');
        const warningElement = document.querySelector('#warning');

        if (!userNameInput || !userPasswordInput || !warningElement) {
            debugLog('Login form elements not found', 'error');
            return;
        }

        const userName = userNameInput.value;
        const userPassword = userPasswordInput.value;

        // 儲存憑證到本地儲存
        this.saveCredentials(userName, userPassword);

        if (userName && userName.length >= 4 && userPassword && userPassword.length >= 6) {
            socket.emit('getListInfo', {
                userName: userName,
                userPassword: userPassword
            });

            socket.on("getListInfo", (listInfo) => {
                this.handleLoginResponse(listInfo);
                
                if (listInfo.temp) {
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

    /**
     * 執行登出
     */
    logout() {
        const warningElement = document.querySelector('#warning');
        if (warningElement) {
            warningElement.style.display = "none";
        }
        
        $('#loginModalCenter').modal("show");
        
        // 清除卡片資料
        const card = cardManager.getCard();
        if (card) {
            card._id = "";
            card.id = "";
            card.name = "";
            card.notes = "";
            card.roll = "";
            card.state = "";
            card.public = false;
        }
        
        // 清除認證狀態
        this.isLoggedIn = false;
        this.userName = null;
        this.token = null;
    }

    /**
     * 獲取當前登入狀態
     * @returns {boolean} 是否已登入
     */
    getIsLoggedIn() {
        return this.isLoggedIn;
    }

    /**
     * 獲取當前用戶名
     * @returns {string|null} 用戶名
     */
    getUserName() {
        return this.userName;
    }

    /**
     * 獲取當前token
     * @returns {string|null} JWT token
     */
    getToken() {
        return this.token;
    }
}

// 創建全局實例
window.authManager = new AuthManager();
