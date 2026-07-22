"use strict";

const { SlashCommandBuilder } = require('discord.js');
const i18n = require('../modules/i18n.js');
const { resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');

const gameName = function (params = {}) {
    return resolveGameName(params, 'lang.game_name', '【語言 Language】');
};

const gameType = function () {
    return 'Tool:lang:hktrpg';
};

const prefixs = function () {
    return [{
        first: /^\.lang$/i,
        second: null
    }];
};

const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'lang.help');
};

const initialize = function () {
    return {};
};

function isDmContext(params) {
    const channel = params.discordMessage?.channel;
    if (channel?.type === 1) {
        return true;
    }
    return !params.groupid;
}

async function handleLangCommand(params) {
    const t = params.t || i18n.createTranslator(params.locale || i18n.DEFAULT_LOCALE);
    const locale = params.locale || i18n.DEFAULT_LOCALE;
    const mainMsg = params.mainMsg || [];
    const action = (mainMsg[1] || '').toLowerCase();

    const rply = {
        default: 'on',
        type: 'text',
        text: '',
        quotes: true
    };

    if (!action || action === 'show') {
        rply.text = t('lang.current', { locale });
        return rply;
    }

    if (action === 'list') {
        rply.text = `${t('lang.list_header')}\n${i18n.formatLocaleList()}`;
        return rply;
    }

    if (action === 'help') {
        rply.text = getHelpMessage({ locale, t });
        return rply;
    }

    const targetLocale = i18n.matchLocale(action);
    if (!targetLocale) {
        rply.text = t('lang.unsupported', { locales: i18n.formatLocaleList() });
        return rply;
    }

    const isDm = isDmContext(params);
    if (!isDm && (params.userrole || 1) < 3) {
        rply.text = t('lang.set_denied');
        return rply;
    }

    const scope = isDm ? 'user' : 'group';
    const scopeId = isDm ? params.userid : params.groupid;
    const result = await i18n.setLocale({ scope, scopeId, locale: targetLocale });

    if (!result.ok) {
        if (result.reason === 'no_database') {
            rply.text = t('lang.no_database');
        } else if (result.reason === 'unsupported_locale') {
            rply.text = t('lang.unsupported', { locales: i18n.formatLocaleList() });
        } else {
            rply.text = t('common.errors.command_error');
        }
        return rply;
    }

    rply.text = isDm
        ? t('lang.set_success_user', { locale: targetLocale })
        : t('lang.set_success_guild', { locale: targetLocale });
    return rply;
}

const rollDiceCommand = async function (params) {
    switch (true) {
        case /^help$/i.test(params.mainMsg?.[1]) || !params.mainMsg?.[1]: {
            const rply = {
                default: 'on',
                type: 'text',
                text: getHelpMessage({ locale: params.locale, t: params.t }),
                quotes: true
            };
            return rply;
        }
        default: {
            return handleLangCommand(params);
        }
    }
};

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('lang')
            .setDescription('語言設定 / Language settings')
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('選擇語言（不填則顯示目前設定）/ Choose language')
                    .setRequired(false)
                    .addChoices(
                        ...i18n.getSlashLocaleChoices(),
                        { name: '顯示目前語言 / Show current', value: 'show' },
                        { name: '列出支援語言 / List languages', value: 'list' }
                    )),
        async execute(interaction) {
            const language = interaction.options.getString('language') || 'show';
            return `.lang ${language}`;
        }
    }
];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};
