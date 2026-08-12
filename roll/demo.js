"use strict";

/**
 * Demo roll module — teaching reference for i18n call styles.
 *
 * Preferred (new code):
 *   loc('demo.hi')
 *   loc('demo.greet', { name })
 *   ok ? loc('rollbase.bool_true') : loc('rollbase.bool_false')
 *
 * Still supported:
 *   getT({ locale, t })('demo.hi')   // legacy; ALS also fills getT({})
 *   resolveHelp / resolveGameName
 *
 * Optional local helper (long modules only):
 *   const d = ns('demo'); d('hi')
 *
 * Try: .demo help | .demo hi | .demo greet Ada | .demo check 50
 *      .demo ns | .demo legacy | .demo locale | .demo 123
 */

const {
    loc,
    getT,
    getLocale,
    resolveHelp,
    resolveGameName
} = require('../modules/i18n/roll-i18n.js');

const variables = {};

/** Optional namespace helper — same idea as a local `t` bound to demo.* */
function ns(prefix) {
    return (key, data) => loc(`${prefix}.${key}`, data);
}

const gameName = function (params = {}) {
    return resolveGameName(params, 'demo.game_name', '【Demo】');
};

const gameType = function () {
    return 'Demo:Demo:hktrpg';
};

const prefixs = function () {
    // Allow "Demo …" and ".demo …" (analytics smoke tests use .demo)
    return [{
        first: /^[.]?demo$/i,
        second: null
    }];
};

const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'demo.help');
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
    membercount,
    locale,
    t
}) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const sub = mainMsg[1] || '';

    switch (true) {
        // --- help: resolveHelp (ALS fills locale when params omit it) ---
        case /^help$/i.test(sub) || !sub: {
            rply.text = getHelpMessage({ locale, t });
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

        // --- 3) industry-style ternary success / fail ---
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

        // --- 4) ns('demo') short keys inside one module ---
        case /^ns$/i.test(sub): {
            const d = ns('demo');
            rply.text = [
                d('ns_title'),
                d('ns_line', { style: 'ns(\'demo\')' }),
                d('hi')
            ].join('\n');
            return rply;
        }

        // --- 5) legacy getT (still OK; prefer loc for new code) ---
        case /^legacy$/i.test(sub): {
            const translate = getT({ locale, t });
            rply.text = translate('demo.legacy_line', {
                via: 'getT({ locale, t })'
            });
            return rply;
        }

        // --- 6) read request locale from ALS / params ---
        case /^locale$/i.test(sub): {
            rply.text = loc('demo.locale_line', {
                locale: getLocale({ locale })
            });
            return rply;
        }

        // --- 7) keep original debug dump (interpolation) ---
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

        // --- unknown subcommand ---
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
    // exported for unit tests / docs examples
    ns
};
