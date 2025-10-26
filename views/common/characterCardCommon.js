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
    debugLog('Initializing Vue applications', 'info');
    try {
        // Set title based on card type
        TITLE = isPublic ? "HKTRPG 公開角色卡" : "HKTRPG 私人角色卡";
        
        // Only load UI template if not already loaded (skipUITemplateLoad = true means UI is already loaded)
        if (!skipUITemplateLoad) {
            $("#array-rendering").load("/common/characterCardUI.html", function() {
                debugLog('UI template loaded, initializing Vue apps', 'info');
                initializeVueAppsInternal(isPublic);
            });
        } else {
            debugLog('UI template already loaded, initializing Vue apps directly', 'info');
            initializeVueAppsInternal(isPublic);
        }
    } catch (error) {
        debugLog(`Error initializing Vue apps: ${error.message}`, 'error');
    }
}

function initializeVueAppsInternal(isPublic = false) {
    try {
        // Initialize main card app
        card = Vue.createApp({
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
                        deleteMode: false,
                        editMode: false,
                        isPublic: isPublic
                    }
                },
                mounted() {
                    // Initialize character details if empty - no default data
                    // characterDetails will be populated from server data
                    
                    // Set the correct radio button based on saved selectedGroupId
                    if (this.selectedGroupId && this.selectedGroupId !== "") {
                        debugLog(`Loading saved group ID: ${this.selectedGroupId}`, 'info');
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
                    toggleDeleteMode() {
                        this.deleteMode = !this.deleteMode;
                    },
                    
                    toggleEditMode() {
                        this.editMode = !this.editMode;
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
                        const userPassword = simpleDecrypt(localStorage.getItem("userPassword"));
                        
                        if (!userName || !userPassword) {
                            debugLog('User not logged in, cannot remove channel', 'error');
                            return;
                        }

                        socket.emit('removeChannel', {
                            userName: userName,
                            userPassword: userPassword,
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
                                userPassword: simpleDecrypt(localStorage.getItem("userPassword")),
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
                                userPassword: simpleDecrypt(localStorage.getItem("userPassword")),
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
                    }
                }
            }).mount('#array-rendering');

            debugLog('Main card Vue app initialized successfully', 'info');

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
    const userPassword = simpleDecrypt(localStorage.getItem("userPassword"));

    if (!userName || !userPassword) {
        debugLog('User not logged in, cannot update card', 'error');
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
        userPassword: userPassword,
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