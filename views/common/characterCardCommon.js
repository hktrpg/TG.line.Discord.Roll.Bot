// Common JavaScript code for character card pages - 重構版本
// 使用模組化架構，依賴 cardManager, authManager, uiManager, socketManager

let TITLE = "HKTRPG 角色卡";

// XSS Protection function
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

// Socket.io Setup - 使用 socketManager
let socket = socketManager.getSocket();

// Vue Applications - 使用 cardManager
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
        // 使用 cardManager 初始化角色卡
        cardManager.initializeCard(isPublic, templateContent);
        
        // 獲取實例引用
        card = cardManager.getCard();
        cardList = cardManager.getCardList();

        debugLog('Vue applications initialized successfully', 'info');

        // Set up login form for private cards
        if (!isPublic) {
            authManager.setupLoginForm();
        }
    } catch (error) {
        debugLog(`Error initializing Vue apps internal: ${error.message}`, 'error');
    }
}

// Login function - 使用 authManager
function login() {
    authManager.login();
}

// Logout function - 使用 authManager
function logout() {
    authManager.logout();
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
function popup(result) {
    debugLog(`Showing popup with result: ${result}`, 'info');
    uiManager.showPopup(result);
}

function addElement(message, type, closeDelay, allowHtml = false) {
    uiManager.showAlert(message, type, closeDelay, allowHtml);
}

// Modal Functions
function readme() {
    uiManager.showModal('readmeModalCenter');
}

function selectCard() {
    uiManager.showModal('cardListModal');
}

// Update card function for hybrid UI - 使用 socketManager
function updateCard() {
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
    socketManager.emitUpdateCard(data);
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
globalThis.readme = readme;
globalThis.selectCard = selectCard;
globalThis.updateCard = updateCard;
globalThis.showError = showError;
globalThis.showSuccess = showSuccess;