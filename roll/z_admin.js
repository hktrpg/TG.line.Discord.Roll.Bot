"use strict";
let variables = {};
const opt = {
    upsert: true,
    runValidators: true
}
// const salt = process.env.SALT; // No longer needed with new security module
const crypto = require('crypto');
const { SlashCommandBuilder } = require('discord.js');
const security = require('../utils/security.js');
// CRYPTO_SECRET is used via security.encryptWithCryptoSecret / decryptWithCryptoSecret
let password = security.getCryptoSecretKey && security.getCryptoSecretKey();
if (!password) {
    console.error('[Admin] ❌ CRYPTO_SECRET environment variable is not set');
}
//32bit ASCII
const adminSecret = process.env.ADMIN_SECRET;
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
const gameName = function () {
    return '【Admin Tool】.admin debug state account news on'
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
const getHelpMessage = async function () {
    return `【⚙️管理員工具箱】
╭────── 🔍系統監控 ──────
│ 狀態查詢:
│ 　• .admin state
│ 　  - 檢視Rollbot運行狀態
│ 　  - 顯示系統資源使用
│
│ ID查詢:
│ 　• .admin id 或 .patreon id
│ 　  - 自動顯示你的用戶ID
│ 　  - 自動顯示當前群組ID
│ 　  - 所有平台皆可使用
│
│ Patreon / VIP 等級:
│ 　• .patreon level
│ 　  - 查詢自己與當前群組的 VIP（Patreon）等級
│
│ 除錯功能:
│ 　• .admin debug
│ 　  - 取得群組詳細資料
│ 　  - 顯示設定狀態
│
│ 資料庫狀態:
│ 　• .admin mongod
│ 　  - 檢視MongoDB連接狀態
│
│ 系統保護狀態:
│ 　• .admin clusterhealth
│ 　  - 檢視數據庫與分流保護層狀態
│ 　  - 顯示降級模式與集群健康統計
│
├────── 👤帳號管理 ──────
│ 網頁版角色卡設定:
│ 　• .admin account [使用者名稱] [密碼]
│
│ 使用者名稱規則:
│ 　• 長度: 4-16字元
│ 　• 允許: 中文、英文
│
│ 密碼規則:
│ 　• 長度: 6-16字元
│ 　• 允許: 英文字母
│ 　• 特殊符號: !@#$%^&*
│ 
│ 需要與HKTRPG獨立聊天設定，
│ 禁止在群組中使用
│
│ 頻道註冊:
│ 　• .admin registerChannel
│ 　  - 註冊當前頻道
│ 　• .admin unregisterChannel
│ 　  - 取消註冊當前頻道
│
│ 擲骰權限:
│ 　• .admin allowrolling
│ 　  - 允許頻道使用網頁擲骰
│ 　• .admin disallowrolling
│ 　  - 取消頻道網頁擲骰權限
│
├────── 📢更新通知 ──────
│ 開啟通知:
│ 　• .admin news on
│ 　  接收HKTRPG更新資訊
│
│ 關閉通知:
│ 　• .admin news off
│ 　  停止接收更新資訊
│
├────── 🔐系統管理員專用 ──────
│ 系統重啟:
│ 　• .root respawn [ID]
│ 　  - 重啟指定ID的服務
│ 　• .root respawnall
│ 　  - 重啟所有服務
│
│ VIP管理:
│ 　• .root addVipGroup -i ID -l LV -n NAME -no NOTES -s SWITCH
│ 　  - 新增VIP群組
│ 　• .root addVipUser -i ID -l LV -n NAME -no NOTES -s SWITCH
│ 　  - 新增VIP用戶
│
│ Patreon 會員:
│ 　• .root addpatreon PATREON_NAME tier=A|B|C|D|E|F [-no NOTES] [-s on|off]
│ 　  - 新增時產生 KEY；更新時只改 TIER/備註/狀態，KEY 不變
│ 　• .root regenkeypatreon PATREON_NAME
│ 　  - 重新產生 KEY，舊 KEY 即時失效
│ 　• .root onpatreon PATREON_NAME
│ 　  - 開啟該會員狀態
│ 　• .root offpatreon PATREON_NAME
│ 　  - 關閉該會員狀態 (並收回其已分配的 VIP)
│ 　• .root importpatreon [allkeys|newonly] [-email]
│ 　  - 上傳 .csv 自動同步會員。allkeys=全KEY，newonly=新KEY。-email=產生電郵內容檔
│
│ 指令註冊:
│ 　• .root registeredGlobal
│ 　  - 註冊全局指令
│ 　• .root testRegistered [ID]
│ 　  - 測試指令註冊狀態
│ 　• .root removeSlashCommands [ID]
│ 　  - 移除指定群組的 Slash 指令（未給 ID 則使用目前群組）
│
│ 加密功能:
│ 　• .root decrypt [加密文字]
│ 　  - 解密文字
│
│ Shard 修復:
│ 　• .root fixshard check
│ 　  - 檢查所有 shard 狀態
│ 　• .root fixshard start
│ 　  - 開始自動修復 unresponsive shards
│ 　• .root fixshard stop
│ 　  - 停止自動修復
│ 　• .root fixshard status
│ 　  - 查看修復狀態

│ 發送通知:
│ 　• .root send News [訊息]
│ 　  - 發送更新通知
╰──────────────`
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
            
            return '無效的指令';
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
            const subcommand = interaction.options.getSubcommand();
            
            // System restart
            switch (subcommand) {
            case 'respawn': {
                const id = interaction.options.getString('id');
                return `.root respawn ${id}`;
            }
            case 'respawnall': {
                return '.root respawnall';
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
                    return '錯誤：未提供ID且無法獲取當前群組ID';
                }
                return `.root testRegistered ${targetId}`;
            }
            case 'removeslashcommands': {
                const id = interaction.options.getString('id');
                const targetId = id || interaction.guildId;
                if (!targetId) {
                    return '錯誤：未提供ID且無法獲取當前群組ID';
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
                    return '請上傳 .csv 附件（Patreon 匯出格式）';
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
            
            return '無效的指令';
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
    discordMessage
}) {
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
        if (!adminSecret || userid !== adminSecret) {
            rply.text = "此命令僅限系統管理員使用";
            return rply;
        }
    }

    // Handle different functions based on command type
    if (isAdminCommand) {
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = await this.getHelpMessage();
                rply.quotes = true;
                return rply;
            case /^state$/i.test(mainMsg[1]):
                rply.state = true;
                rply.quotes = true;
                return rply;
            case /^debug$/i.test(mainMsg[1]):
                rply.text = "Debug function" + '\ngroupid: ' + groupid + "\nuserid: " + userid;
                rply.text += '\nchannelid: ' + channelid;
                rply.text += (userrole) ? '\nuserrole: ' + userrole : '';
                rply.text += (botname) ? '\nbotname: ' + botname : '';
                rply.text += (displayname) ? '\ndisplayname: ' + displayname : '';
                rply.text += (displaynameDiscord) ? '\ndisplaynameDiscord: ' + displaynameDiscord : '';
                rply.text += (membercount) ? '\nmembercount: ' + membercount : '';
                if (!password) return rply;
                rply.text = 'Debug encrypt Data: \n' + security.encryptWithCryptoSecret(rply.text);
                return rply;
            case /^id$/i.test(mainMsg[1]): {
                const currentUserId = userid || 'N/A';
                const currentGroupId = groupid || '（目前為私訊，無群組ID）';
                const currentChannelId = channelid || 'N/A';
                rply.text = [
                    '【ID 查詢】',
                    `用戶ID: ${currentUserId}`,
                    `群組ID: ${currentGroupId}`,
                    `頻道ID: ${currentChannelId}`,
                    '',
                    'Patreon 管理頁:',
                    'https://patreon.hktrpg.com',
                    '（以上 ID 可用於 Patreon 管理頁的名額分配設定）'
                ].join('\n');
                return rply;
            }
            case /^mongod$/i.test(mainMsg[1]): {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                let mongod = await schema.mongodbStateCheck();
                rply.text = JSON.stringify(mongod ? mongod.connections : 'Connection check failed');
                rply.quotes = true;
                return rply;
            }
            case /^clusterhealth$/i.test(mainMsg[1]): {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                try {
                    // Import the health report function from discord_bot.js
                    const healthReport = globalThis.getClusterHealthReport();
                    const dbStatus = dbProtectionLayer.getStatusReport();
                    const clusterProtectionStatus = clusterProtection.getStatusReport();

                    rply.text = '🔍 **System Protection Status**\n\n' +
                        `🛡️ **Database Protection Layer:**\n` +
                        `• Mode: ${dbStatus.isDegradedMode ? '🔴 DEGRADED' : '🟢 NORMAL'}\n` +
                        `• Connection State: ${dbStatus.dbConnectionState === 1 ? '✅ Connected' : '❌ Disconnected'}\n` +
                        `• Consecutive Failures: ${dbStatus.consecutiveFailures}\n` +
                        `• Cache Size: ${dbStatus.cacheSize} items\n` +
                        `• Pending Sync: ${dbStatus.pendingSyncOperations} operations\n\n` +
                        `📊 **Cluster Protection Layer:**\n` +
                        `• Unhealthy Clusters: ${clusterProtectionStatus.unhealthyCount}\n` +
                        `• Health Timeout: ${clusterProtectionStatus.healthTimeout / 1000}s\n` +
                        `• Max Retries: ${clusterProtectionStatus.maxRetries}\n\n` +
                        `📋 **Cluster Health Report:**\n` +
                        `• Total Clusters: ${healthReport.summary.totalClusters}\n` +
                        `• Active Clusters: ${healthReport.summary.activeClusters}\n` +
                        `• Ready Clusters: ${healthReport.summary.readyClusters}\n` +
                        `• Dead Clusters: ${healthReport.summary.deadClusters}\n` +
                        `• Total Shards: ${healthReport.summary.totalShards}\n\n` +
                        `🔧 **Process Info:**\n` +
                        `• PID: ${healthReport.processInfo.pid}\n` +
                        `• Uptime: ${Math.floor(healthReport.processInfo.uptime / 3600)}h ${Math.floor((healthReport.processInfo.uptime % 3600) / 60)}m\n` +
                        `• Memory: ${healthReport.processInfo.memoryMB}MB\n\n` +
                        `📋 **Cluster Details:**\n` +
                        healthReport.clusters.map(c =>
                            `• Cluster ${c.id}: ${c.ready ? '✅' : '❌'} ${c.alive ? '🟢' : '🔴'} (${c.shards} shards, ${c.uptime}s uptime)`
                        ).join('\n');
                    rply.quotes = true;
                } catch (error) {
                    rply.text = `❌ System protection status check failed: ${error.message}`;
                }
                return rply;
            }
            case /^registerChannel$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({
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
                    rply.text = "已註冊這頻道。如果想使用角色卡，請到\nhttps://card.hktrpg.com/";
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += '\n此頻道並未被Admin允許經網頁擲骰，請Admin先在此頻道輸入\n.admin  allowrolling進行授權。';
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
                    rply.text = "註冊成功，如果想使用角色卡，請到\nhttps://card.hktrpg.com/"
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += '\n此頻道並未被Admin允許經網頁擲骰，請Admin在此頻道輸入\n.admin  allowrolling';
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
                    rply.text = "註冊成功。如果想使用角色卡，請到\nhttps://card.hktrpg.com/";
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += '\n此頻道並未被Admin允許經網頁擲骰，請Admin在此頻道輸入\n.admin  allowrolling';
                    }
                    return rply;
                }
                return rply;
            case /^unregisterChannel$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({
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
                rply.text = "已移除註冊!如果想檢查，請到\nhttps://card.hktrpg.com/"
                return rply;
            case /^disallowrolling$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({
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
                rply.text = "此頻道已被Admin取消使用網頁版角色卡擲骰的權限。\n如Admin希望允許網頁擲骰，可輸入\n.admin allowrolling";
                return rply;
            case /^allowrolling$/i.test(mainMsg[1]):
                rply.text = checkTools.permissionErrMsg({
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
                rply.text = "此頻道已被Admin允許使用網頁版角色卡擲骰，希望經網頁擲骰的玩家可在此頻道輸入以下指令登記。\n.admin registerChannel\n\n如Admin希望取消本頻道的網頁擲骰許可，可輸入\n.admin disallowrolling";
                return rply;
            case /^account$/i.test(mainMsg[1]): {
                if (groupid) {
                    rply.text = "設定帳號時，請直接和HKTRPG對話，禁止在群組中使用";
                    return rply;
                }
                if (!mainMsg[2]) {
                    rply.text = "請設定使用者名稱，4-16字，中英文限定，大小階相同";
                    return rply;
                }
                if (!mainMsg[3]) {
                    rply.text = "請設定密碼，6-16字，英文及以下符號限定!@#$%^&*";
                    return rply;
                }
                name = mainMsg[2].toLowerCase();
                if (!checkUserName(name)) {
                    rply.text = "使用者名稱，4-16字，中英文限定，大小階相同";
                    return rply;
                }
                if (!checkPassword(mainMsg[3])) {
                    rply.text = "使用者密碼，6-16字，英文及以下符號限定!@#$%^&*";
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
                    rply.text += "重覆用戶名稱"
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
                rply.text += "現在你的帳號是: " + name + "\n" + "密碼: " + mainMsg[3];
                rply.text += "\n登入位置: https://card.hktrpg.com/ \n如想經網頁擲骰，可以請Admin在頻道中輸入\n.admin  allowrolling\n然後希望擲骰玩家可在該頻道輸入以下指令登記。\n.admin registerChannel";
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
                        rply.text = "更新成功\n你已開啓更新通知功能";
                    }
                } catch (error) {
                    console.error('[Admin] Add VIP error:', error)
                    rply.text = '更新失敗\n因為 ' + error.message
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
                        rply.text = "更新成功\n你已關閉更新通知功能";
                    }
                } catch (error) {
                    console.error('[Admin] Add VIP error:', error)
                    rply.text = '更新失敗\n因為 ' + error.message
                }
                return rply;
            default:
                return rply;
        }
    } else if (isPatreonCommand) {
        switch (true) {
            case /^id$/i.test(mainMsg[1]): {
                const currentUserId = userid || 'N/A';
                const currentGroupId = groupid || '（目前為私訊，無群組ID）';
                const currentChannelId = channelid || 'N/A';
                rply.text = [
                    '【ID 查詢】',
                    `用戶ID: ${currentUserId}`,
                    `群組ID: ${currentGroupId}`,
                    `頻道ID: ${currentChannelId}`,
                    '',
                    'Patreon 管理頁:',
                    'https://patreon.hktrpg.com',
                    '（以上 ID 可用於 Patreon 管理頁的名額分配設定）'
                ].join('\n');
                return rply;
            }
            case /^level$/i.test(mainMsg[1]): {
                const userLevel = await viplevelCheckUser(userid);
                const groupLevel = await viplevelCheckGroup(groupid || '');
                const userLabel = patreonTiers.getTierLabel(userLevel) || (userLevel ? `Level ${userLevel}` : '無');
                const groupLabel = patreonTiers.getTierLabel(groupLevel) || (groupLevel ? `Level ${groupLevel}` : '無');
                rply.text = [
                    '【Patreon / VIP 等級】',
                    `你的 VIP 等級: ${userLevel} (${userLabel})`,
                    `本群組 VIP 等級: ${groupLevel} (${groupLabel})`,
                    '',
                    'Patreon 管理頁: https://patreon.hktrpg.com'
                ].join('\n');
                return rply;
            }
            default:
                rply.text = '可用指令：.patreon id（查 ID）、.patreon level（查自己與群組 VIP 等級）';
                return rply;
        }
    } else if (isRootCommand) {
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = await this.getHelpMessage();
                rply.quotes = true;
                return rply;
            case /^registeredGlobal$/i.test(mainMsg[1]):
                rply.text = await deploy.registeredGlobalSlashCommands();
                return rply;
            case /^testRegistered$/i.test(mainMsg[1]): {
                const targetId = mainMsg[2] || groupid;
                if (!targetId) {
                    rply.text = "錯誤：未提供ID且無法獲取當前群組ID";
                    return rply;
                }
                rply.text = await deploy.testRegisteredSlashCommands(targetId);
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
                    rply.text = "錯誤：未提供ID且無法獲取當前群組ID";
                    return rply;
                }
                try {
                    const resultMsg = await deploy.removeSlashCommands(targetId);
                    console.log('[Admin] removeSlashCommands result', { targetId, resultMsg });
                    rply.text = resultMsg || `已發送請求，移除群組 ${targetId} 的 Slash 指令`;
                } catch (error) {
                    console.error('[Admin] removeSlashCommands error:', error);
                    rply.text = `移除 Slash 指令失敗：${error.message}`;
                }
                return rply;
            }
            case /^respawn$/i.test(mainMsg[1]):
                if (mainMsg[2] === null) return rply;
                discordClient.cluster.send({ respawn: true, id: mainMsg[2] });
                return rply;
            case /^respawnall$/i.test(mainMsg[1]):
                discordClient.cluster.send({ respawnall: true });
                return rply;
            case /^addVipGroup$/i.test(mainMsg[1]):
                try {
                    filter = await store(inputStr, 'gp');
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
                            rply.text = `成功更新VIP群組：\n群組ID: ${filter.gpid}\n等級: ${filter.level}\n名稱: ${filter.name}\n備註: ${filter.notes || '無'}\n狀態: ${filter.switch ? '開啟' : '關閉'}`;
                        } else {
                            rply.text = "更新失敗：未找到指定的群組";
                        }
                    } catch (error) {
                        console.error('[Admin] Add VIP group error:', error);
                        rply.text = '新增VIP群組失敗\n原因: ' + error.message;
                    }
                } catch (error) {
                    rply.text = error.message;
                }
                return rply;
            case /^addVipUser$/i.test(mainMsg[1]):
                try {
                    filter = await store(inputStr, 'id');
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
                            rply.text = `成功更新VIP用戶：\n用戶ID: ${filter.id}\n等級: ${filter.level}\n名稱: ${filter.name}\n備註: ${filter.notes || '無'}\n狀態: ${filter.switch ? '開啟' : '關閉'}`;
                        } else {
                            rply.text = "更新失敗：未找到指定的用戶";
                        }
                    } catch (error) {
                        console.error('[Admin] Add VIP user error:', error);
                        rply.text = '新增VIP用戶失敗\n原因: ' + error.message;
                    }
                } catch (error) {
                    rply.text = error.message;
                }
                return rply;
            case /^addpatreon$/i.test(mainMsg[1]): {
                const patreonName = mainMsg[2];
                if (!patreonName) {
                    rply.text = '請提供 Patreon 會員名稱，例: .root addpatreon userabc tier=A';
                    return rply;
                }
                const tierMatch = inputStr.match(/tier=([A-Fa-f])/i);
                const tierLetter = tierMatch ? tierMatch[1].toUpperCase() : null;
                const level = tierLetter ? patreonTiers.tierLetterToLevel(tierLetter) : null;
                if (level == null) {
                    rply.text = '請指定 tier=A|B|C|D|E|F，例: .root addpatreon userabc tier=A';
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
                        { upsert: true, new: true, runValidators: true }
                    );
                    if (!doc) {
                        rply.text = '新增 Patreon 會員失敗';
                        return rply;
                    }
                    const tierLabel = patreonTiers.getTierLabel(level);
                    rply.text = `已${existed ? '更新' : '新增'} Patreon 會員\n名稱: ${patreonName}\n等級: ${tierLabel}\n狀態: ${switchOn ? '開啟' : '關閉'}`;
                    if (!existed && newKeyPlain) {
                        rply.text += `\n\n🔑 KEY (請妥善交給該會員，勿留在頻道):\n${newKeyPlain}`;
                    }
                } catch (error) {
                    console.error('[Admin] addpatreon error:', error);
                    const MONGO_DUP_KEY = 11e3; // 11000 MongoDB duplicate key
                    const msg = String(error.message || '');
                    const isKeyNullDup = error.code === MONGO_DUP_KEY && (msg.includes('key') && msg.includes('null'));
                    rply.text = isKeyNullDup
                        ? 'addpatreon 失敗: 資料庫有舊的 key 唯一索引導致重複。請在 MongoDB 執行:\ndb.patreonmembers.dropIndex("key_1")\n然後再試一次。'
                        : 'addpatreon 失敗: ' + error.message;
                }
                return rply;
            }
            case /^regenkeypatreon$/i.test(mainMsg[1]): {
                const patreonNameRegen = mainMsg[2];
                if (!patreonNameRegen) {
                    rply.text = '請提供 Patreon 會員名稱，例: .root regenkeypatreon userabc';
                    return rply;
                }
                try {
                    doc = await schema.patreonMember.findOne({ patreonName: patreonNameRegen });
                    if (!doc) {
                        rply.text = '找不到該 Patreon 會員: ' + patreonNameRegen;
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
                    rply.text = `已為 ${patreonNameRegen} 重新產生 KEY。\n⚠️ 舊 KEY 已失效，無法再登入網站。\n\n🔑 新 KEY (請妥善交給該會員，勿留在頻道):\n${newKey}`;
                } catch (error) {
                    console.error('[Admin] regenkeypatreon error:', error);
                    rply.text = 'regenkeypatreon 失敗: ' + error.message;
                }
                return rply;
            }
            case /^onpatreon$/i.test(mainMsg[1]): {
                const patreonNameOn = mainMsg[2];
                if (!patreonNameOn) {
                    rply.text = '請提供 Patreon 會員名稱，例: .root onpatreon userabc';
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
                        { new: true }
                    );
                    if (!doc) {
                        rply.text = '找不到該 Patreon 會員: ' + patreonNameOn;
                        return rply;
                    }
                    await patreonSync.syncMemberSlotsToVip(doc);
                    rply.text = `已開啟 Patreon 會員: ${patreonNameOn}`;
                } catch (error) {
                    console.error('[Admin] onpatreon error:', error);
                    rply.text = 'onpatreon 失敗: ' + error.message;
                }
                return rply;
            }
            case /^offpatreon$/i.test(mainMsg[1]): {
                const patreonNameOff = mainMsg[2];
                if (!patreonNameOff) {
                    rply.text = '請提供 Patreon 會員名稱，例: .root offpatreon userabc';
                    return rply;
                }
                try {
                    doc = await schema.patreonMember.findOne({ patreonName: patreonNameOff });
                    if (!doc) {
                        rply.text = '找不到該 Patreon 會員: ' + patreonNameOff;
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
                    rply.text = `已關閉 Patreon 會員: ${patreonNameOff}，並已收回其分配的 VIP`;
                } catch (error) {
                    console.error('[Admin] offpatreon error:', error);
                    rply.text = 'offpatreon 失敗: ' + error.message;
                }
                return rply;
            }
            case /^importpatreon$/i.test(mainMsg[1]): {
                if (!discordMessage?.attachments?.size) {
                    rply.text = '請上傳一個 .csv 附件（僅接受 .csv 格式），例: .root importpatreon [allkeys|newonly] [-email] 並附上 CSV 檔案';
                    return rply;
                }
                const attachments = [...discordMessage.attachments.values()];
                const csvFiles = attachments.filter(a => (a.name || '').toLowerCase().endsWith('.csv'));
                if (csvFiles.length === 0) {
                    rply.text = '請上傳一個 .csv 附件（僅接受 .csv 格式）';
                    return rply;
                }
                if (csvFiles.length > 1) {
                    rply.text = '請只上傳一個 .csv 附件';
                    return rply;
                }
                const attachment = csvFiles[0];
                const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
                if ((attachment.size || 0) > MAX_CSV_SIZE_BYTES) {
                    rply.text = `CSV 附件不得超過 ${MAX_CSV_SIZE_BYTES / 1024 / 1024}MB`;
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
                    rply.text = '僅接受 CSV 或文字檔（Content-Type: text/csv, application/csv, application/vnd.ms-excel, text/plain）';
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
                    rply.text = '讀取附件失敗: ' + (error.message || error);
                    return rply;
                }
                try {
                    const patreonImport = require('../modules/patreon-import.js');
                    const result = await patreonImport.runImport(csvContent, { keyMode, generateEmail });
                    const summary = result.summary || {};
                    let dmStatusText = 'KEY 私訊：本次無需發送';
                    let emailStatusText = '';

                    if (Array.isArray(result.keyMessages) && result.keyMessages.length > 0) {
                        try {
                            if (!discordClient || !userid) {
                                throw new Error('Discord client unavailable');
                            }
                            const adminUser = await discordClient.users.fetch(userid);
                            const dmBody = [
                                '【Patreon CSV KEY 明細】',
                                `模式: ${keyMode === 'newonly' ? 'newonly (只新會員)' : 'allkeys (全部)'}`,
                                '',
                                ...result.keyMessages
                            ].join('\n');
                            const chunks = dmBody.match(/[\s\S]{1,1800}/g) || [];
                            for (const chunk of chunks) {
                                await adminUser.send(chunk);
                            }
                            dmStatusText = `KEY 私訊：已發送 ${result.keyMessages.length} 筆`;
                        } catch (error) {
                            dmStatusText = `KEY 私訊：失敗 (${error.message})`;
                        }
                    }

                    if (result.emailContent) {
                        try {
                            if (!discordClient || !userid) {
                                throw new Error('Discord client unavailable');
                            }
                            const adminUser = await discordClient.users.fetch(userid);
                            await adminUser.send({
                                content: '【Patreon Email 內容】',
                                files: [{
                                    attachment: Buffer.from(result.emailContent, 'utf8'),
                                    name: 'patreon_emails.txt'
                                }]
                            });
                            emailStatusText = 'Email 檔案：已發送';
                        } catch (error) {
                            emailStatusText = `Email 檔案：失敗 (${error.message})`;
                        }
                    }


                    const lines = [
                        '【Patreon CSV 匯入摘要】',
                        `新增: ${summary.added || 0}`,
                        `更新: ${summary.updated || 0}`,
                        `關閉(Former): ${summary.offFormer || 0}`,
                        `關閉(Not Active): ${summary.offNotActive || 0}`,
                        `錯誤: ${summary.errors || 0}`,
                        `Active Patron(本CSV): ${summary.activeTotal || 0}`,
                        `Former Patron(本CSV): ${summary.formerTotal || 0}`,
                        dmStatusText
                    ];
                    if (emailStatusText) lines.push(emailStatusText);
                    rply.text = lines.join('\n');
                } catch (error) {
                    console.error('[Admin] importpatreon error:', error);
                    rply.text = 'importpatreon 失敗: ' + error.message;
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
                    rply.text = '請指定動作：check, start, stop, status\n' +
                               '• check - 檢查所有 shard 狀態\n' +
                               '• start - 開始自動修復 unresponsive shards\n' +
                               '• stop - 停止自動修復\n' +
                               '• status - 查看修復狀態';
                    return rply;
                }

                try {
                    switch (action) {
                        case 'check': {
                            const healthReport = await globalThis.checkShardHealth();
                            if (healthReport.error) {
                                rply.text = `❌ 檢查失敗：${healthReport.error}`;
                            } else {
                                rply.text = `🔍 Shard 健康檢查報告\n` +
                                           `📊 總共：${healthReport.totalShards} 個 shards\n` +
                                           `✅ 正常：${healthReport.healthyShards} 個\n` +
                                           `❌ 異常：${healthReport.unhealthyShards} 個\n` +
                                           `${healthReport.unresponsiveShards.length > 0 ?
                                               `🚨 無回應：${healthReport.unresponsiveShards.join(', ')}\n` +
                                               `💡 使用 .root fixshard start 開始自動修復` :
                                               `🎉 所有 shards 都正常運作！`}`;
                            }
                            break;
                        }
                        case 'start': {
                            const result = globalThis.startShardFix();
                            rply.text = result.inProgress ?
                                `🔧 已開始自動修復 ${result.unresponsiveShards.length} 個無回應 shards\n` +
                                `⏱️ 每 20 秒處理一個 shard\n` +
                                `📝 無回應 shards：${result.unresponsiveShards.join(', ')}` :
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
                            rply.text = `📊 Shard 修復狀態\n` +
                                       `🔧 修復中：${status.inProgress ? '是' : '否'}\n` +
                                       `🚨 無回應 shards：${status.totalUnresponsive > 0 ?
                                           status.unresponsiveShards.join(', ') :
                                           '無'}`;
                            break;
                        }
                        default: {
                            rply.text = '無效的動作。請使用：check, start, stop, status';
                        }
                    }
                } catch (error) {
                    console.error('[Admin] fixshard error:', error);
                    rply.text = `❌ 操作失敗：${error.message}`;
                }

                return rply;
            }
            default:
                rply.text = "無效的系統管理員指令";
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

async function store(mainMsg, mode) {
    const resultId = pattId.exec(mainMsg);
    const resultGP = pattGP.exec(mainMsg);
    const resultLv = pattLv.exec(mainMsg);
    const resultName = pattName.exec(mainMsg);
    const resultNotes = pattNotes.exec(mainMsg);
    const resultSwitch = pattSwitch.exec(mainMsg);
    let reply = {};
    
    // 檢查必要參數
    if (mode == 'id' && !resultId) {
        throw new Error('缺少用戶ID (-i 參數)');
    }
    if (mode == 'gp' && !resultGP) {
        throw new Error('缺少群組ID (-g 參數)');
    }
    if (!resultLv) {
        throw new Error('缺少等級 (-l 參數)');
    }
    if (!resultName) {
        throw new Error('缺少名稱 (-n 參數)');
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