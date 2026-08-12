"use strict";

/**
 * Demo roll module — teaching reference for i18n WITHOUT { locale, t }.
 *
 * analytics.parseInput wraps runWithLocale, so roll code only needs:
 *   loc('demo.hi')
 *   loc('demo.greet', { name })
 *   ok ? loc('rollbase.bool_true') : loc('rollbase.bool_false')
 *   resolveHelp({}, 'demo.help')
 *   getLocale()
 *
 * Do NOT write: getT({ locale, t }) or pass locale/t through handlers.
 *
 * Try: .demo help | .demo hi | .demo greet Ada | .demo check 50
 *      .demo ns | .demo gett | .demo locale | .demo 123
 */

const {
    loc,
    getT,
    getLocale,
    resolveHelp,
    resolveGameName
} = require('../modules/i18n/roll-i18n.js');

const variables = {};

/** Optional namespace helper — short keys within one module */
function ns(prefix) {
    return (key, data) => loc(`${prefix}.${key}`, data);
}

const gameName = function (params = {}) {
    // params optional; under ALS, resolveGameName({}) is enough
    return resolveGameName(params, 'demo.game_name', '【Demo】');
};

const gameType = function () {
    return 'Demo:Demo:hktrpg';
};

const prefixs = function () {
    return [{
        first: /^[.]?demo$/i,
        second: null
    }];
};

const getHelpMessage = function () {
    // No { locale, t } — request locale comes from ALS
    return resolveHelp({}, 'demo.help');
};

const initialize = function () {
    return variables;
};

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const sub = mainMsg[1] || '';

    switch (true) {
        // --- help: resolveHelp with empty params (ALS) ---
        case /^help$/i.test(sub) || !sub: {
            rply.text = getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        // --- 1) loc: plain string ---
        case /^hi$/i.test(sub): {
            rply.text = loc('demo.hi');
            return rply;
        }

        // --- 2) loc: interpolation ---
        case /^greet$/i.test(sub): {
            const name = mainMsg[2] || loc('demo.unnamed');
            rply.text = loc('demo.greet', { name });
            return rply;
        }

        // --- 3) ternary success / fail (industry style) ---
        case /^check$/i.test(sub): {
            const target = Number.parseInt(mainMsg[2], 10);
            if (!Number.isFinite(target) || target < 1 || target > 100) {
                rply.text = loc('demo.check_usage');
                return rply;
            }
            const roll = 1 + Math.floor(Math.random() * 100);
            const ok = roll > target;
            const result = ok
                ? loc('rollbase.bool_true')
                : loc('rollbase.bool_false');
            rply.text = loc('demo.check_line', {
                roll,
                target,
                result
            });
            return rply;
        }

        // --- 4) ns('demo') short keys ---
        case /^ns$/i.test(sub): {
            const d = ns('demo');
            rply.text = [
                d('ns_title'),
                d('ns_line', { style: 'ns(\'demo\')' }),
                d('hi')
            ].join('\n');
            return rply;
        }

        // --- 5) getT() with no args (ALS) — not getT({ locale, t }) ---
        case /^gett$/i.test(sub): {
            const translate = getT();
            rply.text = translate('demo.gett_line', {
                via: 'getT()'
            });
            return rply;
        }

        // --- 6) request locale from ALS ---
        case /^locale$/i.test(sub): {
            rply.text = loc('demo.locale_line', {
                locale: getLocale()
            });
            return rply;
        }

        // --- 7) debug dump ---
        case /^\d+$/i.test(sub): {
            rply.text = loc('demo.output_debug', {
                value: sub,
                inputStr,
                groupid,
                userid,
                userrole,
                botname,
                displayname,
                channelid,
                displaynameDiscord,
                membercount
            });
            return rply;
        }

        case /^\S/.test(sub): {
            rply.text = loc('demo.unknown', { command: sub });
            return rply;
        }

        default: {
            break;
        }
    }

    return rply;
};

const discordCommand = [];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand,
    ns
};
