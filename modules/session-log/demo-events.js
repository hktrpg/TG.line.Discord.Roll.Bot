'use strict';

const { buildEventsForDemo } = require('./demo-scripts/index.js');

function buildDemoEvents(meta) {
    const events = buildEventsForDemo(meta.id);
    if (events.length > 0) {
        return events;
    }
    return [
        { type: 'scene', title: meta.subtitle || meta.title },
        { type: 'narration', text: '這是示範團錄。登入後可匯入你自己的 Discord 聊天紀錄。' },
        { type: 'say', name: 'KP', text: '歡迎來到 HKTRPG 團錄閱讀器。' },
    ];
}

module.exports = {
    buildDemoEvents,
};
