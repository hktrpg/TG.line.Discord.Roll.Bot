"use strict";
let variables = {};
const opt = {
    upsert: true,
    runValidators: true
}
const salt = process.env.SALT;
const crypto = require('crypto');
const password = process.env.CRYPTO_SECRET,
    algorithm = 'aes-256-ctr';
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
const { SlashCommandBuilder } = require('discord.js');
//const VIP = require('../modules/veryImportantPerson');
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
│ 除錯功能:
│ 　• .admin debug
│ 　  - 取得群組詳細資料
│ 　  - 顯示設定狀態
│
│ 資料庫狀態:
│ 　• .admin mongod
│ 　  - 檢視MongoDB連接狀態
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
│ 指令註冊:
│ 　• .root registeredGlobal
│ 　  - 註冊全局指令
│ 　• .root testRegistered [ID]
│ 　  - 測試指令註冊狀態
│
│ 加密功能:
│ 　• .root decrypt [加密文字]
│ 　  - 解密文字
│
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
            // 系統監控
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
                    .setName('mongod')
                    .setDescription('檢視MongoDB連接狀態'))
            // 帳號管理
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
            // 更新通知
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
            
            // 系統監控
            if (subcommand === 'state') {
                return '.admin state';
            } else if (subcommand === 'debug') {
                return '.admin debug';
            } else if (subcommand === 'mongod') {
                return '.admin mongod';
            }
            
            // 帳號管理
            else if (subcommand === 'account') {
                const username = interaction.options.getString('username');
                const password = interaction.options.getString('password');
                return `.admin account ${username} ${password}`;
            } else if (subcommand === 'registerchannel') {
                return '.admin registerChannel';
            } else if (subcommand === 'unregisterchannel') {
                return '.admin unregisterChannel';
            } else if (subcommand === 'allowrolling') {
                return '.admin allowrolling';
            } else if (subcommand === 'disallowrolling') {
                return '.admin disallowrolling';
            }
            
            // 更新通知
            else if (subcommand === 'news') {
                const status = interaction.options.getString('status');
                return `.admin news ${status}`;
            }
            
            return '無效的指令';
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('root')
            .setDescription('【🔐系統管理員專用】')
            // 系統重啟
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
            // VIP管理
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
            // 指令註冊
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
            // 加密功能
            .addSubcommand(subcommand =>
                subcommand
                    .setName('decrypt')
                    .setDescription('解密文字')
                    .addStringOption(option =>
                        option.setName('text')
                            .setDescription('加密文字')
                            .setRequired(true)))
            // 發送通知
            .addSubcommand(subcommand =>
                subcommand
                    .setName('sendnews')
                    .setDescription('發送更新通知')
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('通知訊息')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            // 系統重啟
            if (subcommand === 'respawn') {
                const id = interaction.options.getString('id');
                return `.root respawn ${id}`;
            } else if (subcommand === 'respawnall') {
                return '.root respawnall';
            }
            
            // VIP管理
            else if (subcommand === 'addvipgroup') {
                const id = interaction.options.getString('id');
                const level = interaction.options.getInteger('level');
                const name = interaction.options.getString('name');
                const notes = interaction.options.getString('notes') || '';
                const switch_ = interaction.options.getBoolean('switch') ?? true;
                return `.root addVipGroup -i ${id} -l ${level} -n ${name} -no ${notes} -s ${switch_}`;
            } else if (subcommand === 'addvipuser') {
                const id = interaction.options.getString('id');
                const level = interaction.options.getInteger('level');
                const name = interaction.options.getString('name');
                const notes = interaction.options.getString('notes') || '';
                const switch_ = interaction.options.getBoolean('switch') ?? true;
                return `.root addVipUser -i ${id} -l ${level} -n ${name} -no ${notes} -s ${switch_}`;
            }
            
            // 指令註冊
            else if (subcommand === 'registeredglobal') {
                return '.root registeredGlobal';
            } else if (subcommand === 'testregistered') {
                const id = interaction.options.getString('id');
                const targetId = id || interaction.guildId;
                if (!targetId) {
                    return '錯誤：未提供ID且無法獲取當前群組ID';
                }
                return `.root testRegistered ${targetId}`;
            }
            
            // 加密功能
            else if (subcommand === 'decrypt') {
                const text = interaction.options.getString('text');
                return `.root decrypt ${text}`;
            }
            
            // 發送通知
            else if (subcommand === 'sendnews') {
                const message = interaction.options.getString('message');
                return `.root send News ${message}`;
            }
            
            return '無效的指令';
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
    discordClient
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

    // 檢查是否為管理員命令
    const isAdminCommand = /^[.]admin$/i.test(mainMsg[0]);
    const isRootCommand = /^[.]root$/i.test(mainMsg[0]);

    // 如果是root命令，檢查權限
    if (isRootCommand) {
        if (!adminSecret || userid !== adminSecret) {
            rply.text = "此命令僅限系統管理員使用";
            return rply;
        }
    }

    // 根據命令類型處理不同的功能
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
                rply.text = 'Debug encrypt Data: \n' + encrypt(rply.text);
                return rply;
            case /^mongod$/i.test(mainMsg[1]):
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                let mongod = await schema.mongodbState();
                rply.text = JSON.stringify(mongod.connections);
                rply.quotes = true;
                return rply;
            case /^registerChannel$/i.test(mainMsg[1]):
                if (rply.text = checkTools.permissionErrMsg({
                    flag: checkTools.flag.ChkChannel,
                    gid: groupid
                })) {
                    return rply;
                }
                try {
                    temp = await schema.accountPW.findOne({
                        "id": userid
                    });
                } catch (e) {
                    console.error('registerChannel ERROR:', e);
                    rply.text += JSON.stringify(e);
                    return rply;
                }
                try {
                    temp2 = await schema.accountPW.findOne({
                        "id": userid,
                        "channel.id": channelid || groupid
                    });
                } catch (e) {
                    console.error('registerChannel ERROR:', e);
                    rply.text += JSON.stringify(e);
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
                    await temp.save().catch(error => console.error('admin #138 mongoDB error: ', error.name, error.reason));
                    rply.text = "註冊成功。如果想使用角色卡，請到\nhttps://card.hktrpg.com/";
                    if (!await checkGpAllow(channelid || groupid)) {
                        rply.text += '\n此頻道並未被Admin允許經網頁擲骰，請Admin在此頻道輸入\n.admin  allowrolling';
                    }
                    return rply;
                }
                return rply;
            case /^unregisterChannel$/i.test(mainMsg[1]):
                if (rply.text = checkTools.permissionErrMsg({
                    flag: checkTools.flag.ChkChannel,
                    gid: groupid
                })) {
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
                } catch (e) {
                    console.error('unregisterChannel ERROR:', e);
                    rply.text += JSON.stringify(e);
                    return rply;
                }
                rply.text = "已移除註冊!如果想檢查，請到\nhttps://card.hktrpg.com/"
                return rply;
            case /^disallowrolling$/i.test(mainMsg[1]):
                if (rply.text = checkTools.permissionErrMsg({
                    flag: checkTools.flag.ChkChannelAdmin,
                    gid: groupid,
                    role: userrole
                })) {
                    return rply;
                }
                try {
                    doc = await schema.allowRolling.findOneAndRemove({
                        "id": channelid || groupid
                    });
                } catch (e) {
                    console.error('disAllowrolling ERROR:', e);
                    rply.text += JSON.stringify(e);
                    return rply;
                }
                rply.text = "此頻道已被Admin取消使用網頁版角色卡擲骰的權限。\n如Admin希望允許網頁擲骰，可輸入\n.admin allowrolling";
                return rply;
            case /^allowrolling$/i.test(mainMsg[1]):
                if (rply.text = checkTools.permissionErrMsg({
                    flag: checkTools.flag.ChkChannelAdmin,
                    gid: groupid,
                    role: userrole
                })) {
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
                        returnNewDocument: true
                    });
                } catch (e) {
                    console.error('Allowrolling ERROR:', e);
                    rply.text += JSON.stringify(e);
                    return rply;
                }
                rply.text = "此頻道已被Admin允許使用網頁版角色卡擲骰，希望經網頁擲骰的玩家可在此頻道輸入以下指令登記。\n.admin registerChannel\n\n如Admin希望取消本頻道的網頁擲骰許可，可輸入\n.admin disallowrolling";
                return rply;
            case /^account$/i.test(mainMsg[1]):
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
                hash = crypto.createHmac('sha256', mainMsg[3])
                    .update(salt)
                    .digest('hex');
                try {
                    temp = await schema.accountPW.findOne({
                        "userName": name
                    });
                } catch (e) {
                    console.error('ACCOUNT ERROR:', e);
                    rply.text += JSON.stringify(e);
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
                        returnNewDocument: true
                    });
                } catch (e) {
                    console.error('ACCOUNT ERROR:', e);
                    rply.text += JSON.stringify(e);
                    return rply;
                }
                rply.text += "現在你的帳號是: " + name + "\n" + "密碼: " + mainMsg[3];
                rply.text += "\n登入位置: https://card.hktrpg.com/ \n如想經網頁擲骰，可以請Admin在頻道中輸入\n.admin  allowrolling\n然後希望擲骰玩家可在該頻道輸入以下指令登記。\n.admin registerChannel";
                return rply;
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
                    console.error('新增VIP GET ERROR: ', error)
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
                    console.error('新增VIP GET ERROR: ', error)
                    rply.text = '更新失敗\n因為 ' + error.message
                }
                return rply;
            default:
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
            case /^testRegistered$/i.test(mainMsg[1]):
                const targetId = mainMsg[2] || groupid;
                if (!targetId) {
                    rply.text = "錯誤：未提供ID且無法獲取當前群組ID";
                    return rply;
                }
                rply.text = await deploy.testRegisteredSlashCommands(targetId);
                return rply;
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
                        console.error('新增VIP群組錯誤: ', error);
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
                        console.error('新增VIP用戶錯誤: ', error);
                        rply.text = '新增VIP用戶失敗\n原因: ' + error.message;
                    }
                } catch (error) {
                    rply.text = error.message;
                }
                return rply;
            case /^decrypt$/i.test(mainMsg[1]):
                if (!mainMsg[2]) return rply;
                if (!password) return rply;
                rply.text = decrypt(mainMsg[2]);
                return rply;
            case /^send$/i.test(mainMsg[1]) && /^News$/i.test(mainMsg[2]):
                let target = await schema.theNewsMessage.find({ botname: botname, switch: true });
                rply.sendNews = inputStr.replace(/\s?\S+\s+\S+\s+/, '');
                rply.target = target;
                return rply;
            default:
                rply.text = "無效的系統管理員指令";
                return rply;
        }
    }
    return rply;
}

function checkUserName(text) {
    //True 即成功
    return /^[A-Za-z0-9\u3000\u3400-\u4DBF\u4E00-\u9FFF]{4,16}$/.test(text);
}

async function checkGpAllow(target) {
    let doc;
    try {
        doc = await schema.allowRolling.findOne({
            "id": target
        })
    } catch (e) {
        console.error('Allowrolling ERROR:', e);

    }
    return doc;
}


function checkPassword(text) {
    //True 即成功
    return /^[A-Za-z0-9!@#$%^&*]{6,16}$/.test(text);
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



function encrypt(text) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(password, 'utf-8'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}



function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(password, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand
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