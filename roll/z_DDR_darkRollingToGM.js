"use strict";
const DB_READY = !!process.env.mongoURL;
const { SlashCommandBuilder } = require('discord.js');
const records = require('../modules/records.js');
const checkTools = require('../modules/check.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');

// When DB is not available: disable the whole feature cleanly
if (!DB_READY) {
    const gameName = function (params = {}) {
        return resolveGameName(params, 'ddr.game_name', '【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr');
    };
    const gameType = function () {
        return 'Tool:trpgDarkRolling:hktrpg';
    };
    const prefixs = function () {
        return [];
    };
    const getHelpMessage = async function (params = {}) {
        return getT(params)('ddr.no_database');
    };
    const initialize = function () {
        return {};
    };
    const rollDiceCommand = async function (params = {}) {
        return {
            default: 'on',
            type: 'text',
            text: getT(params)('ddr.no_database')
        };
    };
    const discordCommand = [];

    module.exports = {
        rollDiceCommand,
        initialize,
        getHelpMessage,
        prefixs,
        gameType,
        gameName,
        discordCommand
    };
} else {
const trpgDarkRollingfunction = {};

// Initialize data asynchronously
(async () => {
    try {
        trpgDarkRollingfunction.trpgDarkRollingfunction = await records.get('trpgDarkRolling');
    } catch (error) {
        console.error('[z_DDR_darkRollingToGM] Failed to initialize trpgDarkRolling data:', error);
        trpgDarkRollingfunction.trpgDarkRollingfunction = [];
    }
})();
const gameName = function (params = {}) {
    return resolveGameName(params, 'ddr.game_name', '【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr');
}
const gameType = function () {
    return 'Tool:trpgDarkRolling:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]drgm$)/ig,
        second: null
    }]
}
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'ddr.help', () => getT({ locale: 'zh-tw' })('ddr.help'));
}
const initialize = function () {
    return trpgDarkRollingfunction;
}

const rollDiceCommand = async function ({ mainMsg, groupid, userid, userrole, botname, displayname, channelid, locale, t }) {
    const translate = getT({ locale, t });
    let checkifsamename = 0;
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            if (botname == "Line")
                rply.text += translate('ddr.line_friend_hint');
            return rply;
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^addgm$/i.test(mainMsg[1]): {
            //
            //增加自定義關鍵字
            // .drgm[0] addgm[1] 代替名字[2]  
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            checkifsamename = 0
            if (channelid)
                groupid = channelid
            //因為在DISCROD以頻道作單位
            if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                    if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                        for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                            if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid == userid) {
                                checkifsamename = 1
                            }
                        }
                    }
                }
            let temp = {
                groupid: groupid,
                trpgDarkRollingfunction: [{
                    userid: userid,
                    diyName: mainMsg[2] || "",
                    displayname: displayname
                }]
                //|| displayname

            }
            if (checkifsamename == 0) {
                try {
                    await records.pushTrpgDarkRollingFunction('trpgDarkRolling', temp);
                    trpgDarkRollingfunction.trpgDarkRollingfunction = await records.get('trpgDarkRolling');
                    rply.text = translate('ddr.add_success', { name: mainMsg[2] || displayname || '' });
                } catch (error) {
                    console.error('[z_DDR_darkRollingToGM] Failed to push dark rolling function:', error);
                    rply.text = translate('ddr.add_failed');
                }
            } else rply.text = translate('ddr.add_duplicate');
            return rply;
        } case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]): {
            //    
            //刪除所有自定義關鍵字
            //
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            if (channelid)
                groupid = channelid
            if (!mainMsg[2]) return;
            let matched = false;
            for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                    matched = true;
                    let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                    temp.trpgDarkRollingfunction = []
                    try {
                        await records.setTrpgDarkRollingFunction('trpgDarkRolling', temp);
                        trpgDarkRollingfunction.trpgDarkRollingfunction = await records.get('trpgDarkRolling');
                        rply.text = translate('ddr.del_all_success');
                    } catch (error) {
                        console.error('[z_DDR_darkRollingToGM] Failed to delete all dark rolling functions:', error);
                        rply.text = translate('ddr.del_failed');
                    }
                }
            }
            if (!matched) {
                rply.text = translate('ddr.del_no_gm');
            }
            return rply;
        }
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]): {
            //
            //刪除GM
            //
            if (!mainMsg[2]) rply.text += translate('ddr.del_no_gm');
            const permissionError = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            rply.text += permissionError;
            if (permissionError) {
                return rply;
            }
            if (channelid)
                groupid = channelid
            let deleted = false;
            for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                    if (mainMsg[2] < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length && mainMsg[2] >= 0) {
                        let temp = trpgDarkRollingfunction.trpgDarkRollingfunction[i]
                        temp.trpgDarkRollingfunction.splice(mainMsg[2], 1)
                        try {
                            await records.setTrpgDarkRollingFunction('trpgDarkRolling', temp);
                            trpgDarkRollingfunction.trpgDarkRollingfunction = await records.get('trpgDarkRolling');
                        deleted = true;
                        } catch (error) {
                            console.error('[z_DDR_darkRollingToGM] Failed to delete dark rolling function:', error);
                        }
                    }
                }
            }
            rply.text = deleted ? translate('ddr.del_success', { index: mainMsg[2] }) : translate('ddr.del_no_index');

            return rply;
        }
        case /(^[.]drgm$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            if (channelid)
                groupid = channelid
            try {
                trpgDarkRollingfunction.trpgDarkRollingfunction = await records.get('trpgDarkRolling');
            } catch (error) {
                console.error('[z_DDR_darkRollingToGM] Failed to get dark rolling data:', error);
                trpgDarkRollingfunction.trpgDarkRollingfunction = [];
            }
            if (groupid) {
                let temp = 0;
                if (trpgDarkRollingfunction.trpgDarkRollingfunction)
                    for (let i = 0; i < trpgDarkRollingfunction.trpgDarkRollingfunction.length; i++) {
                        if (trpgDarkRollingfunction.trpgDarkRollingfunction[i].groupid == groupid) {
                            rply.text += translate('ddr.show_header');
                            for (let a = 0; a < trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
                                temp = 1
                                rply.text += translate('ddr.show_entry', {
                                    index: a,
                                    name: trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName || trpgDarkRollingfunction.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname
                                });
                            }
                        }
                    }
                if (temp == 0) rply.text = translate('ddr.no_gm');
            } else {
                rply.text = translate('ddr.not_in_group');
            }
            //顯示GM
            rply.text = rply.text.replaceAll(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replaceAll(/,/gm, ', ')
            return rply
        default:
            break;
    }
}

const discordCommand = [{
    data: new SlashCommandBuilder()
        .setName('drgm')
        .setDescription('暗骰GM功能')
        .addSubcommand(subcommand =>
            subcommand
                .setName('addgm')
                .setDescription('註冊成為GM')
                .addStringOption(option =>
                    option.setName('nickname')
                        .setDescription('GM的代稱(選填)')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('顯示目前GM列表')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('del')
                .setDescription('刪除GM')
                .addStringOption(option =>
                    option.setName('target')
                        .setDescription('要刪除的GM編號,輸入all則清空所有')
                        .setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const nickname = interaction.options.getString('nickname');
        const target = interaction.options.getString('target');

        switch (subcommand) {
            case 'addgm':
                return `.drgm addgm ${nickname || ''}`;
            case 'show':
                return `.drgm show`;
            case 'del':
                return `.drgm del ${target}`;
            default:
                return `.drgm help`;
        }
    }
}, {
    data: new SlashCommandBuilder()
        .setName('dr')
        .setDescription('暗骰-結果只傳送給自己')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('要執行的指令，如 cc 80 鬥毆')
                .setRequired(true)),
    async execute(interaction) {
        const command = interaction.options.getString('command');
        return `dr ${command}`;
    }
}, {
    data: new SlashCommandBuilder()
        .setName('ddr')
        .setDescription('暗骰-結果傳送給GM和自己')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('要執行的指令，如 cc 80 鬥毆')
                .setRequired(true)),
    async execute(interaction) {
        const command = interaction.options.getString('command');
        return `ddr ${command}`;
    }
}, {
    data: new SlashCommandBuilder()
        .setName('dddr')
        .setDescription('暗骰-結果只傳送給GM')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('要執行的指令，如 cc 80 鬥毆')
                .setRequired(true)),
    async execute(interaction) {
        const command = interaction.options.getString('command');
        return `dddr ${command}`;
    }
}];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand
};
}