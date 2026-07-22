"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const checkMongodb = require('../modules/dbWatchdog.js');
const debugMode = (process.env.DEBUG) ? true : false;
let variables = {};
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const rollDice = require('./rollbase');
const FUNCTION_LIMIT = [4, 20, 20, 30, 30, 99, 99, 99];
const EN_RECOVER_TIME = 10 * 60 * 1000; //每10分鐘回複一點;
const gameName = function (params = {}) {
    return resolveGameName(params, 'event.game_name', '【事件功能】 .event (add edit show delete) .evt (event 任何名字)');
}
const gameType = function () {
    return 'Funny:trpgevent:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]event$)|(^[.]evt$)/ig,
        second: null
    }]

}

const convertRegex = function (str) {
    return str.replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`);
};
const regexMain = new RegExp(/^((-)?\d):(.*)/, 'igm');
const regexExp = new RegExp(/^exp:(.*)/, 'im');
const regexName = new RegExp(/^name:(.*)/, 'im');
const regexChainTitle = new RegExp(/^chain:(.*)/, 'im');

const opt = {
    upsert: true,
    runValidators: true
}
const ENemoji = function (per) {
    switch (true) {
        case (per <= 0):
            return '▯▯▯▯▯▯'
        case (per <= 20):
            return '▮▯▯▯▯▯'
        case (per <= 40):
            return '▮▮▯▯▯▯'
        case (per <= 60):
            return '▮▮▮▯▯▯'
        case (per <= 80):
            return '▮▮▮▮▯▯'
        case (per <= 99):
            return '▮▮▮▮▮▯'
        default:
            return '▮▮▮▮▮▮'
    }
}

/**
 * 
 * TODO:
 * 狀態包括HKTRPG 有特別效果, 如名字改變?動物EMOJI?
 * @!$%#&%$&^%亂碼ETC?
 * 
 * 
 */


const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'event.help');
}

const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    displayname,
    displaynameDiscord,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: '',
        characterReRoll: false,
        characterName: '',
        characterReRollName: '',
        qu: true
    };
    let filter = {};
    let doc = {};
    let events = {};
    let temp;
    let tempMain = {};
    let lv;
    let limit = FUNCTION_LIMIT[0];
    let check;
    let levelLv = 0;
    /**
     * .event
     * .event add 事件    新增事件
     * .event delete 事件  刪除事件
     * .event show  空白/ (事件名稱)
     * 空白顯示列表  
     * .evt 
     */
    /**
     * .event add 
     * name:神奇事件
     * exp:SAN
     * 0:你今天的運氣真好;你是個好人;我愛你
     * -1:你中招了:你不好運要-SAN了
     * 1:你吃了好味的糖，加SAN人
     */
    if (!checkMongodb.isDbOnline()) return;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
            events = await analysicInputData(inputStr); // Analyze input data

            if (!events || !events.MainData || !events.eventName) {
                rply.text = translate('event.no_input');
                return rply;
            }

            /*
            基本只限四次事件.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = Math.max(gpLv, lv);
            limit = FUNCTION_LIMIT[lv];
            check = await schema.eventList.find({
                userID: userid
            });
            levelLv = await findMaxLv(userid);

            // Get original data, if duplicate, overwrite with new
            //doc = await schema.event.findOne(filter);
            let mainSplit = await analysicDetail(events.MainData)
            if (mainSplit.length < 3 || mainSplit.length > Number(3 + levelLv)) {
                rply.text = translate('event.add_fail_min_results', { max: Number(3 + levelLv) });
                return rply;
            }
            // At least one is positive
            let positiveCheck = false;
            for (let index = 0; index < mainSplit.length; index++) {
                (Number(mainSplit[index].result) > 0) ? positiveCheck = true : null;
                levelLv += Number(mainSplit[index].result);
            }

            if (!positiveCheck) {
                rply.text = translate('event.add_fail_no_positive');
                return rply;
            }
            if (levelLv < 0) {
                rply.text = translate('event.add_fail_too_negative', { sum: levelLv });
                return rply;
            }

            let listDatas = {
                title: events.eventName,
                userID: userid,
                userName: displaynameDiscord || displayname || '',
                detail: mainSplit,
                expName: events.expName || '',
                chainTitle: events.eventChain || ''
            }


            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp('^' + convertRegex(events.eventName) + '$', "i")
                }
            }
            try {
                doc = await schema.eventList.updateOne(filter, listDatas, opt);
            } catch (error) {
                console.error('[Event] Add event error:', error)
                rply.text = translate('event.add_fail_error', { error: error.message });
                return rply;
            }
            if (!doc && check && check.length >= limit) {
                rply.text = translate('event.event_limit', { limit });
                return rply
            }
            tempMain = await schema.eventList.findOne(filter);

            let eventsDatas = {
                userID: userid,
                userName: displaynameDiscord || displayname || '',
                eventList: {
                    title: events.eventName,
                    eventID: tempMain._id
                }
            }
            if (!tempMain._id) {
                rply.text = translate('event.add_fail');
                return rply;
            }
            try {
                filter = {
                    userID: userid
                }
                temp = await schema.eventMember.findOne(filter);
                if (!temp) {
                    temp = new schema.eventMember(eventsDatas);
                } else {
                    let findEventId = temp.eventList.findIndex((obj => obj.eventID == tempMain._id));
                    if (findEventId >= 0) {
                        temp.eventList[findEventId] = {
                            title: events.eventName,
                            eventID: tempMain._id
                        }
                        temp.userName = displaynameDiscord || displayname || '';
                    } else {
                        temp.eventList.push({
                            title: events.eventName,
                            eventID: tempMain._id
                        })
                        temp.userName = displaynameDiscord || displayname || '';
                    }


                }
                await temp.save();

            } catch (error) {
                console.error('[Event] Add event error:', error)
                rply.text = translate('event.add_fail_error', { error: error.message });
                return rply;
            }
            // Add to database
            // Check for duplicates
            rply.text = translate('event.add_success_header', { title: tempMain.title, expName: tempMain.expName });
            rply.text += (tempMain.chainTitle) ? translate('event.chain_title', { chain: tempMain.chainTitle }) : '';
            for (let index = 0; index < tempMain.detail.length; index++) {
                rply.text += translate('event.detail_line', {
                    type: tempMain.detail[index].result,
                    content: tempMain.detail[index].event
                });
            }
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]) && /^\S+$/.test(mainMsg[2]): {
            filter = {
                userID: userid,
                title: {
                    $regex: new RegExp('^' + convertRegex(inputStr.replaceAll(/^\.event\s+delete\s+/ig, '').replace(/\s+$/, '')) + '$', "i")
                }
            }
            doc = await schema.eventList.findOne(filter);
            if (!doc) {
                rply.text = translate('event.delete_not_found');
                return rply
            }
            try {
                await schema.eventList.findOneAndDelete(filter);
                await schema.eventMember.updateOne({
                    userID: userid
                }, {
                    $pull: {
                        eventList: {
                            eventID: doc._id
                        }
                    }
                })
            } catch (error) {
                console.error('[Event] Delete event error:', error)
                rply.text = translate('event.delete_fail');
                return rply;
            }
            // Add to database
            // Check for duplicates
            rply.text = translate('event.delete_success', { title: doc.title });
            return rply;
        }
        case /(^[.]event$)/i.test(mainMsg[0]) && /^useExp$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = translate('event.group_only');
                return rply
            }
            let gp = await schema.trpgLevelSystem.findOne({ groupid: groupid });
            if (!gp || !gp.SwitchV2) {
                rply.text = translate('event.level_disabled');
                return rply;
            }
            let eventMember = await schema.eventMember.findOne({
                userID: userid
            });
            let thisMember = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });
            if (!eventMember || !thisMember) {
                rply.text = translate('event.no_member_data');
                return rply;
            }
            if (eventMember.earnedEXP > 0) {
                let exp = eventMember.earnedEXP;
                try {
                    await thisMember.updateOne({
                        $inc: {
                            EXP: exp
                        }
                    })

                    rply.text = translate('event.exp_transferred', { exp, total: thisMember.EXP + exp });
                    eventMember.earnedEXP = 0;
                    await eventMember.save();
                    return rply;
                } catch (error) {
                    rply.text = translate('event.update_failed');
                    console.error('%cz_event.js line:282 error', 'color: #007acc;', error);
                    return rply;
                }
            }
            else {
                rply.text = translate('event.no_earned_exp');
                return rply;
            }
        }
        case (/(^[.]event$)/i.test(mainMsg[0]) || /(^[.]evt$)/i.test(mainMsg[0])) && /^show$/i.test(mainMsg[1]):
            {
                rply.quotes = true;
                filter = {
                    userID: userid
                }
                let eventMember = await schema.eventMember.findOne(filter);
                doc = await schema.eventList.find(filter);


                let maxLv = await findMaxLv(userid);
                /**
                 * 檢查ENERGY，如果沒有則新增，數字為EN= 20+LV
                 */
                if (!eventMember) {
                    eventMember = new schema.eventMember({
                        userID: userid,
                        userName: displaynameDiscord || displayname || '',
                        energy: maxLv + 20,
                        lastActiveAt: new Date(Date.now())
                    });

                }
                if (!eventMember.energy || !eventMember.lastActiveAt) {
                    eventMember.energy = maxLv + 20;
                }

                // Recover EN
                let EnergyRecover = Math.round(((new Date(Date.now()) - new Date(eventMember.lastActiveAt))) / EN_RECOVER_TIME);
                eventMember.energy = Math.min(maxLv + 20, EnergyRecover + eventMember.energy);
                eventMember.lastActiveAt = new Date(Date.now());
                (debugMode) ? eventMember.energy = 99 : null;



                rply.text = translate('event.show_name', { name: displaynameDiscord || displayname || translate('event.unnamed') }) + '\n' +
                    translate('event.show_en', {
                        current: eventMember.energy,
                        max: maxLv + 20,
                        emoji: ENemoji(Math.round(eventMember.energy / (maxLv + 20) * 100))
                    }) + '\n' +
                    translate('event.show_total_exp', { total: (eventMember.totailEarnedEXP) ? eventMember.totailEarnedEXP : 0 }) + '\n' +
                    translate('event.show_unused_exp', { unused: (eventMember.earnedEXP) ? eventMember.earnedEXP : 0 });
                if (eventMember.activityList.length > 0) {
                    let result = eventMember.activityList;
                    rply.text += translate('event.recent_events_header');
                    for (let index = 0; index < result.length; index++) {
                        const date = result[index].date;
                        rply.text += translate('event.activity_line', {
                            month: date.getMonth() + 1,
                            day: date.getDate(),
                            hour: date.getHours(),
                            minute: (date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes(),
                            detail: result[index].activityDetail
                        });
                    }
                }
                if (doc && doc.length > 0)
                    rply.text += translate('event.my_events_header');
                for (let index = 0; index < doc.length; index++) {
                    rply.text += "\n" + doc[index].title + "\n";
                    if (doc[index].expName) rply.text += translate('event.exp_name_label', { name: doc[index].expName });
                    rply.text += (doc[index].chainTitle) ? translate('event.chain_title', { chain: doc[index].chainTitle }) : '';
                    if (mainMsg[2] && new RegExp('^' + convertRegex(doc[index].title) + '$', 'i').test(mainMsg[2])) {
                        rply.text += getDetail(doc[index], translate) + '\n';
                    }
                }
                return rply;
            }
        case /(^[.]evt$)/i.test(mainMsg[0]) && /^\S+$/i.test(mainMsg[1]): {
            {
                rply.quotes = true;
                if (!groupid) {
                    rply.text = translate('event.group_only');
                    return rply
                }
                let gp = await schema.trpgLevelSystem.findOne({ groupid: groupid });
                if (!gp || !gp.SwitchV2) {
                    rply.text = translate('event.level_disabled');
                    return rply;
                }

                let eventMember = await schema.eventMember.findOne({
                    userID: userid
                });
                let thisMember = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid });
                if (!thisMember) {
                    rply.text = translate('event.group_data_missing');
                    return rply;
                }
                let maxLv = await findMaxLv(userid);

                if (!eventMember) {
                    eventMember = new schema.eventMember({
                        userID: userid,
                        userName: displaynameDiscord || displayname || '',
                        energy: maxLv + 20,
                        lastActiveAt: new Date(Date.now())
                    });
                }

                if (!eventMember.energy || !eventMember.lastActiveAt) {
                    eventMember.energy = maxLv + 20;
                }

                let EnergyRecover = Math.round(((new Date(Date.now()) - new Date(eventMember.lastActiveAt))) / EN_RECOVER_TIME);

                eventMember.energy = Math.min(maxLv + 20, EnergyRecover + eventMember.energy);
                if (EnergyRecover > 0 || !eventMember.lastActiveAt)
                    eventMember.lastActiveAt = new Date(Date.now());
                (debugMode) ? eventMember.energy = 99 : null;

                const targetEventName = convertRegex(mainMsg[1]);
                let eventMode = '';
                let eventList = [];
                if (/^random$/i.test(targetEventName)) {
                    eventMode = 'random';
                } else {
                    if (eventMember.energy < 10) {
                        rply.text = translate('event.insufficient_en', { energy: eventMember.energy });
                        return rply;
                    }
                    eventList = await schema.eventList.aggregate([{
                        $match: {
                            chainTitle: {
                                $regex: new RegExp('^' + convertRegex(targetEventName) + '$', "i")
                            }
                        }
                    }, { $sample: { size: 1 } }]);
                    if (eventList.length > 0) {
                        eventMode = 'chain'
                    } else {
                        if (eventMember.energy < 15) {
                            rply.text = translate('event.insufficient_en', { energy: eventMember.energy });
                            return rply;
                        }
                        eventList = await schema.eventList.aggregate([{
                            $match: {
                                title: {
                                    $regex: new RegExp('^' + convertRegex(targetEventName) + '$', "i")
                                }
                            }
                        }, { $sample: { size: 1 } }]);
                        if (eventList.length > 0) {
                            eventMode = 'title'
                        }
                    }
                }

                let earedXP = 0;

                if (thisMember.EXP <= 0) {
                    rply.text = translate('event.exp_too_low', { exp: thisMember.EXP });
                    return rply;
                }

                switch (eventMode) {
                    case 'random':
                        if (eventMember.energy < 5) {
                            rply.text = translate('event.random_en_required', { energy: eventMember.energy });
                            return rply;
                        } else {
                            eventList = await schema.eventList.aggregate([{ $sample: { size: 1 } }]);
                            if (eventList.length === 0) {
                                rply.text = translate('event.no_events_yet');
                                return rply;
                            }
                            eventMember.energy -= 5
                            earedXP = 5;
                        }
                        break;

                    case 'chain':
                        eventMember.energy -= 10;
                        earedXP = 10;
                        break;
                    case 'title':
                        if (eventList[0].userID == userid) {
                            rply.text = translate('event.own_event_forbidden');
                            return rply;
                        }
                        eventMember.energy -= 15;
                        earedXP = 15;
                        break;

                    default:
                        rply.text = translate('event.event_not_found', { name: targetEventName });
                        return rply;
                }

                await eventMember.save();
                let randomDetail = eventList[0].detail[await rollDice.Dice(eventList[0].detail.length) - 1];
                let eventText = [];
                // Check if randomDetail exists and has event property
                if (randomDetail && randomDetail.event) {
                    eventText = randomDetail.event.split(';').filter(text => text && text.trim());
                }

                const formatEvent = (chainTitle, title, text) => {
                    chainTitle = (chainTitle || '').toString();
                    title = (title || '').toString();
                    text = (text || '').toString();
                    chainTitle = chainTitle.trim();
                    title = title.trim();
                    text = text.trim();
                    const maxLength = Math.max(
                        chainTitle.length,
                        title.length,
                        text.length,
                        4
                    );

                    const line = "─".repeat(Math.min(maxLength + 2, 10));

                    return translate('event.random_event_format', { line, chain: chainTitle, title, text });
                }

                // Ensure eventText has content before rolling dice
                if (!eventText || eventText.length === 0) {
                    rply.text += formatEvent(
                        eventList[0].chainTitle,
                        eventList[0].title,
                        translate('event.random_event_nothing')
                    );
                } else {
                    rply.text += formatEvent(
                        eventList[0].chainTitle,
                        eventList[0].title,
                        eventText[await rollDice.Dice(eventText.length) - 1]
                    );
                }

                rply.text += `\n${await eventProcessExp({ randomDetail: randomDetail, groupid: groupid, eventList: eventList[0], thisMember: thisMember, locale, t })} `
                await schema.eventMember.findOneAndUpdate({ userID: eventList[0].userID }, { $inc: { earnedEXP: earedXP, totailEarnedEXP: earedXP } })
                return rply;
            }
        }
        default:
            break;

    }
}

function getDetail(doc, translate) {
    let text = '';
    for (let index = 0; index < doc.detail.length; index++) {
        text += translate('event.detail_line', {
            type: doc.detail[index].result,
            content: doc.detail[index].event
        });
    }
    return text;
}

async function analysicInputData(inputStr) {
    let MainData = (regexMain.test(inputStr)) ? inputStr.match(regexMain) : '';
    let ExpName = (regexExp.test(inputStr)) ? inputStr.match(regexExp)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let eventName = (regexName.test(inputStr)) ? inputStr.match(regexName)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let eventChain = (regexChainTitle.test(inputStr)) ? inputStr.match(regexChainTitle)[1].replace(/^\s+/, '').replace(/\s+$/, '') : '';
    let result = {
        expName: ExpName,
        MainData: MainData,
        eventName: eventName,
        eventChain: eventChain
    }
    return result;
}
async function analysicDetail(data) {
    let info = [];
    for (let index = 0; index < data.length; index++) {
        let temp = data[index].match(/(-?\d+):(.*)/);
        if (temp[1] <= 5 && temp[1] >= -5)
            info.push({
                event: temp[2],
                result: temp[1]
            })
    }
    return info;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('event')
            .setDescription('【事件功能】管理你的事件')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增事件')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('事件名稱')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('content')
                            .setDescription('事件內容 (格式: 0:內容;內容 1:內容 -1:內容)')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('chain')
                            .setDescription('系列名稱 (選填)'))
                    .addStringOption(option => 
                        option.setName('exp')
                            .setDescription('經驗值名稱 (選填)')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除事件')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('事件名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示你新增的所有事件及賺取EXP')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('事件名稱 (選填)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('useexp')
                    .setDescription('在群組中使用賺取的EXP'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('enter')
                    .setDescription('進入事件')
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('事件名稱或系列名稱，輸入random進入隨機事件')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('name');
                    const content = interaction.options.getString('content');
                    const chain = interaction.options.getString('chain');
                    const exp = interaction.options.getString('exp');
                    
                    let command = `.event add\nname:${name}`;
                    if (chain) command += `\nchain:${chain}`;
                    if (exp) command += `\nexp:${exp}`;
                    command += `\n${content}`;
                    
                    return command;
                }
                case 'delete': {
                    const name = interaction.options.getString('name');
                    return `.event delete ${name}`;
                }
                case 'show': {
                    const name = interaction.options.getString('name');
                    return name ? `.event show ${name}` : `.event show`;
                }
                case 'useexp': {
                    return `.event useExp`;
                }
                case 'enter': {
                    const name = interaction.options.getString('name');
                    return `.evt ${name}`;
                }
                default:
                    return `.event help`;
            }
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



/**
 * TODO:
 * 1. .evt (event)系統設計
經由新增的事件 可以增加減少EXP
功能及設計列表
1. 舉報不良項目, 有幾個個舉報, 自動隱藏
3. 
進入事件的方法
輸入 .evt event ->   即 進入 隨機事件, 消耗5EN
輸入 .evt (事件名稱) ->   即 進入 指定事件, 消耗15EN

EN= 20+LV
每5分鐘回複1點EN

得知事件名稱的方法，別人告知 或 經隨機事件知道名字

4. 
事件效果
-1. 直接減少X點經驗(X分鐘內)
-2. 停止得到經驗(X分鐘內)
-3. 分發X經驗給整個CHANNEL中的X人
-4. 停止得到經驗(X分鐘內)並每次減少發言減少X經驗
-5. 吸收對方X點經驗
0. 沒有事發生
1. 直接增加X點經驗(X分鐘內)
2. 對方得到經驗值 X 倍(X分鐘內)
3. 從整個CHANNEL 的X人吸收X點經驗

5. 
設計事件的好處
能夠吸收對方消耗的en 作為自己的exp

6.
設計方式
輸入 .evt add 天命
你被雷打中 得到{exp}點真氣  2  (直接增加X點經驗)
你掉下山中 頭破血流，損失{exp}點真氣  3  (直接減少X點經驗)
今天風平浪靜 1 (無事發生)

可以有3+(ROUNDDOWN 設計者LV/10)  項結果
由設計者自己設定
一個事件由以下三項組成
事件名稱，事件內容及設定事件結果 

7. 
限制
A. 一個事件中，正面選項要比負面選項多
B. 事件效果隨著設計者LV 而開發
如: 效果1-3 LV0-10 可用
4 需要LV11-20LV
5 需要LV21-30
C. 一個事件中，不可以全部正面效果
D. 一個事件可用的總EN 為(10+LV)，負面事件消耗X點EN

8.
變數X 普通為
設計者LV , 
使用者LV, 
設計者LV 與使用者LV 的相差,
負面效果的程度(即如果一個事件中有負面效果，那正面效果會增加)
 * 
 * 
 * A) .evt event / .evt 指定名字   - roll/event.js  (檢查有沒有開EXP功能)
 * B) 沒有則RETURN，
 *      有->傳送GP ID, USER ID, 名字 到 MODULES/EVENT.JS
 *      取得MONGOOSE資料 ->進行  (randomEvent)
 *       i)   抽選整個列表      
 *      ii)   抽選指定列表
 * C)   從該列表中抽選一個結果 (randomEvent)
 * D)   得到結果後，進行 該運算 (event)
 *      1/8個結果   -> (expChange)
 * E)   得到結果，修改MONGOOSE (editExp)
 * F)   翻回文字結果到使用者(roll/event.js)
 * 
 * 
 * 
 */

function formatEventExpName(eventList, translate) {
    return eventList.expName
        ? translate('event.exp_name_quoted', { name: eventList.expName })
        : translate('event.exp_name_default');
}

async function eventProcessExp({ randomDetail, groupid, eventList, thisMember, locale, t }) {
    const translate = getT({ locale, t });
    const expName = formatEventExpName(eventList, translate);
    switch (randomDetail.result) {
        case 1: {
            let exp = await calXP(eventList, thisMember.Level, "exp")
            await thisMember.updateOne({
                $inc: { EXP: exp }
            })
            const activityDetail = translate('event.exp_gain', { exp, expName }).trim();
            await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                $push: {
                    activityList: {
                        $each: [{
                            date: Date.now(),
                            activityDetail
                        }],
                        $sort: { date: -1 },
                        $slice: 10
                    }
                }
            })
            return translate('event.exp_gain', { exp, expName });
        }

        case 2:
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                let multi = await calXP(eventList, thisMember.Level, "multi")
                const resolvedTimes = Math.max(Number.isNaN(thisMember.multiEXPTimes) ? 0 : thisMember.multiEXPTimes, times);
                const resolvedMulti = Math.max(Number.isNaN(thisMember.multiEXP) ? 0 : thisMember.multiEXP, multi);
                await thisMember.updateOne({
                    $max: { multiEXP: multi, multiEXPTimes: times }
                })

                const activityDetail = translate('event.exp_multi', { times: resolvedTimes, multi: resolvedMulti, expName });
                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })
                return activityDetail;
            }
        case 3:
            {
                await schema.trpgLevelSystemMember.updateMany({
                    groupid: groupid
                }, {
                    $inc: { EXP: 1 }
                })
                const activityDetail = translate('event.exp_group_all', { expName });
                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList:
                        {
                            $each: [{
                                date: Date.now(),
                                activityDetail
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })

                return translate('event.exp_group_all', { expName });
            }

        case 4:
            {
                let createEventerLV = await findMaxLv(eventList.userID);

                let createEventer = await findCreater(eventList.userID);

                let exp = await calXP(eventList, Math.min(createEventerLV, thisMember.Level), "exp");

                exp = Math.min(Math.max(0, Number(createEventer.earnedEXP) - exp), exp)


                await thisMember.updateOne({
                    $inc: { EXP: exp }
                })
                await createEventer.updateOne({
                    userID: eventList.userID,
                }, {
                    $inc: { earnedEXP: -exp, totailEarnedEXP: exp }, $push: {
                        activityList:
                        {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_gift_author_activity', { name: thisMember.name, exp, expName })
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        },
                    }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList:
                        {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: translate('event.exp_gift_receiver', { userName: eventList.userName, exp, expName }).trim()
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })



                return translate('event.exp_gift_receiver', { userName: eventList.userName, exp, expName });
            }
        case 5:
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                let targetMember = await schema.trpgLevelSystemMember.aggregate([{
                    $match:
                    {
                        groupid: groupid,
                        userid: {
                            $not: { $regex: new RegExp(thisMember.userid, 'i') }
                        }
                    }
                }, {
                    $sample: { size: times }
                }]);
                let name = [],
                    expMember = [],
                    totalEXP = 0;

                for (let index = 0; index < targetMember.length; index++) {
                    let exp = await calXP(eventList, Math.min(thisMember.Level, targetMember[index].Level), "exp");

                    exp = Math.min(Math.max(0, Number(targetMember[index].EXP) - exp), exp);


                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: targetMember[index].groupid,
                        userid: targetMember[index].userid,
                    }, {
                        $inc: { EXP: -exp }
                    })
                    await schema.eventMember.updateOne({ userID: targetMember[index].userid }, {
                        $push: {
                            activityList: {
                                $each: [{
                                    date: Date.now(),
                                    activityDetail: translate('event.exp_absorb_victim_activity', { userName: eventList.userName, exp, expName })
                                }],
                                $sort: { date: -1 },
                                $slice: 10
                            }
                        }
                    })
                    name.push(targetMember[index].name)
                    expMember.push(exp)
                    totalEXP += exp;
                }


                await thisMember.updateOne({
                    $inc: { EXP: totalEXP }
                });

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_absorb_summary_activity', { count: targetMember.length, total: totalEXP, expName })
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                let reply = translate('event.exp_absorb_gain', { total: totalEXP, expName });
                for (let index = 0; index < name.length; index++) {
                    reply += translate('event.exp_member_loss', {
                        name: name[index] || translate('event.unnamed'),
                        exp: expMember[index],
                        expName
                    });
                }
                return reply;
            }
        case -1:
            {
                let exp = await calXP(eventList, thisMember.Level, "expNeg")
                exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);
                await thisMember.updateOne({
                    $inc: { EXP: -exp }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: translate('event.exp_loss', { exp, expName }).trim()
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return translate('event.exp_loss', { exp, expName });
            }

        case -2:
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                const resolvedTimes = Math.max(Number.isNaN(thisMember.stopExp) ? 0 : thisMember.stopExp, times);
                await thisMember.updateOne({
                    $max: { stopExp: times }
                })
                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each:
                                [{
                                    date: Date.now(),
                                    activityDetail: translate('event.exp_stop_activity', { times: resolvedTimes, expName })
                                }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })


                return translate('event.exp_stop', { times: resolvedTimes, expName });
            }

        case -3:
            {
                let createEventerLV = await findMaxLv(eventList.userID);
                let exp = await calXP(eventList, Math.min(createEventerLV, thisMember.Level), "expNeg");

                exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);

                await thisMember.updateOne({
                    $inc: { EXP: -exp }
                })

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_drained', { userName: eventList.userName, exp, expName }).trim()
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })

                await schema.eventMember.findOneAndUpdate({
                    userID: eventList.userID,
                }, {
                    $inc: { earnedEXP: exp, totailEarnedEXP: exp }, $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_drained_author_activity', { name: thisMember.name, exp, expName })
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return translate('event.exp_drained', { userName: eventList.userName, exp, expName });
            }
        case -4:
            {
                let times = await calXP(eventList, thisMember.Level, "times");
                let targetMember = await schema.trpgLevelSystemMember.aggregate([{
                    $match:
                    {
                        groupid: groupid,
                        userid: {
                            $not: { $regex: new RegExp(thisMember.userid, 'i') }
                        }
                    }
                }, {
                    $sample: { size: times }
                }]);
                let name = [],
                    expMember = [],
                    totalEXP = 0;
                for (let index = 0; index < targetMember.length; index++) {
                    let exp = await calXP(eventList, Math.min(thisMember.Level, targetMember[index].Level), "expNeg");

                    exp = Math.min(Math.max(0, Number(thisMember.EXP) - exp), exp);

                    thisMember.EXP -= exp;

                    await schema.trpgLevelSystemMember.findOneAndUpdate({
                        groupid: targetMember[index].groupid,
                        userid: targetMember[index].userid,
                    }, {
                        $inc: { EXP: exp }
                    })

                    await schema.eventMember.updateOne({ userID: targetMember[index].userid }, {
                        $push: {
                            activityList: {
                                $each: [{
                                    date: Date.now(),
                                    activityDetail: translate('event.exp_distribute_forced_give', { name: thisMember.name, exp, expName })
                                }],
                                $sort: { date: -1 },
                                $slice: 10
                            }
                        }
                    })
                    name.push(targetMember[index].name)
                    expMember.push(exp)
                    totalEXP += exp;
                }
                await thisMember.updateOne({
                    $inc: { EXP: -totalEXP }
                });

                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_distribute_forced_activity', { total: totalEXP, count: targetMember.length, expName })
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })

                let reply = translate('event.exp_distribute_loss', { total: totalEXP, expName });
                for (let index = 0; index < name.length; index++) {
                    reply += translate('event.exp_member_gain', {
                        name: name[index] || translate('event.unnamed'),
                        exp: expMember[index],
                        expName
                    });
                }

                return reply;
            }
        case -5:
            {
                let exp = Math.round(await calXP(eventList, thisMember.Level, "expNeg"));
                let times = await calXP(eventList, thisMember.Level, "times");
                const resolvedTimes = Math.max(Number.isNaN(thisMember.decreaseEXPTimes) ? 0 : thisMember.decreaseEXPTimes, times);
                const resolvedExp = Math.max(Number.isNaN(thisMember.decreaseEXP) ? 0 : thisMember.decreaseEXP, exp);
                await thisMember.updateOne({
                    $max: { decreaseEXP: exp, decreaseEXPTimes: times }
                })


                await schema.eventMember.updateOne({ userID: thisMember.userid }, {
                    $push: {
                        activityList: {
                            $each: [{
                                date: Date.now(),
                                activityDetail: translate('event.exp_decrease_speech_activity', { times: resolvedTimes, exp: resolvedExp, expName })
                            }],
                            $sort: { date: -1 },
                            $slice: 10
                        }
                    }
                })
                return translate('event.exp_decrease_speech', { times: resolvedTimes, exp: resolvedExp, expName });
            }

        default:
            //     0. 沒有事發生
            return translate('event.nothing_happened');


    }
}
async function calXP(eventList, thisMemberLV, type) {

    let typeNumber = 1;
    switch (type) {
        case "exp": {
            //正面事件  把負面的數字相加
            let eventPosit = eventList.detail.map(item => {
                if (item.result < 0 && !Number.isNaN(item.result)) {
                    return item.result;
                } else return 0
            });
            eventPosit = eventPosit.filter(item => item < 0);
            let eventPositiveLV = (eventPosit.length > 0) ? eventPosit.reduce((b, a) =>
                Number(a) + Number(b)) : 1;


            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(Math.max(createEventerLV, thisMemberLV) + 20, Math.min(createEventerLV, thisMemberLV)) + 15;

            typeNumber *= (Math.abs(createEventerLV - thisMemberLV) / 20 + 1);

            typeNumber *= Math.max((eventPositiveLV ^ 2) / 20 + 1, 1);

            typeNumber *= (eventPosit.length / 5 + 1);

            return Math.round(typeNumber);
        }
        case "expNeg": {
            //負面事件  把正面的數字相加
            let eventNeg = eventList.detail.map(item => {
                if (item.result > 0 && !Number.isNaN(item.result)) {
                    return item.result;
                } else return 0
            });
            eventNeg = eventNeg.filter(item => item < 0);
            let eventNegLV = (eventNeg.length > 0) ? eventNeg.reduce((b, a) =>
                Number(a) + Number(b)) : 1;


            let createEventerLV = await findMaxLv(eventList.userID);

            typeNumber = await rollDice.DiceINT(Math.max(createEventerLV, thisMemberLV) + 20, Math.min(createEventerLV, thisMemberLV)) + 15;

            typeNumber *= (Math.abs(createEventerLV - thisMemberLV) / 20 + 1);

            typeNumber *= Math.max((eventNegLV ^ 2) / 20 + 1, 1);

            typeNumber *= (eventNeg.length / 5 + 1);

            return Math.round(typeNumber);
        }
        case "times": {
            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(5, ((createEventerLV - thisMemberLV) > 0) ? Math.min(createEventerLV - thisMemberLV, 20) : 1);
            if (Number.isNaN(typeNumber)) typeNumber = 1;
            if (typeNumber < 1) typeNumber = 1;
            return typeNumber;
        }

        case "multi": {
            let createEventerLV = await findMaxLv(eventList.userID);
            typeNumber = await rollDice.DiceINT(3, ((createEventerLV - thisMemberLV) > 0) ? Math.round((createEventerLV - thisMemberLV) / 3) : 2);
            return typeNumber;
        }
        default:
            return typeNumber;
    }
    //   1. 直接增加X點經驗
    //100之一 ->50之一 * 1.0X ( 相差LV)% *1.0X(負面級數)^(幾個事件) 

}
async function findMaxLv(userid) {
    let maxLV = await schema.trpgLevelSystemMember.findOne({ userid: userid }).sort({ Level: -1 });
    if (!maxLV) return 1;
    return maxLV.Level;
}


async function findCreater(userid) {
    let creater = await schema.eventMember.findOne({ userID: userid }).sort({ Level: -1 });
    if (!creater) return null;
    return creater;
}




/**
 EVENT 功能修改點
(##TODO##)

[X]1. 10分鐘回複一點EN.
[X]2. 隨機事件 5EN, 系列事件10EN, 指定事件15EN
[X]3. 吸收的經驗值根據 (被吸收者和吸收者LV+20 隨機) 來決定



[X]4. 增加種類選項
[X]A) 贈送作者經驗給玩家
B) 每次發言增加Ｘ經驗
[X]C) 群組所有人增加1點經驗

[X]5. 能否不骰到別群的事件
增加 參數: 系列,chain of events
可以指定該系列的事件
如 修真 系列

會自動尋



[ ]6.是否能指定某人觸發事件 <---
在.evt XXX  @XXXX 後, 會嘗試根據對方的名字,
但LINE的話, 需要對方和HKTRPG成為朋友, 才可能成功.
不會搜尋無名


[X] 7.經驗避免被扣到負值，最低歸零
對方不可零, 自己不可零

[ ]8.能否贈送別人經驗 <---
同6,  傳功消耗, 6折
不會搜尋無名


[X]9. 狀態欄
姓名:
EN:  /   ▬▬▬▬▬▬▭▭▭▭▮▮▮▮▯▯▯▯:white_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:
earnedEXP
totailEarnedEXP
eventList
最高等級?

10次最後發生的事件
---


 */