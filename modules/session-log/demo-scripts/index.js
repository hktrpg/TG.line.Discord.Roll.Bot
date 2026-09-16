'use strict';

const { parseDemoScript, eventsCharCount } = require('../demo-script-parser.js');

const demo09 = require('./demo-09.js');
const demo05 = require('./demo-05.js');
const demo01 = require('./demo-01.js');
const demo08 = require('./demo-08.js');
const demo02 = require('./demo-02.js');
const demo06 = require('./demo-06.js');
const demo03 = require('./demo-03.js');
const demo07 = require('./demo-07.js');
const demo04 = require('./demo-04.js');
const demo10 = require('./demo-10.js');

const SCRIPTS = {
    'demo-01': demo01.SCRIPT,
    'demo-02': demo02.SCRIPT,
    'demo-03': demo03.SCRIPT,
    'demo-04': demo04.SCRIPT,
    'demo-05': demo05.SCRIPT,
    'demo-06': demo06.SCRIPT,
    'demo-07': demo07.SCRIPT,
    'demo-08': demo08.SCRIPT,
    'demo-09': demo09.SCRIPT,
    'demo-10': demo10.SCRIPT,
};

function getDemoScript(id) {
    return SCRIPTS[id] || '';
}

function buildEventsForDemo(id) {
    const script = getDemoScript(id);
    if (!script) {
        return [];
    }
    return parseDemoScript(script);
}

function getDemoStats(id) {
    const events = buildEventsForDemo(id);
    return {
        messageCount: events.length,
        charCount: eventsCharCount(events),
    };
}

module.exports = {
    getDemoScript,
    buildEventsForDemo,
    getDemoStats,
    SCRIPTS,
};
