//event.js 檔案
var events = require('events');
var emitter = new events.EventEmitter();

module.exports = {
    emitter: emitter
};