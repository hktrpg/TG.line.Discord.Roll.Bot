"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const checkMongodb = require('../modules/dbWatchdog.js');
const adminSecrets = parseAdminSecrets(process.env.ADMIN_SECRET);
const isAdminUser = (userid) => Boolean(userid) && adminSecrets.includes(userid);
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const rollbase = require('./rollbase.js');
exports.z_Level_system = require('./z_Level_system');
const wheelAnimator = require('./wheel-animator.js');
const opt = {
    upsert: true,
    runValidators: true
}

const FUNCTION_LIMIT = [30, 200, 200, 500, 500, 500, 500, 500];
const FUNCTION_LIMIT_PERSONAL = [2, 200, 200, 500, 500, 500, 500, 500];
const gameName = function (params = {}) {
    return resolveGameName(params, 'random_ans.game_name', '【自定義骰子/回應功能】 .ra(p)(s)(次數) (add del show 自定骰子名稱)');
}
const gameType = function () {
    return 'funny:randomAns:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.](r|)ra(\d+|p|p\d+|s|s\d+|a|a\d+|)$)/ig,
        second: null
    }]
}
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'random_ans.help');
}
const initialize = function () {
    return;
}
/**
 * {ran:100} <---隨機1-100
 * {random:5-20} <---隨機5-20
 * {allgp.name} <---隨機全GP其中一人名字
 * {allgp.title}<---隨機全GP其中一人稱號
 * {server.member_count}<---現在頻道中總人數 \
 * {my.RankingPer}<---現在排名百分比 \
 * {my.Ranking}<---顯示擲骰者現在排名 \
 * {my.exp}<---顯示擲骰者經驗值
 * {my.name} <---顯示擲骰者名字
 * {my.title}<---顯示擲骰者稱號
 * {my.level}<---顯示擲骰者等級
 */
const rollDiceCommand = async function ({
    mainMsg,
    groupid,
    userrole,
    userid,
    displayname,
    displaynameDiscord,
    membercount,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let times = [];
    let lv;
    let limit = FUNCTION_LIMIT[0];
    let getData;
    let check;
    let temp;
    let filter;
    if (!checkMongodb.isDbOnline()) return;
    switch (true) {

        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        case /(^[.]raa(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            // Animated wheel version - only supports single roll
            if (!groupid) {
                rply.text = translate('random_ans.group_only');
                return rply;
            }

            getData = await schema.randomAns.findOne({ groupid: groupid }).lean().catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData) {
                rply.text = translate('random_ans.no_data');
                return rply;
            }

            // Find the dice
            temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[1].toLowerCase());
            if (!temp && /^\d+$/.test(mainMsg[1])) {
                temp = getData.randomAnsfunction[mainMsg[1]];
            }
            if (!temp) {
                rply.text = translate('random_ans.dice_not_found', { name: mainMsg[1] });
                return rply;
            }

            // Get options (skip first element which is the dice name)
            const options = temp.slice(1);
            if (options.length === 0) {
                rply.text = translate('random_ans.no_options');
                return rply;
            }

            // Replace special codes in options
            const processedOptions = [];
            for (const opt of options) {
                const processed = await replaceAsync(opt, /{(.*?)}/ig, replacer);
                processedOptions.push(processed);
            }

            // Select random option
            const selectedIndex = rollbase.Dice(options.length) - 1;
            const selectedValue = processedOptions[selectedIndex];

            // If too many options, fallback to text version
            const MAX_OPTIONS_FOR_ANIMATION = 12;
            if (processedOptions.length > MAX_OPTIONS_FOR_ANIMATION) {
                rply.text = translate('random_ans.result_text', {
                    name: temp[0],
                    value: selectedValue,
                    count: processedOptions.length
                });
                return rply;
            }
            // If any option text is too long, fallback to text version
            const hasTooLongOption = processedOptions.some(opt =>
                wheelAnimator.effectiveTextLength(opt) > wheelAnimator.MAX_OPTION_EFFECTIVE_LENGTH
            );
            if (hasTooLongOption) {
                rply.text = translate('random_ans.result_text_long', {
                    name: temp[0],
                    value: selectedValue
                });
                return rply;
            }

            try {
                // Generate wheel animation GIF - use optimized defaults
                const gifPath = await wheelAnimator.generateWheelGif(
                    processedOptions,
                    {}, // Use optimized defaults (1.5s, 10fps, 500px)
                    selectedIndex
                );

                // Set file link for Discord
                if (!rply.fileLink) {
                    rply.fileLink = [];
                }
                rply.fileLink.push(gifPath);
                rply.fileText = translate('random_ans.wheel_file_caption', { name: temp[0] });

                return rply;
            } catch (error) {
                console.error('[Random Ans] Wheel animation error:', error);
                // Fallback to text-only result if animation fails
                rply.text = translate('random_ans.anim_failed', {
                    error: error.message,
                    name: temp[0],
                    value: selectedValue
                });
                return rply;
            }
        }
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            try {

                //
                // Add custom keywords
                // .ra[0] add[1] title[2] random1[3] random2[4] 
                /*
                只限四張角色卡.
                使用VIPCHECK
                */
                lv = await VIP.viplevelCheckGroup(groupid);
                limit = FUNCTION_LIMIT[lv];
                if (!mainMsg[2]) rply.text += translate('random_ans.no_dice_name');
                if (!mainMsg[3]) rply.text += translate('random_ans.no_dice_content');
                rply.text += checkTools.permissionErrMsg({ locale,
                    flag: checkTools.flag.ChkChannelManager,
                    gid: groupid,
                    role: userrole
                });
                if (rply.text) {
                    return rply;
                }

                getData = await schema.randomAns.findOne({ groupid: groupid }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                let update = false;
                let findIndex = getData && getData.randomAnsfunction.findIndex((e) => {
                    return e && e[0] && e[0].toLowerCase() == mainMsg[2].toLowerCase()
                })
                if (findIndex >= 0 && findIndex != null) {
                    let tempCheck = getData.randomAnsfunction[findIndex].join('') + mainMsg.slice(3).join('')
                    if (tempCheck.length > 3000) {
                        rply.text = translate('random_ans.update_too_long');
                        return rply;
                    } else {
                        update = true;
                        getData.randomAnsfunction.set(findIndex, [...getData.randomAnsfunction[findIndex], ...mainMsg.slice(3)])
                    }
                }
                if (update) {
                    await getData.save();
                    rply.text = translate('random_ans.update_success', { name: mainMsg[2] });
                    return rply;
                }
                if (getData && getData.randomAnsfunction.length >= limit) {
                    rply.text = translate('random_ans.group_limit', { limit });
                    return rply;
                }
                temp = {
                    randomAnsfunction: mainMsg.slice(2)
                }
                check = await schema.randomAns.updateOne({
                    groupid: groupid
                }, {
                    $push: temp
                }, opt).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (check.modifiedCount || check.upsertedCount) {
                    rply.text = translate('random_ans.add_success', {
                        name: mainMsg[2],
                        count: mainMsg.slice(3).length
                    });
                } else rply.text = translate('random_ans.add_failed');

                return rply;

            } catch (error) {
                console.error(error)
            }
            break;
        }
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            // Delete custom keywords
            if (!mainMsg[2]) {
                rply.text = translate('random_ans.delete_no_name');
                return rply;
            }

            rply.text += checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            filter = {
                groupid: groupid,
            };
            getData = await schema.randomAns.findOne(filter).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData) {
                rply.text = translate('random_ans.no_data');
                return rply;
            }

            temp = getData.randomAnsfunction.filter(e => e[0].toLowerCase() === mainMsg[2].toLowerCase());
            if (temp.length === 0) {
                rply.text = translate('random_ans.delete_not_found', { name: mainMsg[2] });
                return rply;
            }

            for (const f of temp) getData.randomAnsfunction.splice(getData.randomAnsfunction.findIndex(e => e[0] === f[0]), 1);
            check = await getData.save();

            if (check) {
                const deletedOptions = temp[0].slice(1);
                rply.text = translate('random_ans.delete_success', {
                    name: temp[0][0],
                    count: deletedOptions.length
                });
            } else {
                rply.text = translate('random_ans.delete_failed');
            }
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = translate('random_ans.group_only');
                return rply;
            }
            rply.quotes = true;
            getData = await schema.randomAns.findOne({ groupid: groupid }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData || getData.randomAnsfunction.length === 0) {
                rply.text = translate('random_ans.no_dice_configured', {
                    version_note: translate('random_ans.version_note')
                });
                return rply;
            }
            if (mainMsg[2]) {
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[2].toLowerCase());
                if (!temp) {
                    rply.text = translate('random_ans.dice_not_found', { name: mainMsg[2] });
                    rply.text += translate('random_ans.multi_hint');
                    return rply;
                }
                rply.text = translate('random_ans.show_header', {
                    name: temp[0],
                    count: temp.length - 1
                });
                for (let i = 1; i < temp.length; i++) {
                    rply.text += translate('random_ans.show_option', { i, value: temp[i] });
                }
                return rply;
            }

            rply.text = translate('random_ans.list_header');
            for (let a in getData.randomAnsfunction) {
                rply.text += translate('random_ans.list_entry', {
                    a,
                    name: getData.randomAnsfunction[a][0]
                });
            }
            rply.text += translate('random_ans.list_footer');
            rply.text += translate('random_ans.multi_hint');
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = translate('random_ans.group_only');
                return rply;
            }
            times = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[2] || 1;
            check = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) {
                times = 30;
                rply.text = translate('random_ans.max_times_adjusted');
            }
            if (times < 1) times = 1;

            getData = await schema.randomAns.findOne({ groupid: groupid }).lean().catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData) {
                rply.text = translate('random_ans.no_data');
                return rply;
            }

            let results = [];
            let notFoundDices = [];
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp && /^\d+$/.test(mainMsg[i])) {
                    temp = getData.randomAnsfunction[mainMsg[i]]
                }
                if (!temp) {
                    notFoundDices.push(mainMsg[i]);
                    continue;
                }

                let rollResult = {
                    name: temp[0],
                    results: [],
                    mode: check ? translate('random_ans.roll_mode_repeat') : translate('random_ans.roll_mode_unique')
                };

                if (check) {
                    // repeat mode
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.length - 1) - 1 + 1;
                        rollResult.results.push({
                            index: num + 1,
                            value: temp[randomNumber]
                        });
                    }
                } else {
                    // not repeat mode
                    let tempItems = [...temp].slice(1);
                    if (tempItems.length === 0) continue;

                    // 如果要抽取的次數大於選項數，提供警告
                    if (times > tempItems.length) {
                        rollResult.warning = translate('random_ans.roll_warning_adjust', {
                            requested: times,
                            options: tempItems.length
                        });
                        times = tempItems.length;
                    }

                    let shuffled = tempItems
                        .map((a) => ({ sort: Math.random(), value: a }))
                        .sort((a, b) => a.sort - b.sort)
                        .map((a) => a.value);

                    rollResult.results = shuffled.slice(0, times).map((value, index) => ({
                        index: index + 1,
                        value: value
                    }));
                }
                results.push(rollResult);
            }

            // Format output
            if (results.length === 0) {
                rply.text = translate('random_ans.roll_not_found');
                if (notFoundDices.length > 0) {
                    rply.text += translate('random_ans.invalid_dice_names', {
                        names: notFoundDices.join('、')
                    });
                }
                return rply;
            }

            rply.text = results.map(roll => {
                let output = [
                    translate('random_ans.roll_header', { name: roll.name }),
                    translate('random_ans.roll_mode_line', {
                        mode: roll.mode,
                        count: roll.results.length
                    })
                ];
                if (roll.warning) {
                    output.push(roll.warning);
                }
                output.push(
                    '',
                    roll.results.map(r =>
                        translate('random_ans.roll_result_line', {
                            index: r.index.toString().padStart(2, '0'),
                            value: r.value
                        })
                    ).join('\n')
                );
                return output.join('\n');
            }).join(translate('random_ans.roll_separator'));

            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);




            return rply;
        }
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
                //增加自定義關鍵字
                // .rap[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
                lv = await VIP.viplevelCheckUser(userid);
                limit = FUNCTION_LIMIT_PERSONAL[lv];
                if (!mainMsg[2])
                    rply.text += translate('random_ans.no_dice_name');
                if (!mainMsg[3])
                    rply.text += translate('random_ans.no_dice_content');
                if (!userid)
                    rply.text += translate('random_ans.personal_dm_only');
                if (rply.text) {
                    rply.text = translate('random_ans.add_failed_prefix') + rply.text;
                    return rply;
                }
                getData = await schema.randomAnsPersonal.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") }, "userid": userid }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                const rest = mainMsg.slice(3);
                const answerLength = getData && getData.answer ? getData.answer.join('').length : 0;

                if (getData && (answerLength + rest.length) > 2000) {
                    rply.text = translate('random_ans.personal_update_too_long');
                    return rply;
                }
                if (getData && getData.answer) {
                    getData.answer.push.apply(getData.answer, rest);
                    let result = await getData.save();
                    rply.text = translate('random_ans.personal_update_success', {
                        serial: result.serial,
                        title: result.title,
                        content: result.answer
                    });
                    return rply;
                }

                let list = await schema.randomAnsPersonal.find({ userid: userid }, 'serial').catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (list && list.length >= limit) {
                    rply.text = translate('random_ans.personal_limit', { limit });
                    return rply;
                }
                let newAnswer = new schema.randomAnsPersonal({
                    title: mainMsg[2],
                    answer: rest,
                    userid: userid,
                    serial: findTheNextSerial(list)
                })
                try {
                    let checkResult = await newAnswer.save();
                    rply.text = translate('random_ans.personal_add_success', {
                        serial: checkResult.serial,
                        title: checkResult.title,
                        content: checkResult.answer
                    });
                } catch (error) {
                    rply.text = translate('random_ans.personal_add_failed');
                    console.error('[Random Ans] MongoDB error:', error.name, error.reason)
                }
                return rply;
            }
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            rply.quotes = true;
            if (mainMsg[2]) {
                temp = await schema.randomAnsPersonal.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") }, "userid": userid }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (!temp) {
                    rply.text = translate('random_ans.personal_not_found');
                    return rply;
                }
                rply.text += translate('random_ans.custom_dice_detail', { title: temp.title });
                let tempanswer = temp.answer;
                for (let i in tempanswer) {
                    rply.text += (i == 0) ? '#' + i + ": " + tempanswer[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + '#' + i + ": " + tempanswer[i] + "        " : (i == 0) ? '' : '#' + i + ": " + tempanswer[i] + "        ";
                }
                return rply;
            }
            getData = await schema.randomAnsPersonal.find({ "userid": userid }).lean().catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData || getData.length === 0) {
                rply.text = translate('random_ans.personal_empty', {
                    version_note: translate('random_ans.version_note')
                });
                return rply
            }
            rply.text += translate('random_ans.personal_list_header');
            for (let a in getData) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + '#' + getData[a].serial + ": " + getData[a].title : "     " + '#' + getData[a].serial + ": " + getData[a].title;
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replaceAll(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replaceAll(/,/gm, ', ')
            rply.text += translate('random_ans.personal_list_footer');
            return rply

        case /(^[.]rap$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            {
                const target = escapeRegExp(mainMsg).slice(2);
                let dataList = await schema.randomAnsPersonal.deleteMany(
                    { "title": { $regex: new RegExp('^(' + target.join('|') + ')$', "i") }, "userid": userid }
                ).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                rply.text = translate('random_ans.personal_deleted', { count: dataList.n });
                return rply
            }
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            //
            //rap使用抽選功能
            //
            times = /^[.](r|)rap(\d+|)/i.exec(mainMsg[0])[2] || 1;
            let repeat = /^[.](r|)rap(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) times = 30;
            if (times < 1) times = 1
            const [, ...target] = escapeRegExp(mainMsg);
            getData = await schema.randomAnsPersonal.find(
                {
                    userid: userid,
                    $or: [
                        { "title": { $regex: new RegExp(`^(${target.join('|')})$`, "i") } },
                        { "serial": isNumber(target) }]
                }
            ).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData || getData.length === 0) {
                rply.text = translate('random_ans.personal_roll_not_found', {
                    version_note: translate('random_ans.version_note')
                });
                return rply
            }
            for (let index = 0; index < getData.length; index++) {
                let temp = getData[index];
                if (repeat) {
                    //repeat mode
                    rply.text += translate('random_ans.roll_arrow', { title: temp.title });
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.answer.length) - 1;
                        rply.text += (num == 0) ? temp.answer[randomNumber] : ', ' + temp.answer[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += translate('random_ans.roll_arrow', { title: temp.title });
                    let items = [];
                    let tempItems = [...temp.answer]
                    if (tempItems.length === 0) continue;
                    while (items.length < times) {
                        items = [
                            ...tempItems
                                .map((a) => ({
                                    sort: Math.random(),
                                    value: a
                                }))
                                .sort((a, b) => a.sort - b.sort)
                                .map((a) => a.value),
                            ...items
                        ]
                    }
                    for (let num = 0; num < times; num++) {
                        rply.text += (num == 0) ? items[num] : ', ' + items[num];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                }

            }
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        }

        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            {    //
                //增加自定義關鍵字
                // .ras[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
                if (!mainMsg[2])
                    rply.text += translate('random_ans.no_dice_name');
                if (!mainMsg[3])
                    rply.text += translate('random_ans.no_dice_content');
                if (!mainMsg[4])
                    rply.text += translate('random_ans.server_min_options');
                if (rply.text) {
                    rply.text = translate('random_ans.add_failed_prefix') + rply.text;
                    return rply;
                }
                getData = await schema.randomAnsServer.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") } }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (getData) {
                    rply.text = translate('random_ans.server_duplicate');
                    return rply;
                }

                const rest = mainMsg.slice(3);
                let list = await schema.randomAnsServer.find({}, 'serial');
                let newAnswer = new schema.randomAnsServer({
                    title: mainMsg[2],
                    answer: rest,
                    serial: findTheNextSerial(list)
                })
                if (list && list.length >= 100) {
                    rply.text = translate('random_ans.server_limit', { limit });
                    return rply;
                }
                try {
                    let checkResult = await newAnswer.save();
                    rply.text = translate('random_ans.server_add_success', {
                        serial: checkResult.serial,
                        title: checkResult.title,
                        content: checkResult.answer
                    });
                } catch (error) {
                    rply.text = translate('random_ans.server_add_failed');
                    console.error('[Random Ans] MongoDB error:', error.name, error.reason)
                }
                return rply;
            }
        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            rply.quotes = true;
            if (mainMsg[2]) {
                temp = await schema.randomAnsServer.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") } }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (!temp) {
                    rply.text = translate('random_ans.server_not_found');
                    return rply;
                }
                rply.text += translate('random_ans.custom_dice_detail', { title: temp.title });
                let tempanswer = temp.answer;
                for (let i in tempanswer) {
                    rply.text += (i == 0) ? '#' + i + ": " + tempanswer[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + '#' + i + ": " + tempanswer[i] + "        " : (i == 0) ? '' : '#' + i + ": " + tempanswer[i] + "        ";
                }
                return rply;
            }
            getData = await schema.randomAnsServer.find({}).lean().catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData || getData.length === 0) {
                rply.text = translate('random_ans.server_empty', {
                    version_note: translate('random_ans.version_note')
                });
                return rply
            }
            rply.text += translate('random_ans.server_list_header');
            for (let a in getData) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + '#' + getData[a].serial + ": " + getData[a].title : "     " + '#' + getData[a].serial + ": " + getData[a].title;
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replaceAll(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replaceAll(/,/gm, ', ')
            rply.text += translate('random_ans.server_list_footer');
            return rply
        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /^(change)$/i.test(mainMsg[1]):
            {
                if (!isAdminUser(userid)) return rply;
                let allData = await schema.randomAnsAllgroup.findOne({}).lean().catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                if (!allData || !allData.randomAnsAllgroup) {
                    rply.text = translate('random_ans.server_migrate_not_found');
                    return rply;
                }
                let dataList = allData.randomAnsAllgroup;

                const toInsert = dataList.map((item, index) => ({
                    title: item[0],
                    answer: item.slice(1),
                    serial: index + 1
                }));
                if (toInsert.length > 0) {
                    await schema.randomAnsServer.insertMany(toInsert).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                }
                rply.text = translate('random_ans.admin_done', { count: dataList.length });
                return rply
            }
        case /(^[.]ras$)/i.test(mainMsg[0]) && /^(delete)$/i.test(mainMsg[1]):
            {
                if (!isAdminUser(userid)) return rply;
                const target = mainMsg.slice(2);
                let dataList = await schema.randomAnsServer.deleteMany(
                    {
                        "serial": isNumber(target)
                    }
                ).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
                rply.text = translate('random_ans.admin_done', { count: dataList.n });
                return rply
            }
        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            //
            //ras使用抽選功能
            //
            times = /^[.](r|)ras(\d+|)/i.exec(mainMsg[0])[2] || 1;
            let repeat = /^[.](r|)ras(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) times = 30;
            if (times < 1) times = 1
            const [, ...target] = escapeRegExp(mainMsg);
            getData = await schema.randomAnsServer.find(
                {
                    $or: [
                        { "title": { $regex: new RegExp(`^(${target.join('|')})$`, "i") } },
                        { "serial": isNumber(target) }]
                }
            ).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
            if (!getData || getData.length === 0) {
                rply.text = translate('random_ans.personal_roll_not_found', {
                    version_note: translate('random_ans.version_note')
                });
                return rply
            }
            for (let index = 0; index < getData.length; index++) {
                let temp = getData[index];
                if (repeat) {
                    //repeat mode
                    rply.text += translate('random_ans.roll_arrow', { title: temp.title });
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.answer.length) - 1;
                        rply.text += (num == 0) ? temp.answer[randomNumber] : ', ' + temp.answer[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += translate('random_ans.roll_arrow', { title: temp.title });
                    let items = [];
                    let tempItems = [...temp.answer]
                    if (tempItems.length === 0) continue;
                    while (items.length < times) {
                        items = [
                            ...tempItems
                                .map((a) => ({
                                    sort: Math.random(),
                                    value: a
                                }))
                                .sort((a, b) => a.sort - b.sort)
                                .map((a) => a.value),
                            ...items
                        ]
                    }
                    for (let num = 0; num < times; num++) {
                        rply.text += (num == 0) ? items[num] : ', ' + items[num];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                }

            }
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        }
        default:
            break;
    }

    async function replacer(first, second) {
        let temp = '',
            num = 0,
            temp2 = '';
        switch (true) {
            case /^ran:\d+/i.test(second):
                temp = /^ran:(\d+)/i.exec(second)
                if (!temp || !temp[1]) return ' ';
                return rollbase.Dice(temp[1]) || ' ';
            case /^random:\d+/i.test(second):
                temp = /^random:(\d+)-(\d+)/i.exec(second)
                if (!temp || !temp[1] || !temp[2]) return ' ';
                return rollbase.DiceINT(temp[1], temp[2]) || ' ';
            case /^allgp.name$/i.test(second):
                temp = await findGpMember(groupid);
                if (!temp) return ' ';
                num = rollbase.DiceINT(0, temp.length - 1)
                num = (num < 1) ? 0 : num;
                temp = (temp && temp[num] && temp[num].name) ? temp[num].name : ' ';
                return temp || ' ';
            // * {allgp.name} <---隨機全GP其中一人名字
            case /^allgp.title$/i.test(second):
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                if (!temp) return ' ';
                if (temp.Title.length === 0) {
                    temp.Title = exports.z_Level_system.Title();
                }
                temp2 = await temp.Title.filter(Boolean);
                num = rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = (temp2 && temp2[num]) ? temp2[num] : ' ';
                return temp;
            // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await findGpMember(groupid);
                num = (temp && temp.length > 0) ? Math.max(membercount, temp.length) : membercount;
                return num || ' ';
            //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second): {
                //* {my.RankingPer} 現在排名百分比 \
                // let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                let gpMember = await findGpMember(groupid);
                temp2 = await ranking(userid, gpMember)
                if (!temp2) return ' ';
                num = (temp && gpMember.length > 0) ? Math.max(membercount, gpMember.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10_000) / 100 + '%';
                return temp2 || ' ';
            }
            case /^my.Ranking$/i.test(second): {
                let gpMember = await findGpMember(groupid);
                //* {my.Ranking} 顯示擲骰者現在排名 \
                if (!gpMember) return ' ';
                return await ranking(userid, gpMember) || ' ';
            }
            case /^my.exp$/i.test(second):
                //* {my.exp} 顯示擲骰者經驗值
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.EXP) return ' ';
                return temp2.EXP || ' ';
            case /^my.name$/i.test(second):
                //* {my.name} <---顯示擲骰者名字
                return displaynameDiscord || displayname || translate('random_ans.unnamed');
            case /^my.title$/i.test(second):
                // * {my.title}<---顯示擲骰者稱號
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.Level || !temp.Title) return ' ';
                //   let userTitle = await this.checkTitle(userlevel, trpgLevelSystemfunction.trpgLevelSystemfunction[i].Title);
                return await exports.z_Level_system.checkTitle(temp2.Level, temp.Title) || ' ';
            case /^my.level$/i.test(second):
                //* {my.level}<---顯示擲骰者等級
                temp2 = await findUser(groupid, userid);
                if (!temp2 || !temp2.Level) return ' ';
                return temp2.Level || ' ';
            case /^br$/i.test(second):
                temp = '\n'
                return temp || ' ';
            default:
                break;
        }

    }
}


async function findGp(groupid) {
    if (!process.env.mongoURL || !groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = await schema.trpgLevelSystem.findOne({
        groupid: groupid
    }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
    if (!gpInfo || gpInfo.SwitchV2 != 1) return;
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}
async function findGpMember(groupid) {
    if (!process.env.mongoURL || !groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = await schema.trpgLevelSystemMember.find({
        groupid: groupid
    }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function findUser(groupid, userid) {
    if (!groupid || !userid) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    }).catch(error => console.error('[Random Ans] MongoDB error:', error.name, error.reason));
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return userInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function ranking(who, data) {
    let array = [];
    let answer = "0";
    for (let key in data) {
        await array.push(data[key]);
    }
    array.sort(function (a, b) {
        return b.EXP - a.EXP;
    });
    let rank = 1;
    for (let i = 0; i < array.length; i++) {
        if (i > 0 && array[i].EXP < array[i - 1].EXP) {
            rank++;
        }
        array[i].rank = rank;
    }
    for (let b = 0; b < array.length; b++) {
        if (array[b].userid == who)
            answer = b + 1;

    }
    return answer;
}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


function findTheNextSerial(list) {
    if (list.length === 0) return 1;
    let serialList = []
    for (let index = 0; index < list.length; index++) {
        serialList.push(list[index].serial);
    }
    serialList.sort(function (a, b) {
        return a - b;
    });
    //[1,2,4,5]
    for (let index = 0; index < serialList.length - 1; index++) {
        if (serialList[index] !== (index + 1)) {
            return index + 1
        }
    }
    return serialList[list.length - 1] + 1;
}

function isNumber(list) {
    let numberlist = [];
    for (let index = 0; index < list.length; index++) {
        let n = list[index];
        if (/^(?!0)\d+?$/.test(n))
            numberlist.push(n)
    }
    return numberlist;
}

function escapeRegExp(target) {
    if (typeof target == "string")
        return target.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`); // $& means the whole matched string
    if (Array.isArray(target)) {
        for (let index = 0; index < target.length; index++) {
            target[index] = target[index].replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        }
        return target;
    }
}

function parseAdminSecrets(rawAdminSecret) {
    if (!rawAdminSecret) return [];
    return rawAdminSecret
        .split(/[\s,;]+/)
        .map(secret => secret.trim())
        .filter(Boolean);
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('ra')
            .setDescription('【群組共用骰子】 使用群組共用的自定義骰子')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增群組骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addStringOption(option => option.setName('options').setDescription('骰子選項，用空格分隔').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示群組骰子清單')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱，不填則顯示全部')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除群組骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('roll')
                    .setDescription('使用群組骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('rroll')
                    .setDescription('使用群組骰子(可重複)')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('aroll')
                    .setDescription('使用群組骰子(動畫版)')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('name');
                    const options = interaction.options.getString('options').split(' ');
                    return `.ra add ${name} ${options.join(' ')}`;
                }
                case 'show': {
                    const showName = interaction.options.getString('name');
                    return showName ? `.ra show ${showName}` : `.ra show`;
                }
                case 'del': {
                    const delName = interaction.options.getString('name');
                    return `.ra del ${delName}`;
                }
                case 'roll': {
                    const rollName = interaction.options.getString('name');
                    const rollTimes = interaction.options.getInteger('times') || 1;
                    return rollTimes > 1 ? `.ra${rollTimes} ${rollName}` : `.ra ${rollName}`;
                }
                case 'rroll': {
                    const rrollName = interaction.options.getString('name');
                    const rrollTimes = interaction.options.getInteger('times') || 1;
                    return rrollTimes > 1 ? `.rra${rrollTimes} ${rrollName}` : `.rra ${rrollName}`;
                }
                case 'aroll': {
                    const arollName = interaction.options.getString('name');
                    return `.raa ${arollName}`;
                }
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('rap')
            .setDescription('【個人專用骰子】 使用個人專用的自定義骰子')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增個人骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addStringOption(option => option.setName('options').setDescription('骰子選項，用空格分隔').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示個人骰子清單')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱，不填則顯示全部')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除個人骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('roll')
                    .setDescription('使用個人骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('rroll')
                    .setDescription('使用個人骰子(可重複)')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('name');
                    const options = interaction.options.getString('options').split(' ');
                    return `.rap add ${name} ${options.join(' ')}`;
                }
                case 'show': {
                    const showName = interaction.options.getString('name');
                    return showName ? `.rap show ${showName}` : `.rap show`;
                }
                case 'del': {
                    const delName = interaction.options.getString('name');
                    return `.rap del ${delName}`;
                }
                case 'roll': {
                    const rollName = interaction.options.getString('name');
                    const rollTimes = interaction.options.getInteger('times') || 1;
                    return rollTimes > 1 ? `.rap${rollTimes} ${rollName}` : `.rap ${rollName}`;
                }
                case 'rroll': {
                    const rrollName = interaction.options.getString('name');
                    const rrollTimes = interaction.options.getInteger('times') || 1;
                    return rrollTimes > 1 ? `.rrap${rrollTimes} ${rrollName}` : `.rrap ${rrollName}`;
                }
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('ras')
            .setDescription('【全服務器骰子】 使用全服務器共用的自定義骰子')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增全服務器骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addStringOption(option => option.setName('options').setDescription('骰子選項，用空格分隔').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示全服務器骰子清單')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱，不填則顯示全部')))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('roll')
                    .setDescription('使用全服務器骰子')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('rroll')
                    .setDescription('使用全服務器骰子(可重複)')
                    .addStringOption(option => option.setName('name').setDescription('骰子名稱').setRequired(true))
                    .addIntegerOption(option => option.setName('times').setDescription('擲骰次數，預設1次，最多30次').setMinValue(1).setMaxValue(30)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('change')
                    .setDescription('管理員專用：同步舊資料到全服務器骰子'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('管理員專用：按序號刪除全服務器骰子')
                    .addStringOption(option => option.setName('serials').setDescription('序號，可填多個並以空格分隔').setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('name');
                    const options = interaction.options.getString('options').split(' ');
                    return `.ras add ${name} ${options.join(' ')}`;
                }
                case 'show': {
                    const showName = interaction.options.getString('name');
                    return showName ? `.ras show ${showName}` : `.ras show`;
                }
                case 'roll': {
                    const rollName = interaction.options.getString('name');
                    const rollTimes = interaction.options.getInteger('times') || 1;
                    return rollTimes > 1 ? `.ras${rollTimes} ${rollName}` : `.ras ${rollName}`;
                }
                case 'rroll': {
                    const rrollName = interaction.options.getString('name');
                    const rrollTimes = interaction.options.getInteger('times') || 1;
                    return rrollTimes > 1 ? `.rras${rrollTimes} ${rrollName}` : `.rras ${rrollName}`;
                }
                case 'change': {
                    return `.ras change`;
                }
                case 'del': {
                    const serials = interaction.options.getString('serials');
                    return `.ras delete ${serials}`;
                }
            }
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    discordCommand: discordCommand
};