// Common JavaScript code for character card pages
const TITLE = "HKTRPG 角色卡";

// Debug logging
function debugLog(message, type = 'info') {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
}

// Socket.io Setup
let socket = io();

// Vue Applications
let card = null;
let cardList = null;

function initializeVueApps() {
    debugLog('Initializing Vue applications', 'info');
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
                    gpList: "",
                    public: false,
                    deleteMode: false
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
                    }
                },
                removeLastItem(form) {
                    switch (form) {
                        case 0:
                            if (this.state.length > 0) {
                                this.state.pop();
                            }
                            break;
                        case 1:
                            if (this.roll.length > 0) {
                                this.roll.pop();
                            }
                            break;
                        case 2:
                            if (this.notes.length > 0) {
                                this.notes.pop();
                            }
                            break;
                    }
                },
                toggleDeleteMode(form) {
                    this.deleteMode = !this.deleteMode;
                },
                removeItem(index, form) {
                    switch (form) {
                        case 0:
                            this.state.splice(index, 1);
                            break;
                        case 1:
                            this.roll.splice(index, 1);
                            break;
                        case 2:
                            this.notes.splice(index, 1);
                            break;
                        default:
                            break;
                    }
                },
                config() {
                    for (let gp of this.gpList) {
                        gp.showDeleteButton = !gp.showDeleteButton;
                        gp.confirmDelete = false;
                        gp.showCancelButton = (gp.showDeleteButton && gp.confirmDelete)
                    }
                },
                cancelButton(gp) {
                    gp.confirmDelete = false;
                    gp.showCancelButton = false;
                },
                confirmRemoveChannel(gp) {
                    if (gp.confirmDelete) {
                        this.removeChannel(gp);
                    } else {
                        gp.confirmDelete = true;
                        gp.showCancelButton = true;
                    }
                },
                removeChannel(gp) {
                    socket.emit('removeChannel', {
                        botname: gp.botname,
                        userName: userName,
                        userPassword: userPassword,
                        channelId: gp.id
                    });
                    location.reload();
                },
                rolling(item) {
                    let obj = '';
                    if (document.querySelector('input[name="gpListRadio"]:checked')) {
                        let temp = document.querySelector('input[name="gpListRadio"]:checked').value;
                        obj = card.gpList.find(function (item, index, array) {
                            return item._id == temp;
                        });
                    }
                    socket.emit('rolling', {
                        item: item,
                        userName: userName,
                        userPassword: userPassword,
                        rollTarget: obj,
                        doc: {
                            state: card.state,
                            roll: card.roll,
                            notes: card.notes
                        },
                        cardName: card.name
                    });
                }
            }
        }).mount('#array-rendering');

        // Initialize card list app only if the element exists
        const cardListElement = document.getElementById('array-cardList');
        if (cardListElement) {
            cardList = Vue.createApp({
                data() {
                    return {
                        list: []
                    }
                },
                methods: {
                    getTheSelectedOne(number) {
                        if (!card) {
                            debugLog('Card Vue app not initialized', 'error');
                            return;
                        }
                        card._id = this.list[number]._id;
                        card.id = this.list[number].id;
                        card.name = this.list[number].name;
                        card.notes = this.list[number].notes;
                        card.roll = this.list[number].roll;
                        card.state = this.list[number].state;
                        card.public = this.list[number].public;
                        $('#cardListModal').modal("hide");
                    }
                }
            }).mount('#array-cardList');
            debugLog('CardList Vue app initialized successfully', 'info');
        } else {
            debugLog('CardList element not found, skipping initialization', 'warn');
        }

        debugLog('Vue applications initialized successfully', 'info');
    } catch (error) {
        debugLog(`Error initializing Vue applications: ${error.message}`, 'error');
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
    if (result) {
        $('#warning-update').show();
        setTimeout(() => $('#warning-update').hide(), 5000);
    }
    if (!result) {
        $('#warning-updateError').show();
        setTimeout(() => $('#warning-updateError').hide(), 5000);
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
                margin: "0 auto"
            })
            .appendTo($("body"));
    }

    type = type || "info";
    let alert = $('<div>')
        .addClass("alert text-wrap text-break warning alert-dismissible fade show overlay alert-" + type)
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
    if (result) {
        debugLog(`Rolling result: ${result}`, 'info');
        addElement("<strong>" + result + "</strong>", "warning", 4000);
    }
});

socket.on("updateCard", function (result) {
    debugLog(`Update card result: ${result}`, 'info');
    popup(result);
});

// Export functions for use in other files
window.initializeVueApps = initializeVueApps;
window.debugLog = debugLog; 