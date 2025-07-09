// Common JavaScript code for character card pages
let TITLE = "HKTRPG 角色卡";

// Debug logging
function debugLog(message, type = 'info') {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
}

// Socket.io Setup
let socket = io();

// Vue Applications
let card = null;
let cardList = null;

function initializeVueApps(isPublic = false) {
    debugLog('Initializing Vue applications', 'info');
    try {
        // Set title based on card type
        TITLE = isPublic ? "HKTRPG 公開角色卡" : "HKTRPG 私人角色卡";
        
        // Load common UI template
        $("#array-rendering").load("/common/characterCardUI.html", function() {
            debugLog('UI template loaded, initializing Vue apps', 'info');
            
            // Initialize main card app
            card = Vue.createApp({
                data() {
                    return {
                        id: "",
                        name: "",
                        state: [],
                        roll: [],
                        notes: [],
                        gpList: [],
                        selectedGroupId: localStorage.getItem("selectedGroupId") || null,
                        public: isPublic,
                        deleteMode: false,
                        isPublic: isPublic
                    }
                },
                mounted() {
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
                    removeChannel(channelId) {
                        this.gpList = this.gpList.filter(channel => channel.id !== channelId);
                    },
                    config() {
                        debugLog('Configuring group list', 'info');
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
                            channel.confirmDelete = true;
                        } else {
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
                                userPassword: localStorage.getItem("userPassword"),
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
                                userPassword: localStorage.getItem("userPassword"),
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
        });
    } catch (error) {
        debugLog(`Error initializing Vue apps: ${error.message}`, 'error');
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
            const userPassword = localStorage.getItem("userPassword");
            
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
    localStorage.setItem('userPassword', userPassword);

    if (userName && userName.length >= 4 && userPassword && userPassword.length >= 6) {
        socket.emit('getListInfo', {
            userName: userName,
            userPassword: userPassword
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
        addElement("<strong>更新成功!</strong> 你可以在聊天平台上使用新資料了。", "success", 5000);
        debugLog('Success alert shown', 'info');
    } else {
        addElement("<strong>更新失敗!</strong> 請檢查或向HKTRPG回報。", "danger", 5000);
        debugLog('Error alert shown', 'info');
    }
}

function addElement(message, type, closeDelay) {
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
        .append($('<button type="button" class="close" data-dismiss="alert">').append("&times;"))
        .append(message);

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
        addElement("<strong>" + result + "</strong>", "warning", 4000);
    } else {
        addElement("<strong>擲骰失敗!</strong> 請檢查或向HKTRPG回報。", "danger", 4000);
        debugLog('Rolling failed', 'error');
    }
});

socket.on("publicRolling", function (result) {
    debugLog(`Received public rolling result: ${result}`, 'info');
    if (result) {
        addElement("<strong>" + result + "</strong>", "warning", 4000);
    } else {
        addElement("<strong>擲骰失敗!</strong> 請檢查或向HKTRPG回報。", "danger", 4000);
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

// Export functions for use in other files
globalThis.initializeVueApps = initializeVueApps;
globalThis.debugLog = debugLog;
globalThis.login = login;
globalThis.logout = logout;
globalThis.readme = readme;
globalThis.selectCard = selectCard; 