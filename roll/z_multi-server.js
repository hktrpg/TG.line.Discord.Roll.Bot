"use strict";

const { SlashCommandBuilder } = require('discord.js');

const HELP = '【同步聊天 / Chatroom】\n'
    + '請使用 /chatroom 設定；舊 .chatroom 設定不會自動恢復。\n'
    + 'invite → 另一伺服器 join → 來源端 confirm，雙方管理員確認後才會轉送新文字。\n'
    + 'status 查看範圍；pause 暫停；disconnect 解除；translate 選擇語言或 off。\n'
    + 'optout 全域停止處理自己的新訊息；optin 恢復。\n'
    + '翻譯啟用時文字會經免 key 套件送到 Google 翻譯網頁介面（非官方 Cloud API）。既有 Discord 副本不會因停止而自動消失。\n'
    + 'Use /chatroom. Invite, join in the other server, then confirm at the source. '
    + 'New text only; no history or attachments. Optional translation uses Google Translate via a keyless third-party library.';

const command = new SlashCommandBuilder()
    .setName('chatroom')
    .setDescription('跨伺服器聊天、即時翻譯及退出設定 / Chatroom and translation');
for (const [name, description] of [
    ['invite', '管理員：建立十分鐘連結邀請 / Create invitation'],
    ['confirm', '管理員：核對目的地並確認／恢復互通 / Approve destination'],
    ['pause', '管理員：暫停雙向互通 / Pause bridge'],
    ['disconnect', '管理員：解除連結或取消邀請 / Disconnect'],
    ['status', '查看連結、翻譯及資料處理範圍 / Inspect settings'],
    ['optout', '停止處理自己的新訊息，適用所有頻道 / Exclude my messages'],
    ['optin', '允許在已啟用頻道處理自己的新訊息 / Include my messages']
]) command.addSubcommand(sub => sub.setName(name).setDescription(description));
command.addSubcommand(sub => sub.setName('join')
    .setDescription('管理員：同意連結邀請 / Accept invitation')
    .addStringOption(option => option.setName('code').setDescription('邀請碼 / Invitation code').setRequired(true)));
command.addSubcommand(sub => sub.setName('translate')
    .setDescription('管理員：啟用／關閉本頻道自動翻譯 / Set incoming translation')
    .addStringOption(option => option.setName('language').setDescription('目標語言或關閉 / Language or off')
        .setRequired(true).addChoices(
            { name: '關閉 / Off', value: 'off' },
            { name: '繁體中文', value: 'zh-TW' },
            { name: 'English', value: 'en' },
            { name: '日本語', value: 'ja' })));

module.exports = {
    gameName: () => '【同步聊天 / Chatroom】',
    gameType: () => 'Tool:chatroom:hktrpg',
    prefixs: () => [{ first: /^\.chatroom$/i, second: null }],
    initialize: () => ({}),
    getHelpMessage: () => HELP,
    async rollDiceCommand(params) {
        // Old Worker clients receive help; no settings are mutated remotely.
        if (process.env.ROLL_WORKER_MODE === 'true' && !params.discordClient
            && !params.chatroomChannelMeta && /^(?:create|join|exit)$/i.test(params.mainMsg?.[1] || '')) {
            return { needsLocal: true, moduleName: 'z_multi-server' };
        }
        return { default: 'on', type: 'text', text: HELP, quotes: true };
    },
    discordCommand: [{ data: command, async execute() { return '.chatroom help'; } }]
};
