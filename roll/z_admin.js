"use strict";
let variables = {};
const opt = {
    upsert: true,
    runValidators: true
}
// const salt = process.env.SALT; // No longer needed with new security module
const crypto = require('crypto');
const os = require('node:os');
const v8 = require('node:v8');
const { SlashCommandBuilder } = require('discord.js');
const security = require('../utils/security.js');
// CRYPTO_SECRET is used via security.encryptWithCryptoSecret / decryptWithCryptoSecret
let password = security.getCryptoSecretKey && security.getCryptoSecretKey();
if (!password) {
    console.error('[Admin] ❌ CRYPTO_SECRET environment variable is not set');
}
// 32bit ASCII
const adminSecrets = parseAdminSecrets(process.env.ADMIN_SECRET);
const isAdminUser = (userid) => Boolean(userid) && adminSecrets.includes(userid);
//admin id
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
const pattId = /\s+-i\s+(\S+)/ig;
const pattGP = /\s+-g\s+(\S+)/ig;
const pattLv = /\s+-l\s+(\S+)/ig;
const pattName = /\s+-n\s+(\S+)/ig;
const pattNotes = /\s+-no\s+(\S+)/ig;
const pattSwitch = /\s+-s\s+(\S+)/ig;
const deploy = require('../modules/ds-deploy-commands.js');
const { viplevelCheckUser, viplevelCheckGroup } = require('../modules/veryImportantPerson.js');
const dbProtectionLayer = require('../modules/db-protection-layer.js');
const clusterProtection = require('../modules/cluster-protection.js');
const patreonTiers = require('../modules/patreon-tiers.js');
const patreonSync = require('../modules/patreon-sync.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const scheduleModule = require('../modules/schedule.js');
const SCHEDULE_DOC_KEY = scheduleModule.SCHEDULE_DOC_KEY || 'default';
const AGENDA_TIMEZONE = scheduleModule.AGENDA_TIMEZONE || process.env.AGENDA_TIMEZONE || 'Asia/Hong_Kong';
const gameName = function (params = {}) {
    return resolveGameName(params, 'admin.game_name', '【Admin Tool】.admin debug state account news on');
}

const gameType = function () {
    return 'admin:Admin:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^[.]admin$/i,
        second: null
    }, {
        first: /^[.]root$/i,
        second: null
    }, {
        first: /^[.]patreon$/i,
        second: null
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'admin.help');
}
const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('admin')
            .setDescription('【⚙️管理員工具箱】')
            // System monitoring
            .addSubcommand(subcommand =>
                subcommand
                    .setName('state')
                    .setDescription('檢視Rollbot運行狀態，顯示系統資源使用'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('debug')
                    .setDescription('取得群組詳細資料，顯示設定狀態'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('id')
                    .setDescription('顯示自己的用戶ID與當前群組ID'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('mongod')
                    .setDescription('檢視MongoDB連接狀態'))
            // Account management
            .addSubcommand(subcommand =>
                subcommand
                    .setName('account')
                    .setDescription('網頁版角色卡設定')
                    .addStringOption(option => 
                        option.setName('username')
                            .setDescription('使用者名稱 (4-16字元，允許中文、英文)')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('password')
                            .setDescription('密碼 (6-16字元，允許英文字母和特殊符號!@#$%^&*)')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('registerchannel')
                    .setDescription('註冊當前頻道'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unregisterchannel')
                    .setDescription('取消註冊當前頻道'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('allowrolling')
                    .setDescription('允許頻道使用網頁擲骰'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('disallowrolling')
                    .setDescription('取消頻道網頁擲骰權限'))
            // Update notifications
            .addSubcommand(subcommand =>
                subcommand
                    .setName('news')
                    .setDescription('更新通知設定')
                    .addStringOption(option => 
                        option.setName('status')
                            .setDescription('開啟或關閉通知')
                            .setRequired(true)
                            .addChoices(
                                { name: '開啟', value: 'on' },
                                { name: '關閉', value: 'off' }
                            ))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            const translate = getT({ locale: interaction._hktrpgLocale, t: interaction._hktrpgT });
            
            // System monitoring
            switch (subcommand) {
            case 'state': {
                return '.admin state';
            }
            case 'debug': {
                return '.admin debug';
            }
            case 'id': {
                return '.admin id';
            }
            case 'mongod': {
                return '.admin mongod';
            }
            case 'account': {
                const username = interaction.options.getString('username');
                const password = interaction.options.getString('password');
                return `.admin account ${username} ${password}`;
            }
            case 'registerchannel': {
                return '.admin registerChannel';
            }
            case 'unregisterchannel': {
                return '.admin unregisterChannel';
            }
            case 'allowrolling': {
                return '.admin allowrolling';
            }
            case 'disallowrolling': {
                return '.admin disallowrolling';
            }
            case 'news': {
                const status = interaction.options.getString('status');
                return `.admin news ${status}`;
            }
            // No default
            }
            
            return translate('admin.slash_invalid_command');
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('root')
            .setDescription('【🔐系統管理員專用】')
            // System restart
            .addSubcommand(subcommand =>
                subcommand
                    .setName('respawn')
                    .setDescription('重啟指定ID的服務')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('服務ID')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('respawnall')
                    .setDescription('重啟所有服務'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('mem')
                    .setDescription('顯示各叢集 RSS 記憶體'))
            .addSubcommandGroup(group =>
                group
                    .setName('schedule')
                    .setDescription('排程自動 respawn（需手動開啟）')
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('show')
                            .setDescription('查看目前排程'))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('set')
                            .setDescription('設定星期與時間')
                            .addStringOption(option =>
                                option.setName('day')
                                    .setDescription('星期 (0-6 / sun-sat / 日-六)')
                                    .setRequired(true))
                            .addStringOption(option =>
                                option.setName('time')
                                    .setDescription('時間 HH:MM（時區 Asia/Hong_Kong）')
                                    .setRequired(true)))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('on')
                            .setDescription('開啟排程'))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('off')
                            .setDescription('關閉排程')))
            // VIP management
            .addSubcommand(subcommand =>
                subcommand
                    .setName('addvipgroup')
                    .setDescription('新增VIP群組')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('群組ID')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('level')
                            .setDescription('等級')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註'))
                    .addBooleanOption(option =>
                        option.setName('switch')
                            .setDescription('開關狀態')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('addvipuser')
                    .setDescription('新增VIP用戶')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('用戶ID')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('level')
                            .setDescription('等級')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('名稱')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註'))
                    .addBooleanOption(option =>
                        option.setName('switch')
                            .setDescription('開關狀態')))
            // Patreon management
            .addSubcommand(subcommand =>
                subcommand
                    .setName('addpatreon')
                    .setDescription('新增/更新 Patreon 會員')
                    .addStringOption(option =>
                        option.setName('patreon_name')
                            .setDescription('Patreon 名稱（避免空白）')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('tier')
                            .setDescription('Patreon Tier')
                            .setRequired(true)
                            .addChoices(
                                { name: 'A 調查員', value: 'A' },
                                { name: 'B 神秘學家', value: 'B' },
                                { name: 'C 教主', value: 'C' },
                                { name: 'D KP', value: 'D' },
                                { name: 'E 支援者', value: 'E' },
                                { name: 'F ??????', value: 'F' }
                            ))
                    .addStringOption(option =>
                        option.setName('notes')
                            .setDescription('備註（避免空白）')
                            .setRequired(false))
                    .addBooleanOption(option =>
                        option.setName('switch')
                            .setDescription('開關狀態')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('regenkeypatreon')
                    .setDescription('重設 Patreon 會員 KEY')
                    .addStringOption(option =>
                        option.setName('patreon_name')
                            .setDescription('Patreon 名稱（避免空白）')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('onpatreon')
                    .setDescription('開啟 Patreon 會員狀態')
                    .addStringOption(option =>
                        option.setName('patreon_name')
                            .setDescription('Patreon 名稱（避免空白）')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('offpatreon')
                    .setDescription('關閉 Patreon 會員狀態')
                    .addStringOption(option =>
                        option.setName('patreon_name')
                            .setDescription('Patreon 名稱（避免空白）')
                            .setRequired(true)))
            // Command registration
            .addSubcommand(subcommand =>
                subcommand
                    .setName('registeredglobal')
                    .setDescription('註冊全局指令'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('testregistered')
                    .setDescription('測試指令註冊狀態')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('指令ID')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('removeslashcommands')
                    .setDescription('移除指定群組的 Slash 指令')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('群組 ID（留空則為目前群組）')
                            .setRequired(false)))
            // Encryption functions
            .addSubcommand(subcommand =>
                subcommand
                    .setName('decrypt')
                    .setDescription('解密文字')
                    .addStringOption(option =>
                        option.setName('text')
                            .setDescription('加密文字')
                            .setRequired(true)))
            // Send notifications
            .addSubcommand(subcommand =>
                subcommand
                    .setName('sendnews')
                    .setDescription('發送更新通知')
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('通知訊息')
                            .setRequired(true)))
            // Shard fix
            .addSubcommand(subcommand =>
                subcommand
                    .setName('fixshard')
                    .setDescription('Shard 修復工具')
                    .addStringOption(option =>
                        option.setName('action')
                            .setDescription('動作 (check/start/stop/status)')
                            .setRequired(true)
                            .addChoices(
                                { name: 'check - 檢查所有 shard 狀態', value: 'check' },
                                { name: 'start - 開始自動修復', value: 'start' },
                                { name: 'stop - 停止自動修復', value: 'stop' },
                                { name: 'status - 查看修復狀態', value: 'status' }
                            )))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('importpatreon')
                    .setDescription('匯入 Patreon CSV（附件）')
                    .addAttachmentOption(option =>
                        option.setName('file')
                            .setDescription('Patreon 匯出的 .csv 檔案')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('mode')
                            .setDescription('KEY 顯示模式')
                            .setRequired(false)
                            .addChoices(
                                { name: 'allkeys - 所有 KEY', value: 'allkeys' },
                                { name: 'newonly - 只有新會員 KEY', value: 'newonly' }
                            ))
                    .addBooleanOption(option =>
                        option.setName('email')
                            .setDescription('是否產生 Email 內容檔案')
                            .setRequired(false))),
        async execute(interaction) {
            const group = interaction.options.getSubcommandGroup(false);
            const subcommand = interaction.options.getSubcommand();
            const translate = getT({ locale: interaction._hktrpgLocale, t: interaction._hktrpgT });

            if (group === 'schedule') {
                switch (subcommand) {
                case 'show':
                    return '.root schedule';
                case 'set': {
                    const day = interaction.options.getString('day');
                    const time = interaction.options.getString('time');
                    return `.root schedule set ${day} ${time}`;
                }
                case 'on':
                    return '.root schedule on';
                case 'off':
                    return '.root schedule off';
                default:
                    return translate('admin.slash_invalid_command');
                }
            }

            // System restart
            switch (subcommand) {
            case 'respawn': {
                const id = interaction.options.getString('id');
                return `.root respawn ${id}`;
            }
            case 'respawnall': {
                return '.root respawnall';
            }
            case 'mem': {
                return '.root mem';
            }
            case 'addvipgroup': {
                const id = interaction.options.getString('id');
                const level = interaction.options.getInteger('level');
                const name = interaction.options.getString('name');
                const notes = interaction.options.getString('notes') || '';
                const switch_ = interaction.options.getBoolean('switch') ?? true;
                return `.root addVipGroup -i ${id} -l ${level} -n ${name} -no ${notes} -s ${switch_}`;
            }
            case 'addvipuser': {
                const id = interaction.options.getString('id');
                const level = interaction.options.getInteger('level');
                const name = interaction.options.getString('name');
                const notes = interaction.options.getString('notes') || '';
                const switch_ = interaction.options.getBoolean('switch') ?? true;
                return `.root addVipUser -i ${id} -l ${level} -n ${name} -no ${notes} -s ${switch_}`;
            }
            case 'addpatreon': {
                const patreonName = interaction.options.getString('patreon_name');
                const tier = interaction.options.getString('tier');
                const notes = interaction.options.getString('notes') || '';
                const switch_ = interaction.options.getBoolean('switch');
                let cmd = `.root addpatreon ${patreonName} tier=${tier}`;
                if (notes) cmd += ` -no ${notes}`;
                if (switch_ !== null) cmd += ` -s ${switch_ ? 'on' : 'off'}`;
                return cmd;
            }
            case 'regenkeypatreon': {
                const patreonName = interaction.options.getString('patreon_name');
                return `.root regenkeypatreon ${patreonName}`;
            }
            case 'onpatreon': {
                const patreonName = interaction.options.getString('patreon_name');
                return `.root onpatreon ${patreonName}`;
            }
            case 'offpatreon': {
                const patreonName = interaction.options.getString('patreon_name');
                return `.root offpatreon ${patreonName}`;
            }
            case 'registeredglobal': {
                return '.root registeredGlobal';
            }
            case 'testregistered': {
                const id = interaction.options.getString('id');
                const targetId = id || interaction.guildId;
                if (!targetId) {
                    return translate('admin.error_missing_target_id');
                }
                return `.root testRegistered ${targetId}`;
            }
            case 'removeslashcommands': {
                const id = interaction.options.getString('id');
                const targetId = id || interaction.guildId;
                if (!targetId) {
                    return translate('admin.error_missing_target_id');
                }
                return `.root removeSlashCommands ${targetId}`;
            }
            case 'decrypt': {
                const text = interaction.options.getString('text');
                return `.root decrypt ${text}`;
            }
            case 'sendnews': {
                const message = interaction.options.getString('message');
                return `.root send News ${message}`;
            }
            case 'fixshard': {
                const action = interaction.options.getString('action');
                return `.root fixshard ${action}`;
            }
            case 'importpatreon': {
                const file = interaction.options.getAttachment('file');
                const mode = interaction.options.getString('mode') || 'allkeys';
                const email = interaction.options.getBoolean('email') || false;
                const fileName = (file && file.name) ? file.name.toLowerCase() : '';
                if (!file || !fileName.endsWith('.csv')) {
                    return translate('admin.import_csv_upload_required');
                }

                // Bridge slash attachment into the existing .root importpatreon flow.
                // The root handler reads discordMessage.attachments.
                interaction.attachments = new Map([[file.id || 'patreon_csv', file]]);
                let command = `.root importpatreon ${mode}`;
                if (email) {
                    command += ' -email';
                }
                return {
                    inputStr: command,
                    discordMessage: interaction,
                    isInteraction: true
                };
            }
            // No default
            }
            
            return translate('admin.slash_invalid_command');
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('patreon')
            .setDescription('Patreon / VIP 查詢')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('id')
                    .setDescription('顯示自己的用戶ID與當前群組ID'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('level')
                    .setDescription('查詢自己與當前群組的 VIP（Patreon）等級')),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
            case 'id':
                return '.patreon id';
            case 'level':
                return '.patreon level';
            default:
                return '.patreon id';
            }
        }
    }
];

const initialize = function () {
    return variables;
}
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
    titleName,
    discordClient,
    discordMessage,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let filter = {};
    let doc = {};
    let temp;
    let hash = ""
    let name;
    let temp2;

    // Check if it's an admin command
    const isAdminCommand = /^[.]admin$/i.test(mainMsg[0]);
    const isRootCommand = /^[.]root$/i.test(mainMsg[0]);
    const isPatreonCommand = /^[.]patreon$/i.test(mainMsg[0]);

    // If it's a root command, check permissions
    if (isRootCommand) {
        if (!isAdminUser(userid)) {
            rply.text = translate('admin.root_admin_only');
            return rply;
        }
    }

    // Handle different functions based on command type
    if (isAdminCommand) {
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = getHelpMessage(i18nParams);
                rply.quotes = true;
                return rply;
            case /^state$/i.test(mainMsg[1]):
                rply.state = true;
                rply.quotes = true;
                return rply;
            case /^debug$/i.test(mainMsg[1]):
                rply.text = translate('admin.debug_plain', {
                    groupid: groupid || translate('admin.not_available'),
                    userid: userid || translate('admin.not_available'),
                    channelid: channelid || translate('admin.not_available'),
                    userrole_line: userrole ? `\nuserrole: ${userrole}` : '',
                    botname_line: botname ? `\nbotname: ${botname}` : '',
                    displayname_line: displayname ? `\ndisplayname: ${displayname}` : '',
                    displayname_discord_line: displaynameDiscord ? `\ndisplaynameDiscord: ${displaynameDiscord}` : '',
                    membercount_line: membercount ? `\nmembercount: ${membercount}` : ''
                });
                if (!password) return rply;
                rply.text = translate('admin.debug_encrypt_prefix', { data: security.encryptWithCryptoSecret(rply.text) });
                return rply;
            case /^id$/i.test(mainMsg[1]): {
                rply.text = translate('admin.id_query', {
                    user_id: userid || translate('admin.not_available'),
                    group_id: groupid || translate('admin.id_query_no_group'),
                    channel_id: channelid || translate('admin.not_available')
                });
                return rply;
            }
            case /^mongod$/i.test(mainMsg[1]): {
                if (!isAdminUser(userid)) return rply;
                let mongod = await schema.mongodbStateCheck();
                rply.text = JSON.stringify(mongod ? mongod.connections : translate('admin.mongod_connection_failed'));
                rply.quotes = true;
                return rply;
            }
            case /^clusterhealth$/i.test(mainMsg[1]): {
                if (!isAdminUser(userid)) return rply;
                try {
                    // Import the health report function from discord_bot.js
                    const healthReport = globalThis.getClusterHealthReport();
                    const dbStatus = dbProtectionLayer.getStatusReport();
                    const clusterProtectionStatus = clusterProtection.getStatusReport();

                    const clusterDetails = healthReport.clusters.map(c => translate('admin.clusterhealth_detail_line', {
                        id: c.id,
                        ready: c.ready ? '✅' : '❌',
                        alive: c.alive ? '🟢' : '🔴',
                        shards: c.shards,
                        uptime: c.uptime
                    })).join('\n');
                    rply.text = translate('admin.clusterhealth_report', {
                        mode: dbStatus.isDegradedMode ? translate('admin.clusterhealth_mode_degraded') : translate('admin.clusterhealth_mode_normal'),
                        connection: dbStatus.dbConnectionState === 1 ? translate('admin.clusterhealth_connected') : translate('admin.clusterhealth_disconnected'),
                        consecutive_failures: dbStatus.consecutiveFailures,
                        cache_size: dbStatus.cacheSize,
                        pending_sync: dbStatus.pendingSyncOperations,
                        unhealthy_clusters: clusterProtectionStatus.unhealthyCount,
                        health_timeout: clusterProtectionStatus.healthTimeout / 1000,
                        max_retries: clusterProtectionStatus.maxRetries,
                        total_clusters: healthReport.summary.totalClusters,
                        active_clusters: healthReport.summary.activeClusters,
                        ready_clusters: healthReport.summary.readyClusters,
                        dead_clusters: healthReport.summary.deadClusters,
                        total_shards: healthReport.summary.totalShards,
                        pid: healthReport.processInfo.pid,
                        uptime_h: Math.floor(healthReport.processInfo.uptime / 3600),
                        uptime_m: Math.floor((healthReport.processInfo.uptime % 3600) / 60),
                        memory_mb: healthReport.processInfo.memoryMB,
                        cluster_details: clusterDetails
                    });
                    rply.quotes = true;
                } catch (error) {
                    rply.text = translate('admin.clusterhealth_failed', { message: error.message });
                }
                return rply;
            }
            case /^registerChannel$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({ locale,
                    flag: checkTools.flag.ChkChannel,
                    gid: groupid
                });
                if (rply.text) {
                    return rply;
                }
                try {
                    temp = await schema.accountPW.findOne({
                        "id": userid
                    });
                } catch (error) {
                    console.error('[Admin] registerChannel error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                try {
                    temp2 = await schema.accountPW.findOne({
                        "id": userid,
                        "channel.id": channelid || groupid
                    });
                } catch (error) {
                    console.error('[Admin] registerChannel error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                if (temp && temp2) {
                    rply.text = translate('admin.register_channel_already');
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += `\n${translate('admin.register_channel_allowrolling_required_first')}`;
                    }
                    return rply;
                }
                if (temp && !temp2) {
                    temp.channel.push({
                        "id": channelid || groupid,
                        "botname": botname,
                        "titleName": titleName
                    })
                    await temp.save();
                    rply.text = translate('admin.register_channel_success');
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += `\n${translate('admin.register_channel_allowrolling_required')}`;
                    }
                    return rply;
                }
                if (!temp) {
                    temp = new schema.accountPW({
                        id: userid,
                        channel: {
                            "id": channelid || groupid,
                            "botname": botname,
                            "titleName": titleName
                        }
                    });
                    await temp.save().catch(error => console.error('[Admin] MongoDB error:', error.name, error.reason));
                    rply.text = translate('admin.register_channel_success_alt');
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += `\n${translate('admin.register_channel_allowrolling_required')}`;
                    }
                    return rply;
                }
                return rply;
            case /^unregisterChannel$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({ locale,
                    flag: checkTools.flag.ChkChannel,
                    gid: groupid
                });
                if (rply.text) {
                    return rply;
                }
                try {
                    await schema.accountPW.updateOne({
                        "id": userid
                    }, {
                        $pull: {
                            channel: {
                                "id": channelid || groupid
                            }
                        }
                    });
                } catch (error) {
                    console.error('[Admin] unregisterChannel error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                rply.text = translate('admin.unregister_channel_success');
                return rply;
            case /^disallowrolling$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({ locale,
                    flag: checkTools.flag.ChkChannelAdmin,
                    gid: groupid,
                    role: userrole
                });
                if (rply.text) {
                    return rply;
                }
                try {
                    doc = await schema.allowRolling.findOneAndDelete({
                        "id": channelid || groupid
                    });
                } catch (error) {
                    console.error('[Admin] disAllowrolling error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                rply.text = translate('admin.disallowrolling_success');
                return rply;
            case /^allowrolling$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({ locale,
                    flag: checkTools.flag.ChkChannelAdmin,
                    gid: groupid,
                    role: userrole
                });
                if (rply.text) {
                    return rply;
                }
                try {
                    doc = await schema.allowRolling.findOneAndUpdate({
                        "id": channelid || groupid
                    }, {
                        $set: {
                            "id": channelid || groupid,
                            "botname": botname
                        }
                    }, {
                        upsert: true,
                        returnDocument: 'after'
                    });
                } catch (error) {
                    console.error('[Admin] Allowrolling error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                rply.text = translate('admin.allowrolling_success');
                return rply;
            case /^account$/i.test(mainMsg[1]): {
                if (groupid) {
                    rply.text = translate('admin.account_dm_only');
                    return rply;
                }
                if (!mainMsg[2]) {
                    rply.text = translate('admin.account_username_required');
                    return rply;
                }
                if (!mainMsg[3]) {
                    rply.text = translate('admin.account_password_required');
                    return rply;
                }
                name = mainMsg[2].toLowerCase();
                if (!checkUserName(name)) {
                    rply.text = translate('admin.account_username_invalid');
                    return rply;
                }
                if (!checkPassword(mainMsg[3])) {
                    rply.text = translate('admin.account_password_invalid');
                    return rply;
                }
                // 🔒 Use new secure password hashing
                const security = require('../utils/security.js');
                hash = await security.hashPassword(mainMsg[3]);
                try {
                    temp = await schema.accountPW.findOne({
                        "userName": name
                    });
                } catch (error) {
                    console.error('[Admin] Account error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                if (temp && temp.id != userid) {
                    rply.text += translate('admin.account_username_duplicated');
                    return rply;
                }
                try {
                    await schema.accountPW.findOneAndUpdate({
                        "id": userid
                    }, {
                        $set: {
                            "userName": name,
                            "password": hash
                        }
                    }, {
                        upsert: true,
                        returnDocument: 'after'
                    });
                } catch (error) {
                    console.error('[Admin] Account error:', error);
                    rply.text += JSON.stringify(error);
                    return rply;
                }
                rply.text += translate('admin.account_set_success', { name, password: mainMsg[3] });
                return rply;
            }
            case /^news$/i.test(mainMsg[1]) && /^on$/i.test(mainMsg[2]):
                if (!userid) return rply;
                try {
                    doc = await schema.theNewsMessage.updateOne({
                        userID: userid,
                        botname: botname
                    }, {
                        userID: userid,
                        botname: botname,
                        switch: true
                    }, opt)
                    if (doc) {
                        rply.text = translate('admin.news_on_success');
                    }
                } catch (error) {
                    console.error('[Admin] Add VIP error:', error)
                    rply.text = translate('admin.news_update_failed', { message: error.message });
                }
                return rply;
            case /^news$/i.test(mainMsg[1]) && /^off$/i.test(mainMsg[2]):
                if (!userid) return rply;
                try {
                    doc = await schema.theNewsMessage.updateOne({
                        userID: userid,
                        botname: botname
                    }, {
                        userID: userid,
                        botname: botname,
                        switch: false
                    }, opt)
                    if (doc) {
                        rply.text = translate('admin.news_off_success');
                    }
                } catch (error) {
                    console.error('[Admin] Add VIP error:', error)
                    rply.text = translate('admin.news_update_failed', { message: error.message });
                }
                return rply;
            default:
                return rply;
        }
    } else if (isPatreonCommand) {
        switch (true) {
            case /^id$/i.test(mainMsg[1]): {
                rply.text = translate('admin.id_query', {
                    user_id: userid || translate('admin.not_available'),
                    group_id: groupid || translate('admin.id_query_no_group'),
                    channel_id: channelid || translate('admin.not_available')
                });
                return rply;
            }
            case /^level$/i.test(mainMsg[1]): {
                const userLevel = await viplevelCheckUser(userid);
                const groupLevel = await viplevelCheckGroup(groupid || '');
                const userLabel = patreonTiers.getTierLabel(userLevel, locale) || (userLevel ? `Level ${userLevel}` : translate('admin.none'));
                const groupLabel = patreonTiers.getTierLabel(groupLevel, locale) || (groupLevel ? `Level ${groupLevel}` : translate('admin.none'));
                rply.text = translate('admin.patreon_level_report', {
                    user_level: userLevel,
                    user_label: userLabel,
                    group_level: groupLevel,
                    group_label: groupLabel
                });
                return rply;
            }
            default:
                rply.text = translate('admin.patreon_available_commands');
                return rply;
        }
    } else if (isRootCommand) {
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = getHelpMessage(i18nParams);
                rply.quotes = true;
                return rply;
            case /^registeredGlobal$/i.test(mainMsg[1]):
                rply.text = await deploy.registeredGlobalSlashCommands(locale);
                return rply;
            case /^testRegistered$/i.test(mainMsg[1]): {
                const targetId = mainMsg[2] || groupid;
                if (!targetId) {
                    rply.text = translate('admin.error_missing_target_id');
                    return rply;
                }
                rply.text = await deploy.testRegisteredSlashCommands(targetId, locale);
                return rply;
            }
            case /^removeSlashCommands$/i.test(mainMsg[1]): {
                const targetId = mainMsg[2] || groupid;
                console.log('[Admin] .root removeSlashCommands called', {
                    rawInput: inputStr,
                    mainMsg,
                    groupid,
                    resolvedTargetId: targetId
                });
                if (!targetId) {
                    rply.text = translate('admin.error_missing_target_id');
                    return rply;
                }
                try {
                    const resultMsg = await deploy.removeSlashCommands(targetId, locale);
                    console.log('[Admin] removeSlashCommands result', { targetId, resultMsg });
                    rply.text = resultMsg || translate('admin.remove_slash_requested', { target_id: targetId });
                } catch (error) {
                    console.error('[Admin] removeSlashCommands error:', error);
                    rply.text = translate('admin.remove_slash_failed', { message: error.message });
                }
                return rply;
            }
            case /^respawn$/i.test(mainMsg[1]):
                if (mainMsg[2] === null) return rply;
                discordClient.cluster.send({
                    respawn: true,
                    id: mainMsg[2],
                    meta: {
                        source: 'admin_command',
                        trigger: '.root respawn',
                        targetClusterId: mainMsg[2],
                        userid,
                        groupid,
                        channelid
                    }
                });
                return rply;
            case /^respawnall$/i.test(mainMsg[1]):
                discordClient.cluster.send({
                    respawnall: true,
                    meta: {
                        source: 'admin_command',
                        trigger: '.root respawnall',
                        userid,
                        groupid,
                        channelid
                    }
                });
                return rply;
            case /^mem$/i.test(mainMsg[1]): {
                if (!discordClient || !discordClient.cluster) {
                    rply.text = translate('admin.mem_discord_only');
                    return rply;
                }
                try {
                    const results = await clusterProtection.safeBroadcastEval(
                        discordClient,
                        (client) => {
                            const v8mod = require('node:v8');
                            const mem = process.memoryUsage();
                            const heapStats = v8mod.getHeapStatistics();
                            return {
                                clusterId: (client.cluster && client.cluster.id != null) ? client.cluster.id : -1,
                                rss: mem.rss,
                                heapUsed: mem.heapUsed,
                                heapTotal: mem.heapTotal,
                                external: mem.external,
                                heapSizeLimit: heapStats.heap_size_limit,
                                uptime: Math.floor(process.uptime())
                            };
                        },
                        { timeout: 10_000 }
                    );
                    const rows = (Array.isArray(results) ? results : [results])
                        .filter(Boolean)
                        .sort((a, b) => a.clusterId - b.clusterId);
                    if (rows.length === 0) {
                        rply.text = translate('admin.mem_no_data');
                        return rply;
                    }
                    const toMb = (bytes) => (bytes / (1024 * 1024)).toFixed(1);
                    const lines = rows.map((row) => translate('admin.mem_line', {
                        id: row.clusterId,
                        rss: toMb(row.rss),
                        heap: toMb(row.heapUsed),
                        heap_total: toMb(row.heapTotal),
                        external: toMb(row.external),
                        uptime: row.uptime
                    }));
                    const totalRss = rows.reduce((sum, row) => sum + (row.rss || 0), 0);
                    const hostTotal = os.totalmem();
                    const hostFree = os.freemem();
                    const hostUsed = hostTotal - hostFree;
                    const hostPercent = ((hostUsed / hostTotal) * 100).toFixed(1);
                    const heapLimit = rows[0].heapSizeLimit || v8.getHeapStatistics().heap_size_limit;
                    rply.text = translate('admin.mem_report', {
                        count: rows.length,
                        total_rss: toMb(totalRss),
                        lines: lines.join('\n'),
                        host_total: toMb(hostTotal),
                        host_used: toMb(hostUsed),
                        host_free: toMb(hostFree),
                        host_percent: hostPercent,
                        heap_limit: toMb(heapLimit),
                        warn_at: '85',
                        critical_at: '95'
                    });
                    rply.quotes = true;
                } catch (error) {
                    console.error('[Admin] .root mem error:', error);
                    rply.text = translate('admin.mem_failed', { message: error.message });
                }
                return rply;
            }
            case /^schedule$/i.test(mainMsg[1]): {
                const action = (mainMsg[2] || 'show').toLowerCase();
                try {
                    if (action === 'show' || action === 'status') {
                        rply.text = await formatRespawnScheduleStatus(translate);
                        rply.quotes = true;
                        return rply;
                    }
                    if (action === 'set') {
                        const dayRaw = mainMsg[3];
                        const timeRaw = mainMsg[4];
                        if (!dayRaw || !timeRaw) {
                            rply.text = translate('admin.schedule_set_usage');
                            return rply;
                        }
                        const dayOfWeek = parseWeekday(dayRaw);
                        if (dayOfWeek === null) {
                            rply.text = translate('admin.schedule_invalid_day');
                            return rply;
                        }
                        const parsedTime = parseClockTime(timeRaw);
                        if (!parsedTime) {
                            rply.text = translate('admin.schedule_invalid_time');
                            return rply;
                        }
                        if (!schema.discordRespawnSchedule) {
                            rply.text = translate('admin.schedule_db_unavailable');
                            return rply;
                        }
                        const existing = await schema.discordRespawnSchedule.findOne({ key: SCHEDULE_DOC_KEY }).lean();
                        const doc = await schema.discordRespawnSchedule.findOneAndUpdate(
                            { key: SCHEDULE_DOC_KEY },
                            {
                                $set: {
                                    dayOfWeek,
                                    hour: parsedTime.hour,
                                    minute: parsedTime.minute,
                                    updatedBy: userid,
                                    updatedAt: new Date(),
                                    // Keep previous enabled flag; set alone does not turn on.
                                    enabled: existing ? Boolean(existing.enabled) : false
                                },
                                $setOnInsert: {
                                    key: SCHEDULE_DOC_KEY
                                }
                            },
                            { ...opt, returnDocument: 'after' }
                        );
                        if (scheduleModule && typeof scheduleModule.syncDiscordMaintenanceSchedule === 'function') {
                            await scheduleModule.syncDiscordMaintenanceSchedule(doc.toObject ? doc.toObject() : doc);
                        }
                        rply.text = translate('admin.schedule_set_success', {
                            weekday: translate(`admin.weekday_${dayOfWeek}`),
                            time: formatClockTime(parsedTime.hour, parsedTime.minute),
                            enabled: doc.enabled
                                ? translate('admin.schedule_status_on')
                                : translate('admin.schedule_status_off'),
                            timezone: AGENDA_TIMEZONE
                        });
                        rply.quotes = true;
                        return rply;
                    }
                    if (action === 'on') {
                        if (!schema.discordRespawnSchedule) {
                            rply.text = translate('admin.schedule_db_unavailable');
                            return rply;
                        }
                        const existing = await schema.discordRespawnSchedule.findOne({ key: SCHEDULE_DOC_KEY }).lean();
                        if (
                            !existing
                            || existing.dayOfWeek == null
                            || existing.hour == null
                            || existing.minute == null
                        ) {
                            rply.text = translate('admin.schedule_on_need_set');
                            return rply;
                        }
                        const doc = await schema.discordRespawnSchedule.findOneAndUpdate(
                            { key: SCHEDULE_DOC_KEY },
                            {
                                $set: {
                                    enabled: true,
                                    updatedBy: userid,
                                    updatedAt: new Date()
                                }
                            },
                            { ...opt, returnDocument: 'after' }
                        );
                        if (scheduleModule && typeof scheduleModule.syncDiscordMaintenanceSchedule === 'function') {
                            await scheduleModule.syncDiscordMaintenanceSchedule(doc.toObject ? doc.toObject() : doc);
                        }
                        rply.text = translate('admin.schedule_on_success', {
                            weekday: translate(`admin.weekday_${doc.dayOfWeek}`),
                            time: formatClockTime(doc.hour, doc.minute),
                            timezone: AGENDA_TIMEZONE
                        });
                        rply.quotes = true;
                        return rply;
                    }
                    if (action === 'off') {
                        if (!schema.discordRespawnSchedule) {
                            rply.text = translate('admin.schedule_db_unavailable');
                            return rply;
                        }
                        const doc = await schema.discordRespawnSchedule.findOneAndUpdate(
                            { key: SCHEDULE_DOC_KEY },
                            {
                                $set: {
                                    enabled: false,
                                    updatedBy: userid,
                                    updatedAt: new Date()
                                }
                            },
                            { ...opt, returnDocument: 'after' }
                        );
                        if (scheduleModule && typeof scheduleModule.syncDiscordMaintenanceSchedule === 'function') {
                            await scheduleModule.syncDiscordMaintenanceSchedule(doc ? (doc.toObject ? doc.toObject() : doc) : { enabled: false });
                        }
                        rply.text = translate('admin.schedule_off_success');
                        rply.quotes = true;
                        return rply;
                    }
                    rply.text = translate('admin.schedule_set_usage');
                } catch (error) {
                    console.error('[Admin] .root schedule error:', error);
                    rply.text = translate('admin.schedule_failed', { message: error.message });
                }
                return rply;
            }
            case /^addVipGroup$/i.test(mainMsg[1]):
                try {
                    filter = await store(inputStr, 'gp', translate);
                    try {
                        doc = await schema.veryImportantPerson.findOneAndUpdate({
                            gpid: filter.gpid
                        }, {
                            $set: filter,
                            $setOnInsert: {
                                startDate: new Date()
                            }
                        }, {
                            ...opt,
                            returnDocument: 'after'
                        });
                        if (doc) {
                            rply.text = translate('admin.vip_group_updated', {
                                group_id: filter.gpid,
                                level: filter.level,
                                name: filter.name,
                                notes: filter.notes || translate('admin.none'),
                                status: filter.switch ? translate('admin.status_on') : translate('admin.status_off')
                            });
                        } else {
                            rply.text = translate('admin.update_group_not_found');
                        }
                    } catch (error) {
                        console.error('[Admin] Add VIP group error:', error);
                        rply.text = translate('admin.add_vip_group_failed', { message: error.message });
                    }
                } catch (error) {
                    rply.text = error.message;
                }
                return rply;
            case /^addVipUser$/i.test(mainMsg[1]):
                try {
                    filter = await store(inputStr, 'id', translate);
                    try {
                        doc = await schema.veryImportantPerson.findOneAndUpdate({
                            id: filter.id
                        }, {
                            $set: filter,
                            $setOnInsert: {
                                startDate: new Date()
                            }
                        }, {
                            ...opt,
                            returnDocument: 'after'
                        });
                        if (doc) {
                            rply.text = translate('admin.vip_user_updated', {
                                user_id: filter.id,
                                level: filter.level,
                                name: filter.name,
                                notes: filter.notes || translate('admin.none'),
                                status: filter.switch ? translate('admin.status_on') : translate('admin.status_off')
                            });
                        } else {
                            rply.text = translate('admin.update_user_not_found');
                        }
                    } catch (error) {
                        console.error('[Admin] Add VIP user error:', error);
                        rply.text = translate('admin.add_vip_user_failed', { message: error.message });
                    }
                } catch (error) {
                    rply.text = error.message;
                }
                return rply;
            case /^addpatreon$/i.test(mainMsg[1]): {
                const patreonName = mainMsg[2];
                if (!patreonName) {
                    rply.text = translate('admin.add_patreon_name_required');
                    return rply;
                }
                const tierMatch = inputStr.match(/tier=([A-Fa-f])/i);
                const tierLetter = tierMatch ? tierMatch[1].toUpperCase() : null;
                const level = tierLetter ? patreonTiers.tierLetterToLevel(tierLetter) : null;
                if (level == null) {
                    rply.text = translate('admin.add_patreon_tier_required');
                    return rply;
                }
                const notesMatch = inputStr.match(/\s+-no\s+(\S+)/i);
                const switchMatch = inputStr.match(/\s+-s\s+(\S+)/i);
                let notes = '';
                if (notesMatch && notesMatch[1] && !notesMatch[1].startsWith('-')) notes = notesMatch[1];
                let switchOn = true;
                if (switchMatch) {
                    const v = switchMatch[1].toLowerCase();
                    if (v === 'false' || v === 'off') switchOn = false;
                }
                try {
                    const existed = await schema.patreonMember.findOne({ patreonName }).lean();
                    const historyEntry = {
                        at: new Date(),
                        action: switchOn ? 'on' : 'off',
                        source: 'admin',
                        reason: existed ? 'admin_update' : 'admin_create'
                    };
                    const setFields = { level, notes, switch: switchOn, name: patreonName };
                    let newKeyPlain = null;
                    if (!existed) {
                        newKeyPlain = generatePatreonKey();
                        const normalized = (newKeyPlain || '').replaceAll(/\s/g, '').replaceAll('-', '').toUpperCase();
                        setFields.keyHash = security.hashPatreonKey(normalized);
                        setFields.keyEncrypted = security.encryptWithCryptoSecret(newKeyPlain);
                    }
                    // Set key so legacy unique index key_1 has no duplicate null (E11000)
                    setFields.key = (existed && existed.keyHash) ? existed.keyHash : setFields.keyHash;
                    doc = await schema.patreonMember.findOneAndUpdate(
                        { patreonName },
                        {
                            $set: setFields,
                            $setOnInsert: {
                                patreonName,
                                startDate: new Date(),
                                slots: []
                            },
                            $push: { history: historyEntry }
                        },
                        { upsert: true, returnDocument: 'after', runValidators: true }
                    );
                    if (!doc) {
                        rply.text = translate('admin.add_patreon_failed_simple');
                        return rply;
                    }
                    const tierLabel = patreonTiers.getTierLabel(level, locale);
                    rply.text = translate('admin.add_patreon_success', {
                        action: existed ? translate('admin.action_updated') : translate('admin.action_added'),
                        name: patreonName,
                        tier_label: tierLabel,
                        status: switchOn ? translate('admin.status_on') : translate('admin.status_off')
                    });
                    if (!existed && newKeyPlain) {
                        rply.text += `\n\n${translate('admin.patreon_key_block', { key: newKeyPlain })}`;
                    }
                } catch (error) {
                    console.error('[Admin] addpatreon error:', error);
                    const MONGO_DUP_KEY = 11e3; // 11000 MongoDB duplicate key
                    const msg = String(error.message || '');
                    const isKeyNullDup = error.code === MONGO_DUP_KEY && (msg.includes('key') && msg.includes('null'));
                    rply.text = isKeyNullDup
                        ? translate('admin.add_patreon_failed_key_index')
                        : translate('admin.add_patreon_failed', { message: error.message });
                }
                return rply;
            }
            case /^regenkeypatreon$/i.test(mainMsg[1]): {
                const patreonNameRegen = mainMsg[2];
                if (!patreonNameRegen) {
                    rply.text = translate('admin.regenkey_name_required');
                    return rply;
                }
                try {
                    doc = await schema.patreonMember.findOne({ patreonName: patreonNameRegen });
                    if (!doc) {
                        rply.text = translate('admin.patreon_member_not_found', { name: patreonNameRegen });
                        return rply;
                    }
                    await patreonSync.clearVipEntriesByPatreonKey(doc);
                    const newKey = generatePatreonKey();
                    const normalized = (newKey || '').replaceAll(/\s/g, '').replaceAll('-', '').toUpperCase();
                    const keyHash = security.hashPatreonKey(normalized);
                    const keyEncrypted = security.encryptWithCryptoSecret(newKey);
                    await schema.patreonMember.updateOne(
                        { patreonName: patreonNameRegen },
                        { $set: { keyHash, keyEncrypted, key: keyHash } }
                    );
                    rply.text = translate('admin.regenkey_success', { name: patreonNameRegen, key: newKey });
                } catch (error) {
                    console.error('[Admin] regenkeypatreon error:', error);
                    rply.text = translate('admin.regenkey_failed', { message: error.message });
                }
                return rply;
            }
            case /^onpatreon$/i.test(mainMsg[1]): {
                const patreonNameOn = mainMsg[2];
                if (!patreonNameOn) {
                    rply.text = translate('admin.onpatreon_name_required');
                    return rply;
                }
                try {
                    doc = await schema.patreonMember.findOneAndUpdate(
                        { patreonName: patreonNameOn },
                        {
                            $set: { switch: true },
                            $unset: { vipGraceUntil: 1 },
                            $push: { history: { at: new Date(), action: 'on', source: 'admin', reason: 'manual_on' } }
                        },
                        { returnDocument: 'after' }
                    );
                    if (!doc) {
                        rply.text = translate('admin.patreon_member_not_found', { name: patreonNameOn });
                        return rply;
                    }
                    await patreonSync.syncMemberSlotsToVip(doc);
                    rply.text = translate('admin.onpatreon_success', { name: patreonNameOn });
                } catch (error) {
                    console.error('[Admin] onpatreon error:', error);
                    rply.text = translate('admin.onpatreon_failed', { message: error.message });
                }
                return rply;
            }
            case /^offpatreon$/i.test(mainMsg[1]): {
                const patreonNameOff = mainMsg[2];
                if (!patreonNameOff) {
                    rply.text = translate('admin.offpatreon_name_required');
                    return rply;
                }
                try {
                    doc = await schema.patreonMember.findOne({ patreonName: patreonNameOff });
                    if (!doc) {
                        rply.text = translate('admin.patreon_member_not_found', { name: patreonNameOff });
                        return rply;
                    }
                    await patreonSync.clearVipEntriesByPatreonKey(doc);
                    await schema.patreonMember.updateOne(
                        { patreonName: patreonNameOff },
                        {
                            $set: { switch: false },
                            $push: { history: { at: new Date(), action: 'off', source: 'admin', reason: 'manual_off' } }
                        }
                    );
                    rply.text = translate('admin.offpatreon_success', { name: patreonNameOff });
                } catch (error) {
                    console.error('[Admin] offpatreon error:', error);
                    rply.text = translate('admin.offpatreon_failed', { message: error.message });
                }
                return rply;
            }
            case /^importpatreon$/i.test(mainMsg[1]): {
                if (!discordMessage?.attachments?.size) {
                    rply.text = translate('admin.import_csv_attachment_required');
                    return rply;
                }
                const attachments = [...discordMessage.attachments.values()];
                const csvFiles = attachments.filter(a => (a.name || '').toLowerCase().endsWith('.csv'));
                if (csvFiles.length === 0) {
                    rply.text = translate('admin.import_csv_upload_required');
                    return rply;
                }
                if (csvFiles.length > 1) {
                    rply.text = translate('admin.import_csv_single_only');
                    return rply;
                }
                const attachment = csvFiles[0];
                const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
                if ((attachment.size || 0) > MAX_CSV_SIZE_BYTES) {
                    rply.text = translate('admin.import_csv_too_large', { size_mb: MAX_CSV_SIZE_BYTES / 1024 / 1024 });
                    return rply;
                }
                const rawContentType = (attachment.contentType || '').toLowerCase();
                const contentType = rawContentType.split(';')[0].trim();
                const allowedTypes = [
                    'text/csv',
                    'application/csv',
                    'text/plain',
                    'application/octet-stream',
                    'application/vnd.ms-excel',
                    'text/comma-separated-values'
                ];
                if (contentType && !allowedTypes.includes(contentType)) {
                    rply.text = translate('admin.import_csv_invalid_content_type');
                    return rply;
                }
                const keyModeRaw = (mainMsg[2] || 'allkeys').toLowerCase();
                const keyMode = keyModeRaw === 'newonly' ? 'newonly' : 'all';
                const generateEmail = /\s-email/i.test(inputStr);

                let csvContent;
                try {
                    const response = await fetch(attachment.url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    csvContent = await response.text();
                } catch (error) {
                    rply.text = translate('admin.import_csv_read_failed', { message: error.message || error });
                    return rply;
                }
                try {
                    const patreonImport = require('../modules/patreon-import.js');
                    const result = await patreonImport.runImport(csvContent, { keyMode, generateEmail, locale });
                    const summary = result.summary || {};
                    let dmStatusText = translate('admin.import_dm_not_needed');
                    let emailStatusText = '';

                    if (Array.isArray(result.keyMessages) && result.keyMessages.length > 0) {
                        try {
                            if (!discordClient || !userid) {
                                throw new Error('Discord client unavailable');
                            }
                            const adminUser = await discordClient.users.fetch(userid);
                            const dmBody = [
                                translate('admin.import_dm_title'),
                                translate('admin.import_dm_mode', {
                                    mode: keyMode === 'newonly'
                                        ? translate('admin.import_mode_newonly')
                                        : translate('admin.import_mode_allkeys')
                                }),
                                '',
                                ...result.keyMessages
                            ].join('\n');
                            const chunks = dmBody.match(/[\s\S]{1,1800}/g) || [];
                            for (const chunk of chunks) {
                                await adminUser.send(chunk);
                            }
                            dmStatusText = translate('admin.import_dm_sent', { count: result.keyMessages.length });
                        } catch (error) {
                            dmStatusText = translate('admin.import_dm_failed', { message: error.message });
                        }
                    }

                    if (result.emailContent) {
                        try {
                            if (!discordClient || !userid) {
                                throw new Error('Discord client unavailable');
                            }
                            const adminUser = await discordClient.users.fetch(userid);
                            await adminUser.send({
                                content: translate('admin.import_email_title'),
                                files: [{
                                    attachment: Buffer.from(result.emailContent, 'utf8'),
                                    name: 'patreon_emails.txt'
                                }]
                            });
                            emailStatusText = translate('admin.import_email_sent');
                        } catch (error) {
                            emailStatusText = translate('admin.import_email_failed', { message: error.message });
                        }
                    }


                    const lines = [
                        translate('admin.import_summary_title'),
                        translate('admin.import_summary_added', { count: summary.added || 0 }),
                        translate('admin.import_summary_updated', { count: summary.updated || 0 }),
                        translate('admin.import_summary_off_former', { count: summary.offFormer || 0 }),
                        translate('admin.import_summary_off_not_active', { count: summary.offNotActive || 0 }),
                        translate('admin.import_summary_errors', { count: summary.errors || 0 }),
                        translate('admin.import_summary_active_total', { count: summary.activeTotal || 0 }),
                        translate('admin.import_summary_former_total', { count: summary.formerTotal || 0 }),
                        dmStatusText
                    ];
                    if (emailStatusText) lines.push(emailStatusText);
                    rply.text = lines.join('\n');
                } catch (error) {
                    console.error('[Admin] importpatreon error:', error);
                    rply.text = translate('admin.import_patreon_failed', { message: error.message });
                }
                return rply;
            }
            case /^decrypt$/i.test(mainMsg[1]):
                if (!mainMsg[2]) return rply;
                if (!password) return rply;
                rply.text = security.decryptWithCryptoSecret(mainMsg[2]);
                return rply;
            case /^send$/i.test(mainMsg[1]) && /^News$/i.test(mainMsg[2]): {
                let target = await schema.theNewsMessage.find({ botname: botname, switch: true });
                rply.sendNews = inputStr.replace(/\s?\S+\s+\S+\s+/, '');
                rply.target = target;
                return rply;
            }
            case /^fixshard$/i.test(mainMsg[1]): {
                const action = mainMsg[2]?.toLowerCase();

                if (!action) {
                    rply.text = translate('admin.fixshard_action_required');
                    return rply;
                }

                try {
                    switch (action) {
                        case 'check': {
                            const healthReport = await globalThis.checkShardHealth();
                            if (healthReport.error) {
                                rply.text = translate('admin.fixshard_check_failed', { message: healthReport.error });
                            } else {
                                rply.text = translate('admin.fixshard_check_report', {
                                    total_shards: healthReport.totalShards,
                                    healthy_shards: healthReport.healthyShards,
                                    unhealthy_shards: healthReport.unhealthyShards,
                                    unresponsive_block: healthReport.unresponsiveShards.length > 0
                                        ? translate('admin.fixshard_check_unresponsive', {
                                            shards: healthReport.unresponsiveShards.join(', ')
                                        })
                                        : translate('admin.fixshard_check_all_good')
                                });
                            }
                            break;
                        }
                        case 'start': {
                            const result = globalThis.startShardFix();
                            rply.text = result.inProgress ?
                                translate('admin.fixshard_start_success', {
                                    count: result.unresponsiveShards.length,
                                    shards: result.unresponsiveShards.join(', ')
                                }) :
                                result.message;
                            break;
                        }
                        case 'stop': {
                            const result = globalThis.stopShardFix();
                            rply.text = result.message;
                            break;
                        }
                        case 'status': {
                            const status = globalThis.getShardFixStatus();
                            rply.text = translate('admin.fixshard_status', {
                                in_progress: status.inProgress ? translate('admin.yes') : translate('admin.no'),
                                unresponsive_shards: status.totalUnresponsive > 0
                                    ? status.unresponsiveShards.join(', ')
                                    : translate('admin.none')
                            });
                            break;
                        }
                        default: {
                            rply.text = translate('admin.fixshard_invalid_action');
                        }
                    }
                } catch (error) {
                    console.error('[Admin] fixshard error:', error);
                    rply.text = translate('admin.fixshard_operation_failed', { message: error.message });
                }

                return rply;
            }
            default:
                rply.text = translate('admin.invalid_root_command');
                return rply;
        }
    }
    return rply;
}

function checkUserName(text) {
    // True means success
    return /^[A-Za-z0-9\u3000\u3400-\u4DBF\u4E00-\u9FFF]{4,16}$/.test(text);
}

async function checkGpAllow(target) {
    let doc;
    try {
        doc = await schema.allowRolling.findOne({
            "id": target
        })
    } catch (error) {
        console.error('Allowrolling ERROR:', error);

    }
    return doc;
}


function checkPassword(text) {
    //True 即成功
    return /^[A-Za-z0-9!@#$%^&*]{6,16}$/.test(text);
}

function parseAdminSecrets(rawAdminSecret) {
    if (!rawAdminSecret) return [];
    return rawAdminSecret
        .split(/[\s,;]+/)
        .map(secret => secret.trim())
        .filter(Boolean);
}

/**
 * Parse weekday token to cron dayOfWeek (0=Sunday … 6=Saturday).
 * Accepts: 0-6, sun/mon/…, sunday/…, 日/一/…/六, 星期日/週一…
 * @param {string} raw
 * @returns {number|null}
 */
function parseWeekday(raw) {
    if (raw == null) return null;
    const token = String(raw).trim().toLowerCase();
    if (/^[0-6]$/.test(token)) {
        return Number(token);
    }
    const map = {
        sun: 0, sunday: 0,
        mon: 1, monday: 1,
        tue: 2, tues: 2, tuesday: 2,
        wed: 3, wednesday: 3,
        thu: 4, thur: 4, thurs: 4, thursday: 4,
        fri: 5, friday: 5,
        sat: 6, saturday: 6,
        '日': 0, '星期日': 0, '週日': 0, '周日': 0,
        '一': 1, '星期一': 1, '週一': 1, '周一': 1,
        '二': 2, '星期二': 2, '週二': 2, '周二': 2,
        '三': 3, '星期三': 3, '週三': 3, '周三': 3,
        '四': 4, '星期四': 4, '週四': 4, '周四': 4,
        '五': 5, '星期五': 5, '週五': 5, '周五': 5,
        '六': 6, '星期六': 6, '週六': 6, '周六': 6
    };
    if (Object.prototype.hasOwnProperty.call(map, token)) {
        return map[token];
    }
    return null;
}

/**
 * Parse HH:MM or H:MM (24h).
 * @param {string} raw
 * @returns {{ hour: number, minute: number }|null}
 */
function parseClockTime(raw) {
    if (raw == null) return null;
    const match = String(raw).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
    return { hour, minute };
}

function formatClockTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * @param {(key: string, opts?: object) => string} translate
 * @returns {Promise<string>}
 */
async function formatRespawnScheduleStatus(translate) {
    if (!schema.discordRespawnSchedule) {
        return translate('admin.schedule_db_unavailable');
    }
    const doc = await schema.discordRespawnSchedule.findOne({ key: SCHEDULE_DOC_KEY }).lean();
    if (!doc || doc.dayOfWeek == null || doc.hour == null || doc.minute == null) {
        return translate('admin.schedule_show_empty', { timezone: AGENDA_TIMEZONE });
    }
    const cron = scheduleModule && typeof scheduleModule.buildCronExpression === 'function'
        ? scheduleModule.buildCronExpression({
            dayOfWeek: doc.dayOfWeek,
            hour: doc.hour,
            minute: doc.minute
        })
        : `${doc.minute} ${doc.hour} * * ${doc.dayOfWeek}`;
    return translate('admin.schedule_show', {
        enabled: doc.enabled
            ? translate('admin.schedule_status_on')
            : translate('admin.schedule_status_off'),
        weekday: translate(`admin.weekday_${doc.dayOfWeek}`),
        time: formatClockTime(doc.hour, doc.minute),
        timezone: AGENDA_TIMEZONE,
        cron
    });
}

/**
 * Generate a secure Patreon key: XXXX-XXXX-XXXX-XXXX (uppercase alphanumeric).
 * @returns {string}
 */
function generatePatreonKey() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const SEGMENT_LEN = 4;
    const SEGMENTS = 4;
    let out = '';
    const bytes = crypto.randomBytes(SEGMENT_LEN * SEGMENTS);
    for (let i = 0; i < bytes.length; i++) {
        out += CHARS[bytes[i] % CHARS.length];
    }
    const parts = [];
    for (let s = 0; s < SEGMENTS; s++) {
        parts.push(out.slice(s * SEGMENT_LEN, (s + 1) * SEGMENT_LEN));
    }
    return parts.join('-');
}

async function store(mainMsg, mode, translate = getT()) {
    const resultId = pattId.exec(mainMsg);
    const resultGP = pattGP.exec(mainMsg);
    const resultLv = pattLv.exec(mainMsg);
    const resultName = pattName.exec(mainMsg);
    const resultNotes = pattNotes.exec(mainMsg);
    const resultSwitch = pattSwitch.exec(mainMsg);
    let reply = {};
    
    // 檢查必要參數
    if (mode == 'id' && !resultId) {
        throw new Error(translate('admin.store_missing_user_id'));
    }
    if (mode == 'gp' && !resultGP) {
        throw new Error(translate('admin.store_missing_group_id'));
    }
    if (!resultLv) {
        throw new Error(translate('admin.store_missing_level'));
    }
    if (!resultName) {
        throw new Error(translate('admin.store_missing_name'));
    }

    // 設置基本參數
    if (mode == 'id') reply.id = resultId[1];
    if (mode == 'gp') reply.gpid = resultGP[1];
    reply.level = Number(resultLv[1]);
    reply.name = resultName[1];
    
    // 設置可選參數
    if (resultNotes) {
        // 確保備註不是下一個參數的標記
        const notesValue = resultNotes[1];
        if (!notesValue.startsWith('-')) {
            reply.notes = notesValue;
        }
    }
    
    // 設置開關狀態
    if (resultSwitch) {
        const switchValue = resultSwitch[1].toLowerCase();
        if (switchValue === 'false') {
            reply.switch = false;
        } else if (switchValue === 'true') {
            reply.switch = true;
        } else {
            reply.switch = true; // 預設值
        }
    } else {
        reply.switch = true; // 預設值
    }
    
    return reply;
}



module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand,
    generatePatreonKey
};
/**


  case /^fixEXP$/i.test(mainMsg[1]): {
            if (!adminSecret||userid !== adminSecret){
                rply.text ="ADMIN 才可以使用"
                return rply;
                }
            let doc = await schema.trpgLevelSystem.find({})
            for (let index = 0; index < doc.length; index++) {
                let docTRPG = await schema.trpgLevelSystem.findOne({
                    groupid: doc[index].groupid
                })
                docTRPG.HiddenV2 = (docTRPG.Hidden == "1") ? true : false;
                docTRPG.SwitchV2 = (docTRPG.Switch == "1") ? true : false;
                await docTRPG.save()
                docTRPG.trpgLevelSystemfunction.forEach(async element => {
                    let newLVMember = new schema.trpgLevelSystemMember({
                        groupid: doc[index].groupid,
                        userid: element.userid,
                        name: element.name,
                        EXP: element.EXP,
                        //現在經驗值
                        Level: Number(element.Level),
                        //等級
                        LastSpeakTime: element.LastSpeakTime
                    })

                    await newLVMember.save()
                });
            }
            // await doc.save()


            rply.text = doc.length + '項 DONE '
            return rply;
        }

 */