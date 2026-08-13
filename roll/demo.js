"use strict";

/**
 * Demo roll module — i18n WITHOUT { locale, t } + HKTRPG reply / syntax showcase.
 *
 * i18n (ALS from analytics.parseInput):
 *   loc('demo.hi') | resolveHelp({}) | getLocale() | getT()
 *
 * Bot-specific rply / user syntax (see .demo help):
 *   quotes, buttonCreate, requestRolling, requestRollingCharacter,
 *   characterReRoll*, LevelUp, cmd, [[inline]], {VAR}, dr/ddr/dddr, .at/.cron
 */

const {
    loc,
    getT,
    getLocale,
    resolveHelp,
    resolveGameName
} = require('../modules/i18n/roll-i18n.js');
const rollbase = require('./rollbase.js');

const variables = {};

function ns(prefix) {
    return (key, data) => loc(`${prefix}.${key}`, data);
}

/** Lightweight [[NdM]] expander for demo only (not full getRoll.rollText). */
function expandSimpleInline(text) {
    return String(text).replaceAll(/\[\[(\d+)d(\d+)\]\]/gi, (match, countStr, sidesStr) => {
        const count = Number.parseInt(countStr, 10);
        const sides = Number.parseInt(sidesStr, 10);
        if (!Number.isFinite(count) || !Number.isFinite(sides) || count < 1 || count > 20) {
            return match;
        }
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += rollbase.Dice(sides);
        }
        return String(total);
    });
}

/** Fake {VAR} replace like character cards (demo map only). */
function expandDemoVars(text, vars) {
    return String(text).replaceAll(/\{([^{}]+)\}/g, (match, key) => {
        const k = String(key).trim();
        return Object.hasOwn(vars, k) ? String(vars[k]) : match;
    });
}

const gameName = function (params = {}) {
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
    const who = displaynameDiscord || displayname || loc('demo.unnamed');

    switch (true) {
        case /^help$/i.test(sub) || !sub: {
            rply.text = getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        // ===== i18n styles =====
        case /^hi$/i.test(sub): {
            rply.text = loc('demo.hi');
            return rply;
        }
        case /^greet$/i.test(sub): {
            const name = mainMsg[2] || loc('demo.unnamed');
            rply.text = loc('demo.greet', { name });
            return rply;
        }
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
            rply.text = loc('demo.check_line', { roll, target, result });
            return rply;
        }
        case /^ns$/i.test(sub): {
            const d = ns('demo');
            rply.text = [
                d('ns_title'),
                d('ns_line', { style: 'ns(\'demo\')' }),
                d('hi')
            ].join('\n');
            return rply;
        }
        case /^gett$/i.test(sub): {
            const translate = getT();
            rply.text = translate('demo.gett_line', { via: 'getT()' });
            return rply;
        }
        case /^locale$/i.test(sub): {
            rply.text = loc('demo.locale_line', { locale: getLocale() });
            return rply;
        }

        // ===== Bot syntax / rply fields =====

        // Discord embed-style quote
        case /^quotes$/i.test(sub): {
            rply.text = loc('demo.quotes_body');
            rply.quotes = true;
            return rply;
        }

        // Discord quick-command buttons (bothelp style)
        case /^buttons$/i.test(sub): {
            rply.text = loc('demo.buttons_body');
            rply.quotes = true;
            rply.buttonCreate = [
                '.demo hi',
                '.demo check 50',
                '.demo re',
                '1d100',
                '2d6+1'
            ];
            return rply;
        }

        // .re style click-to-roll options
        case /^re$/i.test(sub): {
            rply.text = loc('demo.re_body');
            rply.requestRolling = [
                '1d100 哈哈',
                '1d3 SC成功',
                '1d10 SC失敗',
                '簽到'
            ];
            return rply;
        }

        // .ch button / .char button payload
        case /^chbutton$/i.test(sub): {
            rply.text = loc('demo.chbutton_body');
            rply.requestRollingCharacter = [
                ['.ch 鬥毆', '.ch 射擊', '.ch SanCheck'],
                'DemoPC',
                'ch'
            ];
            return rply;
        }

        // [[NdM]] inline (schedule / .me / cron fire path)
        case /^inline$/i.test(sub): {
            const template = mainMsg[2]
                ? mainMsg.slice(2).join(' ')
                : loc('demo.inline_default');
            const expanded = expandSimpleInline(template);
            rply.text = loc('demo.inline_result', {
                before: template,
                after: expanded
            });
            rply.quotes = true;
            return rply;
        }

        // Character card {VAR} substitution
        case /^var$/i.test(sub): {
            const vars = { San: 80, HP: 12, 力量: 50 };
            const formula = mainMsg[2]
                ? mainMsg.slice(2).join(' ')
                : loc('demo.var_default');
            const expanded = expandDemoVars(formula, vars);
            rply.text = loc('demo.var_result', {
                before: formula,
                after: expanded,
                vars: 'San=80 HP=12 力量=50'
            });
            rply.quotes = true;
            return rply;
        }

        // Live characterReRoll nest (like .ch SanCheck → 1d100)
        case /^ch$/i.test(sub): {
            rply.text = loc('demo.ch_header', { name: 'DemoPC' });
            rply.characterName = 'DemoPC';
            rply.characterReRollName = 'SanCheck';
            rply.characterReRollItem = '1d100';
            rply.characterReRoll = true;
            return rply;
        }

        // Angle-bracket dice in .ch formulas: <1d6+力量>
        case /^angle$/i.test(sub): {
            rply.text = loc('demo.angle_body');
            rply.quotes = true;
            return rply;
        }

        // Dark / private rolls (platform-level; document only)
        case /^dark$/i.test(sub): {
            rply.text = loc('demo.dark_body');
            rply.quotes = true;
            return rply;
        }

        // Level-up append string (platforms concatenate LevelUp)
        case /^levelup$/i.test(sub): {
            rply.text = loc('demo.levelup_main');
            rply.LevelUp = loc('demo.levelup_sample', {
                name: who,
                level: 5
            });
            return rply;
        }

        // .cmd nest: analytics re-parses rply.text when cmd:true
        case /^cmd$/i.test(sub): {
            const nested = mainMsg[2] || '2d6';
            rply.text = nested;
            rply.cmd = true;
            return rply;
        }

        // .at / .cron + [[]] (document + fake fire)
        case /^schedule$/i.test(sub): {
            const fired = expandSimpleInline(loc('demo.schedule_fire_template'));
            rply.text = loc('demo.schedule_body', { fired });
            rply.quotes = true;
            return rply;
        }

        // db / ra token markers (document)
        case /^tokens$/i.test(sub): {
            rply.text = loc('demo.tokens_body');
            rply.quotes = true;
            return rply;
        }

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
    ns,
    expandSimpleInline,
    expandDemoVars
};
