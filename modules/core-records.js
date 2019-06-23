const { EventEmitter } = require("events");

let instance;
let data = [];
let MAX = 50;

class Records extends EventEmitter {
    constructor() {
        super();
    }

    push(msg) {
        data.push(msg);

        if (data.length > MAX) {
            data.splice(0, 1);
        }

        this.emit("new_message", msg);
    }

    get() {
        return data;
    }

    setMax(max) {
        MAX = max;
    }

    getMax() {
        return MAX;
    }
}

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }

    return instance;
})();
