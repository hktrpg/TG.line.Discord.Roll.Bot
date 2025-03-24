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
                        public: isPublic,
                        deleteMode: false,
                        isPublic: isPublic
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
                    removeItem(form) {
                        switch (form) {
                            case 0:
                                this.state.pop();
                                break;
                            case 1:
                                this.roll.pop();
                                break;
                            case 2:
                                this.notes.pop();
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
                    rolling(name) {
                        debugLog(`Rolling for ${name}`, 'info');
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
            const cardListElement = document.getElementById('array-cardList');
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
        });
    } catch (error) {
        debugLog(`Error initializing Vue apps: ${error.message}`, 'error');
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
    if ($cont.length == 0) {
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
        window.setTimeout(() => alert.alert("close"), closeDelay);
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
window.initializeVueApps = initializeVueApps;
window.debugLog = debugLog; 