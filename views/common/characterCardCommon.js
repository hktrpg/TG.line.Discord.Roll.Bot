// Common JavaScript code for character card pages - Refactored version
// Use modular architecture, depends on cardManager, authManager, uiManager, socketManager

let TITLE = "HKTRPG 角色卡";
// eslint-disable-next-line no-unused-vars
let socket = socketManager.getSocket();
// XSS Protection function (currently unused)
function _sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Debug logging with sensitive data filtering
function debugLog(message, type = 'info', data) {
    try {
        const redact = (text) => {
            if (typeof text !== 'string') return text;
            return text
                .replaceAll(/(password["':\s]*)([^\s"']+)/gi, '$1[REDACTED]')
                .replaceAll(/(token["':\s]*)([^\s"']+)/gi, '$1[REDACTED]')
                .replaceAll(/(userPassword["':\s]*)([^\s"']+)/gi, '$1[REDACTED]')
                .replaceAll(/(auth["':\s]*)([^\s"']+)/gi, '$1[REDACTED]');
        };

        const ts = new Date().toISOString();
        const safeMessage = redact(typeof message === 'string' ? message : JSON.stringify(message));
        if (data !== undefined) {
            // Avoid logging full objects with sensitive fields
            let safeData = data;
            try {
                safeData = JSON.parse(JSON.stringify(data));
                if (safeData && typeof safeData === 'object') {
                    for (const k of ['password', 'userPassword', 'token', 'auth']) {
                        if (k in safeData) safeData[k] = '[REDACTED]';
                    }
                }
            } catch {}
            console.log(`[${ts}] [${type}]`, safeMessage, safeData);
        } else {
            console.log(`[${ts}] [${type}] ${safeMessage}`);
        }
    } catch (error) {
        // Fallback minimal log
        try { console.log(`[${new Date().toISOString()}] [error] debugLog failure: ${error && error.message}`); } catch {}
    }
}

// Vue Applications - Use cardManager
let card = null;
let _cardList = null;

function initializeVueApps(isPublic = false, skipUITemplateLoad = false) {
    try {
        // Set title based on card type
        TITLE = isPublic ? "HKTRPG 公開角色卡" : "HKTRPG 私人角色卡";

        // Update page title
        document.title = `${TITLE} @ HKTRPG`;

        // Only load UI template if not already loaded (skipUITemplateLoad = true means UI is already loaded)
        if (!skipUITemplateLoad) {
            $("#array-rendering").load("/common/characterCardUI.html", function(response, status, xhr) {
                if (status === "error") {
                    debugLog(`Failed to load characterCardUI.html: ${xhr.status} ${xhr.statusText}`, 'error');
                    // Retry once after a delay
                    setTimeout(() => {
                        $("#array-rendering").load("/common/characterCardUI.html", function(response2, status2, xhr2) {
                            if (status2 === "error") {
                                debugLog(`Retry failed to load characterCardUI.html: ${xhr2.status} ${xhr2.statusText}`, 'error');
                                return;
                            }
                            initializeVueAppsInternal(isPublic, null);
                        });
                    }, 1000);
                    return;
                }
                initializeVueAppsInternal(isPublic, null);
            });
        } else {
            // Load the hybrid UI template into a temporary container first
            const tempContainer = document.createElement('div');
            tempContainer.style.display = 'none';
            document.body.append(tempContainer);

            $(tempContainer).load("/common/hybridCharacterCardUI.html", function(response, status, xhr) {
                if (status === "error") {
                    debugLog(`Failed to load hybridCharacterCardUI.html: ${xhr.status} ${xhr.statusText}`, 'error');
                    // Remove the temporary container
                    tempContainer.remove();
                    // Retry once after a delay
                    setTimeout(() => {
                        const retryContainer = document.createElement('div');
                        retryContainer.style.display = 'none';
                        document.body.append(retryContainer);

                        $(retryContainer).load("/common/hybridCharacterCardUI.html", function(response2, status2, xhr2) {
                            if (status2 === "error") {
                                debugLog(`Retry failed to load hybridCharacterCardUI.html: ${xhr2.status} ${xhr2.statusText}`, 'error');
                                retryContainer.remove();
                                return;
                            }
                            const templateContent = retryContainer.innerHTML;
                            retryContainer.remove();
                            initializeVueAppsInternal(isPublic, templateContent);
                        });
                    }, 1000);
                    return;
                }

                const templateContent = tempContainer.innerHTML;

                // Remove the temporary container
                tempContainer.remove();

                initializeVueAppsInternal(isPublic, templateContent);
            });
        }
    } catch (error) {
        debugLog(`Error in initializeVueApps: ${error.message}`, 'error');
    }
}

function initializeVueAppsInternal(isPublic = false, templateContent = null) {
    try {
        // Use cardManager to initialize character card
        cardManager.initializeCard(isPublic, templateContent);
        
        // Get instance reference
        card = cardManager.getCard();
        _cardList = cardManager.getCardList();

        debugLog('Vue applications initialized successfully', 'info');

        // Set up login form for private cards
        if (!isPublic) {
            authManager.setupLoginForm();
        } else {
            // Public page: Request public list after Vue initialization completes, using improved retry mechanism
            this.requestPublicListWithRetry();
        }
    } catch (error) {
        debugLog(`Error initializing Vue apps internal: ${error.message}`, 'error');
    }
}

/**
 * 使用改進的重試機制請求公開清單
 */
function requestPublicListWithRetry() {
    try {
        if (!socketManager || !socketManager.getSocket) {
            debugLog('SocketManager not available for public list request', 'error');
            return;
        }

        const socket = socketManager.getSocket();
        if (socket && typeof socket.emit === 'function') {
            debugLog('Requesting public card list', 'info');
            socket.emit('getPublicListInfo');

            // Set up progressive timeout checks with increasing delays
            const timeoutDelays = [2000, 5000, 10_000, 20_000]; // 2s, 5s, 10s, 20s
            let timeoutIndex = 0;

            const scheduleTimeoutCheck = () => {
                if (timeoutIndex >= timeoutDelays.length) {
                    debugLog('Public list request exhausted all retry attempts', 'error');
                    return;
                }

                const timeoutId = setTimeout(() => {
                    if (!socketManager.publicListProcessed && socketManager.getSocket().connected) {
                        debugLog(`Public list request timeout after ${timeoutDelays[timeoutIndex]}ms, retrying (attempt ${timeoutIndex + 1}/${timeoutDelays.length})`, 'warn');
                        socket.emit('getPublicListInfo');
                        timeoutIndex++;
                        scheduleTimeoutCheck();
                    }
                }, timeoutDelays[timeoutIndex]);

                // Store timeout ID in socketManager for cleanup
                socketManager.publicListRequestTimeouts.push(timeoutId);
            };

            scheduleTimeoutCheck();
        } else {
            debugLog('Socket not available for public list request', 'error');
        }
    } catch (error) {
        debugLog(`Error requesting public list: ${error.message}`, 'error');
    }
}

// Login function - Use authManager
function login() {
    authManager.login();
}

// Logout function - Use authManager
function logout() {
    authManager.logout();
}

// Confirm logout function
function confirmLogout() {
    // Clear local login information
    try { localStorage.removeItem('userName'); } catch {}
    try { localStorage.removeItem('userPassword'); } catch {}
    try { localStorage.removeItem('jwtToken'); } catch {}
    try { localStorage.removeItem('selectedGroupId'); } catch {}

    // Close popup
    $('#logoutModalCenter').modal('hide');

    // Message prompt and reload
    uiManager.showSuccess('已成功登出');
    setTimeout(() => { window.location.reload(); }, 800);
}

// Edit Mode Close Confirm Functions
function confirmSaveChangesAndExitEditMode() {
    if (cardManager && cardManager.getCard) {
        const card = cardManager.getCard();
        if (card) {
            // Save changes and exit edit mode
            card.saveCard();
            card.editMode = false;
            card.editModeBackup = null;
            card.hasUnsavedChanges = false;
        }
    }
    // 關閉模態框
    $('#editModeCloseConfirmModal').modal('hide');
}

function confirmExitEditModeWithoutSaving() {
    if (cardManager && cardManager.getCard) {
        const card = cardManager.getCard();
        if (card) {
            // Exit edit mode and restore changes
            card.closeEditMode();
        }
    }
    // 關閉模態框
    $('#editModeCloseConfirmModal').modal('hide');
}

// DOM Ready Handler
$(function () {
    debugLog('DOM ready, initializing components', 'info');
    $("#header").load("includes/header.html", function () {
        $("#title").text(TITLE);
    });
    $("#footer").load("includes/footer.html");
});

// Alert Functions - 使用 uiManager
function _popup(result) {
    debugLog(`Showing popup with result: ${result}`, 'info');
    uiManager.showPopup(result);
}

function _addElement(message, type, closeDelay, allowHtml = false) {
    uiManager.showAlert(message, type, closeDelay, allowHtml);
}

// Modal Functions
function readme() {
    uiManager.showModal('readmeModalCenter');
}

function selectCard() {
    // Check if there are unsaved changes - only check on private pages with edit permissions
    if (cardManager && cardManager.getCard) {
        const card = cardManager.getCard();
        if (card && !card.isPublic) {
            // Check if floating-save-controls is displayed (indicates unsaved changes)
            const floatingControls = document.querySelector('.floating-save-controls');
            if (floatingControls) {
                if (confirm('您有未儲存的變更，確定要離開嗎？未儲存的變更將會遺失。')) {
                    uiManager.showModal('cardListModal');
                }
                return;
            }
        }
    }
    uiManager.showModal('cardListModal');
}

// Update card function for hybrid UI - 使用 socketManager
function updateCard() {
    // Public pages prohibit saving
    if (card && card.isPublic) {
        uiManager.showInfo('公開頁面僅供瀏覽與擲骰，無法儲存。');
        return;
    }
    const userName = localStorage.getItem("userName");
    const token = localStorage.getItem("jwtToken");

    console.log('updateCard called - userName:', userName, 'token exists:', !!token);

    if (!userName || !token) {
        console.log('updateCard failed - missing credentials:', { userName: !!userName, token: !!token });
        uiManager.showError('請先登入才能更新角色卡');
        return;
    }

    // Show loading state
    const updateButton = document.querySelector('[onclick="updateCard()"]');
    if (updateButton) {
        uiManager.showLoading(updateButton);
    }

    // Add loading class to card
    const cardElement = document.querySelector('.hybrid-card-container');
    if (cardElement) {
        cardElement.classList.add('loading');
    }

    // First perform frontend validation: prohibit duplicate names and overly long content
    const clientValidationError = validateClientCardPayload({
        _id: card._id,
        id: card.id,
        image: card.image,
        state: card.state,
        roll: card.roll,
        notes: card.notes,
        characterDetails: card.characterDetails,
        public: card.public,
        name: card.name
    });
    if (clientValidationError) {
        uiManager.showError(clientValidationError);
        uiManager.hideLoading(updateButton);
        if (cardElement) { cardElement.classList.remove('loading'); }
        return;
    }

    const data = {
        userName: userName,
        token: token,
        card: {
            _id: card._id,
            id: card.id,
            image: card.image,
            name: card.name, // Force include name no matter what
            state: card.state,
            roll: card.roll,
            notes: card.notes,
            characterDetails: card.characterDetails,
            public: card.public
        }
    };
    debugLog('updateCard outgoing (patched):', 'info', data.card);
    socketManager.emitUpdateCard(data);
}

// Frontend validation: avoid duplicate names and field length exceeding limits (consistent with backend)
function validateClientCardPayload(payload) {
    try {
        if (!payload) return '資料無效';
        const name = (payload.name || '').toString().trim();
        if (!name) return '角色卡名稱不可為空';
        if (name.length > 50) return '角色卡名稱長度不可超過 50 字元';

        const tooLong = (v, m) => (v || '').toString().length > m;
        const norm = (s) => (s || '').toString().trim().toLowerCase();
        const findDups = (arr) => {
            const seen = new Set();
            const d = new Set();
            for (const it of (arr || [])) {
                const k = norm(it && it.name);
                if (!k) continue;
                if (seen.has(k)) d.add((it.name || '').toString()); else seen.add(k);
            }
            return [...d];
        };

        const sD = findDups(payload.state);
        const rD = findDups(payload.roll);
        const nD = findDups(payload.notes);
        if (sD.length > 0 || rD.length > 0 || nD.length > 0) {
            let msg = '偵測到重複項目名稱:\n';
            if (sD.length > 0) msg += `狀態: ${sD.join(', ')}\n`;
            if (rD.length > 0) msg += `擲骰: ${rD.join(', ')}\n`;
            if (nD.length > 0) msg += `備註: ${nD.join(', ')}\n`;
            return msg.trim();
        }

        for (const it of (payload.state || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '狀態項目名稱不可為空';
            if (tooLong(it.name, 50)) return `狀態「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 50)) return `狀態「${it.name}」當前值超過 50 字元`;
            if (tooLong(it.itemB, 50)) return `狀態「${it.name}」最大值超過 50 字元`;
        }
        for (const it of (payload.roll || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '擲骰項目名稱不可為空';
            if (tooLong(it.name, 50)) return `擲骰「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 150)) return `擲骰「${it.name}」內容超過 150 字元`;
        }
        for (const it of (payload.notes || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '備註項目名稱不可為空';
            if (tooLong(it.name, 50)) return `備註「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 1500)) return `備註「${it.name}」內容超過 1500 字元`;
        }
        return null;
    } catch { return '驗證失敗'; }
}

// Enhanced error display - 使用 uiManager
function showError(message) {
    uiManager.showError(message);
}

// Enhanced success display - 使用 uiManager
function showSuccess(message) {
    uiManager.showSuccess(message);
}

// Export functions for use in other files
globalThis.initializeVueApps = initializeVueApps;
globalThis.debugLog = debugLog;
globalThis.login = login;
globalThis.logout = logout;
globalThis.confirmLogout = confirmLogout;
globalThis.confirmSaveChangesAndExitEditMode = confirmSaveChangesAndExitEditMode;
globalThis.confirmExitEditModeWithoutSaving = confirmExitEditModeWithoutSaving;
globalThis.readme = readme;
globalThis.selectCard = selectCard;
globalThis.updateCard = updateCard;
globalThis.showError = showError;
globalThis.showSuccess = showSuccess;
globalThis.requestPublicListWithRetry = requestPublicListWithRetry;