"use strict";
if (!process.env.mongoURL) {
    return;
}
const checkMongodb = require('../modules/dbWatchdog.js');
const adminSecret = process.env.ADMIN_SECRET;
const rollbase = require('./rollbase.js');
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
exports.z_Level_system = require('./z_Level_system');
const opt = {
    upsert: true,
    runValidators: true
}

const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [30, 200, 200, 500, 500, 500, 500, 500];
const FUNCTION_LIMIT_PERSONAL = [2, 200, 200, 500, 500, 500, 500, 500];
const gameName = function () {
    return '【自定義骰子/回應功能】 .ra(p)(s)(次數) (add del show 自定骰子名稱)'
}
const gameType = function () {
    return 'funny:randomAns:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.](r|)ra(\d+|p|p\d+|s|s\d+|)$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【自定義骰子/回應功能】
這是根據骰子名稱來隨機抽選功能,只要符合內容,以後就會隨機擲骰

輸入.ra add (骰子名稱) (選項1) (選項2) (選項3)即可增加骰子
重覆輸入，可以增加選項，總共上限3000字

輸入.ra show 顯示所有骰子名稱及編號
輸入.ra show (骰子名稱)顯示內容
輸入.ra del (骰子名稱) 即可刪除
輸入.ra(次數,最多30次) (骰子名稱1/編號)(骰子名稱2)(骰子名稱n) 即可不重覆隨機抽選 
輸入.rra(次數,最多30次) (骰子名稱1/編號)(骰子名稱2)...(骰子名稱n) 即可重覆隨機抽選

如使用.ra  是群組版, 供整個群組共用 
如使用.ras 是公開版, 在整個HKTRPG可以看到 
如使用.rap 是個人專用版, 只有自己可以使用 

例如輸入 .ras10 聖晶石召喚 即可十連抽了 

例如輸入 .ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 
再輸入.ra 九大陣營  就會輸出 九大陣營中其中一個
如果輸入.ra3 九大陣營  就會輸出 3次九大陣營
如果輸入.ra3 九大陣營 天干 地支 就會輸出 3次九大陣營 天干 地支
如果輸入.rra3 九大陣營 就會輸出3次有可能重覆的九大陣營
add 後面第一個是骰子名稱, 可以是漢字,數字和英文或emoji

--20210719 新增: 骰子名稱可用數字代替, 如編號5,可以輪入 .ra 5 --

新增指令 - 輸入.ras newType 可以觀看效果
* {br}          <--隔一行
* {ran:100}     <---隨機1-100
* {random:5-20} <---隨機5-20
* {server.member_count}  <---現在頻道中總人數 
* {my.name}     <---顯示擲骰者名字

以下需要開啓.level 功能
* {allgp.name}  <---隨機全GP其中一人名字
* {allgp.title}  <---隨機全GP其中一種稱號
* {my.RankingPer}  <---現在排名百分比 
* {my.Ranking}  <---顯示擲骰者現在排名 
* {my.exp}      <---顯示擲骰者經驗值
* {my.title}    <---顯示擲骰者稱號
* {my.level}    <---顯示擲骰者等級
`
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
    membercount
}) {
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
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            try {

                //
                //增加自定義關鍵字
                // .ra[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
                /*
                只限四張角色卡.
                使用VIPCHECK
                */
                lv = await VIP.viplevelCheckGroup(groupid);
                limit = FUNCTION_LIMIT[lv];
                if (!mainMsg[2]) rply.text += ' 沒有輸入骰子名稱.'
                if (!mainMsg[3]) rply.text += ' 沒有輸入骰子內容.'
                if (rply.text += checkTools.permissionErrMsg({
                    flag: checkTools.flag.ChkChannelManager,
                    gid: groupid,
                    role: userrole
                })) {
                    return rply;
                }

                getData = await schema.randomAns.findOne({ groupid: groupid }).catch(error => console.error('randomans #137 mongoDB error: ', error.name, error.reson));
                let update = false;
                let findIndex = getData && getData.randomAnsfunction.findIndex((e) => {
                    return e && e[0] && e[0].toLowerCase() == mainMsg[2].toLowerCase()
                })
                if (findIndex >= 0 && findIndex != null) {
                    let tempCheck = getData.randomAnsfunction[findIndex].join('') + mainMsg.slice(3).join('')
                    if (tempCheck.length > 3000) {
                        rply.text = '更新失敗. 總內容不得超過3000字'
                        return rply;
                    } else {
                        update = true;
                        getData.randomAnsfunction.set(findIndex, [...getData.randomAnsfunction[findIndex], ...mainMsg.slice(3)])
                    }
                }
                if (update) {
                    await getData.save();
                    rply.text = `更新成功\n輸入.ra ${mainMsg[2]} \n即可使用`
                    return rply;
                }
                if (getData && getData.randomAnsfunction.length >= limit) {
                    rply.text = '群組骰子上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                    return rply;
                }
                temp = {
                    randomAnsfunction: mainMsg.slice(2)
                }
                check = await schema.randomAns.updateOne({
                    groupid: groupid
                }, {
                    $push: temp, new: true
                }, opt).catch(error => console.error('randomans #168 mongoDB error: ', error.name, error.reson));
                if (check.modifiedCount || check.upsertedCount) {
                    rply.text = `✅ 新增成功\n` +
                        `🎲 骰子名稱：${mainMsg[2]}\n` +
                        `📝 選項數量：${mainMsg.slice(3).length}\n` +
                        `🔍 選項內容：${mainMsg.slice(3).join('、')}\n\n` +
                        `💡 使用方式：\n` +
                        `→ 一般抽取：.ra ${mainMsg[2]}\n` +
                        `→ 重複抽取：.rra ${mainMsg[2]}\n` +
                        `→ 指定次數：.ra[次數] ${mainMsg[2]}\n` +
                        `→ 添加選項：.ra add ${mainMsg[2]} [新選項]`;
                } else rply.text = '❌ 新增失敗，請稍後再試';

                return rply;

            } catch (error) {
                console.error(error)
            }
        }
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            //刪除自定義關鍵字
            if (!mainMsg[2]) {
                rply.text = '❌ 未輸入骰子名稱';
                return rply;
            }

            if (rply.text += checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            filter = {
                groupid: groupid,
            };
            getData = await schema.randomAns.findOne(filter).catch(error => console.error('randomans #189 mongoDB error: ', error.name, error.reson));
            if (!getData) {
                rply.text = '❌ 找不到骰組資料';
                return rply;
            }

            temp = getData.randomAnsfunction.filter(e => e[0].toLowerCase() === mainMsg[2].toLowerCase());
            if (temp.length == 0) {
                rply.text = `❌ 找不到名為「${mainMsg[2]}」的骰子\n` +
                    `💡 請輸入 .ra show 檢視現有骰子清單`;
                return rply;
            }

            temp.forEach(f => getData.randomAnsfunction.splice(getData.randomAnsfunction.findIndex(e => e[0] === f[0]), 1));
            check = await getData.save();

            if (check) {
                const deletedOptions = temp[0].slice(1); // 移除第一個元素(骰子名稱)
                rply.text = `✅ 刪除成功\n` +
                    `🎲 骰子名稱: ${temp[0][0]}\n` +
                    `📝 選項數量: ${deletedOptions.length}\n` +
                    `🔍 選項內容: ${deletedOptions.join(' ')}\n\n` +
                    `💡 你可以使用以下指令重新添加此骰子:\n` +
                    `.ra add ${temp[0][0]} ${deletedOptions.join(' ')}`;
            } else {
                rply.text = '❌ 刪除失敗，請稍後再試';
            }
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '❌ 此功能必須在群組中使用';
                return rply;
            }
            rply.quotes = true;
            getData = await schema.randomAns.findOne({ groupid: groupid }).catch(error => console.error('randomans #214 mongoDB error: ', error.name, error.reson));
            if (!getData || getData.randomAnsfunction.length == 0) {
                rply.text = `❌ 沒有已設定的骰子\n\n` +
                    `💡 本功能已改版：\n` +
                    `🎲 .ra  - 群組專用骰組\n` +
                    `🎲 .rap - 個人專用骰組\n` +
                    `🎲 .ras - 全服務器骰組`;
                return rply;
            }
            if (mainMsg[2]) {
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[2].toLowerCase());
                if (!temp) {
                    rply.text = `❌ 找不到名為「${mainMsg[2]}」的骰子\n💡 請輸入 .ra show 檢視現有骰子清單`;
                    rply.text += '\n\n💡 提示：';
                    rply.text += '\n🔸 .ra[次數] [骰子名稱] - 不重複抽取';
                    rply.text += '\n🔸 .rra[次數] [骰子名稱] - 重複抽取';
                    rply.text += '\n🔸 次數最多為30次';
                    return rply;
                }
                rply.text = `🎲 群組骰子：${temp[0]}\n`;
                rply.text += `📝 選項數量：${temp.length - 1}\n`;
                rply.text += `🔍 選項內容：\n`;
                for (let i = 1; i < temp.length; i++) {
                    rply.text += `#${i}：${temp[i]}\n`;
                }
                return rply;
            }

            rply.text = `📑 群組骰子列表\n`;
            for (let a in getData.randomAnsfunction) {
                rply.text += `#${a}：${getData.randomAnsfunction[a][0]}\n`;
            }
            rply.text += `\n💡 查看骰子內容：.ra show 骰子名稱\n`;
            rply.text += `💡 使用骰子：.ra 骰子名稱`;
            rply.text += '\n\n💡 提示：';
            rply.text += '\n🔸 .ra[次數] [骰子名稱] - 不重複抽取';
            rply.text += '\n🔸 .rra[次數] [骰子名稱] - 重複抽取';
            rply.text += '\n🔸 次數最多為30次';
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            if (!groupid) {
                rply.text = '❌ 此功能必須在群組中使用';
                return rply;
            }
            times = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[2] || 1;
            check = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) {
                times = 30;
                rply.text = '💡 最多投擲30次，已自動調整\n';
            }
            if (times < 1) times = 1;

            getData = await schema.randomAns.findOne({ groupid: groupid }).catch(error => console.error('randomans #248 mongoDB error: ', error.name, error.reson));
            if (!getData) {
                rply.text = '❌ 找不到骰組資料';
                return rply;
            }

            let results = [];
            let notFoundDices = [];
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp && mainMsg[i].match(/^\d+$/)) {
                    temp = getData.randomAnsfunction[mainMsg[i]]
                }
                if (!temp) {
                    notFoundDices.push(mainMsg[i]);
                    continue;
                }

                let rollResult = {
                    name: temp[0],
                    results: [],
                    mode: check ? '重複' : '不重複'
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
                        rollResult.warning = `⚠️ 要抽取${times}次但選項只有${tempItems.length}個，已自動調整為不重複抽取${tempItems.length}次`;
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
                rply.text = '❌ 找不到指定的骰子\n';
                if (notFoundDices.length > 0) {
                    rply.text += `💡 無效的骰子名稱：${notFoundDices.join('、')}\n`;
                    rply.text += `💡 請使用 .ra show 檢視可用的骰子清單`;
                }
                return rply;
            }

            rply.text = results.map(roll => {
                let output = [];
                output.push(`🎲 ${roll.name}`);
                output.push(`📋 模式：${roll.mode}抽取 | 抽取次數：${roll.results.length}次`);
                if (roll.warning) {
                    output.push(roll.warning);
                }
                output.push('');  // 空行
                output.push(roll.results.map(r =>
                    `#${r.index.toString().padStart(2, '0')} → ${r.value}`
                ).join('\n'));
                return output.join('\n');
            }).join('\n\n══════════════\n\n');

            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);




            return rply;
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            {    //
                //增加自定義關鍵字
                // .rap[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
                lv = await VIP.viplevelCheckUser(userid);
                limit = FUNCTION_LIMIT_PERSONAL[lv];
                if (!mainMsg[2])
                    rply.text += ' 沒有輸入骰子名稱.'
                if (!mainMsg[3])
                    rply.text += ' 沒有輸入骰子內容.'
                if (!userid)
                    rply.text += ' 此功能必須使用聊天軟件，在個人身份中使用.'
                if (rply.text) {
                    rply.text = '新增失敗.\n' + rply.text;
                    return rply;
                }
                getData = await schema.randomAnsPersonal.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") }, "userid": userid }).catch(error => console.error('randomans #306 mongoDB error: ', error.name, error.reson));
                const [, , , ...rest] = mainMsg;
                const answerLength = getData && getData.answer.join('').length;

                if (getData && (answerLength + rest.length) > 2000) {
                    rply.text = '更新失敗. 總內容不得超過2000字'
                    return rply;
                }
                if (getData && getData.answer) {
                    getData.answer.push.apply(getData.answer, rest);
                    let result = await getData.save({ new: true });
                    rply.text = `更新成功  \n序號: ${result.serial}\n標題: ${result.title}\n內容: ${result.answer}\n\n輸入 .rap ${result.title}\n或 .rap ${result.serial} \n即可使用`
                    return rply;
                }

                let list = await schema.randomAnsPersonal.find({ userid: userid }, 'serial').catch(error => console.error('randomans #321 mongoDB error: ', error.name, error.reson));
                if (list && list.length >= limit) {
                    rply.text = '個人骰子上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
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
                    rply.text = `新增成功  \n序號: ${checkResult.serial}\n標題: ${checkResult.title}\n內容: ${checkResult.answer}\n\n輸入 .rap ${checkResult.title}\n或 .rap ${checkResult.serial} \n再輸入.rap add ${mainMsg[2]} 可以添加內容`
                } catch (error) {
                    rply.text = '新增失敗, 請稍後再試'
                    console.error('randomans #331 mongoDB error: ', error.name, error.reson)
                }
                return rply;
            }
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            rply.quotes = true;
            if (mainMsg[2]) {
                temp = await schema.randomAnsPersonal.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") }, "userid": userid }).catch(error => console.error('randomans #346 mongoDB error: ', error.name, error.reson));
                if (!temp) {
                    rply.text = '找不到該骰子名稱, 請重新檢查'
                    return rply;
                }
                rply.text += `自定義骰子  \n標題: ${temp.title} \n`
                let tempanswer = temp.answer;
                for (let i in tempanswer) {
                    rply.text += (i == 0) ? '#' + i + ": " + tempanswer[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + '#' + i + ": " + tempanswer[i] + "        " : (i == 0) ? '' : '#' + i + ": " + tempanswer[i] + "        ";
                }
                return rply;
            }
            getData = await schema.randomAnsPersonal.find({ "userid": userid }).catch(error => console.error('randomans #359 mongoDB error: ', error.name, error.reson));
            if (!getData || getData.length == 0) {
                rply.text = '沒有已設定的骰子.\n本功能已改版，\n.rap 轉成個人專用的骰組，\n原全服群組(.rap)變成.ras\n .ra => random answer (group) \n.rap => random answer personal \n .ras => random answer server'
                return rply
            }
            rply.text += '個人自定義骰子列表';
            for (let a in getData) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + '#' + getData[a].serial + ": " + getData[a].title : "     " + '#' + getData[a].serial + ": " + getData[a].title;
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            rply.text += '\n\n在.rap show 後面輸入骰子名稱, 可以顯示詳細內容\n\n輸入 .rap (列表序號或骰子名稱) 可以進行隨機擲骰';
            return rply

        case /(^[.]rap$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            {
                const [, , ...target] = escapeRegExp(mainMsg);
                let dataList = await schema.randomAnsPersonal.deleteMany(
                    { "title": { $regex: new RegExp('^(' + target.join('|') + ')$', "i") }, "userid": userid }
                ).catch(error => console.error('randomans #378 mongoDB error: ', error.name, error.reson));
                rply.text = dataList.n + ' 項已已刪除';
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
            ).catch(error => console.error('randomans #398 mongoDB error: ', error.name, error.reson));
            if (!getData || getData.length == 0) {
                rply.text = '沒有這骰子, 請重新再試.\n本功能已改版，\n.rap 轉成個人專用的骰組，\n原全服群組(.rap)變成.ras\n .ra => random answer (group) \n.rap => random answer personal \n .ras => random answer server'
                return rply
            }
            for (let index = 0; index < getData.length; index++) {
                let temp = getData[index];
                if (repeat) {
                    //repeat mode
                    rply.text += temp.title + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.answer.length) - 1;
                        rply.text += (num == 0) ? temp.answer[randomNumber] : ', ' + temp.answer[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += temp.title + ' → ';
                    let items = [];
                    let tempItems = [...temp.answer]
                    if (tempItems.length === 0) continue;
                    while (items.length < times) {
                        items = tempItems
                            .map((a) => ({
                                sort: Math.random(),
                                value: a
                            }))
                            .sort((a, b) => a.sort - b.sort)
                            .map((a) => a.value)
                            .concat(items)
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
                    rply.text += ' 沒有輸入骰子名稱.'
                if (!mainMsg[3])
                    rply.text += ' 沒有輸入骰子內容.'
                if (!mainMsg[4])
                    rply.text += ' 沒有自定義骰子回應內容,至少兩個.'
                if (rply.text) {
                    rply.text = '新增失敗.\n' + rply.text;
                    return rply;
                }
                getData = await schema.randomAnsServer.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") } }).catch(error => console.error('randomans #451 mongoDB error: ', error.name, error.reson));
                if (getData) {
                    rply.text = '新增失敗. 和現存的骰子重複了名稱'
                    return rply;
                }

                const [, , , ...rest] = mainMsg;
                let list = await schema.randomAnsServer.find({}, 'serial');
                let newAnswer = new schema.randomAnsServer({
                    title: mainMsg[2],
                    answer: rest,
                    serial: findTheNextSerial(list)
                })
                if (list && list.length >= 100) {
                    rply.text = 'HKTRPG公用骰子上限' + limit + '個';
                    return rply;
                }
                try {
                    let checkResult = await newAnswer.save();
                    rply.text = `新增成功  \n序號: ${checkResult.serial}\n標題: ${checkResult.title}\n內容: ${checkResult.answer}\n\n輸入 .ras ${checkResult.title}\n或 .ras ${checkResult.serial} \n即可使用`
                } catch (error) {
                    rply.text = '新增失敗'
                    console.error('randomans #463 mongoDB error: ', error.name, error.reson)
                }
                return rply;
            }
        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            rply.quotes = true;
            if (mainMsg[2]) {
                temp = await schema.randomAnsServer.findOne({ "title": { $regex: new RegExp('^' + escapeRegExp(mainMsg[2]) + '$', "i") } }).catch(error => console.error('randomans #482 mongoDB error: ', error.name, error.reson));
                if (!temp) {
                    rply.text = '找不到這骰子名稱, 請重新檢查'
                    return rply;
                }
                rply.text += `自定義骰子  \n標題: ${temp.title} \n`
                let tempanswer = temp.answer;
                for (let i in tempanswer) {
                    rply.text += (i == 0) ? '#' + i + ": " + tempanswer[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + '#' + i + ": " + tempanswer[i] + "        " : (i == 0) ? '' : '#' + i + ": " + tempanswer[i] + "        ";
                }
                return rply;
            }
            getData = await schema.randomAnsServer.find({}).catch(error => console.error('randomans #495 mongoDB error: ', error.name, error.reson));
            if (!getData || getData.length == 0) {
                rply.text = '沒有已設定的骰子.\n本功能已改版，\n.rap 轉成個人專用的骰組，\n原全服群組(.rap)變成.ras\n .ra => random answer (group) \n.rap => random answer personal \n .ras => random answer server'
                return rply
            }
            rply.text += '全HKTRPG自定義骰子列表';
            for (let a in getData) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + '#' + getData[a].serial + ": " + getData[a].title : "     " + '#' + getData[a].serial + ": " + getData[a].title;
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            rply.text += '\n\n在.ras show 後面輸入骰子名稱, 可以顯示詳細內容\n輸入 .ras (列表序號或骰子名稱) 可以進行隨機擲骰'
            return rply
        case /(^[.](r|)ras(\d+|)$)/i.test(mainMsg[0]) && /^(change)$/i.test(mainMsg[1]):
            {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                let allData = await schema.randomAnsAllgroup.findOne({}).catch(error => console.error('randomans #512 mongoDB error: ', error.name, error.reson));
                let dataList = allData.randomAnsAllgroup;

                for (let index = 0; index < dataList.length; index++) {
                    //randomAnsServer
                    const [, ...rest] = dataList[index];
                    let newAnswer = new schema.randomAnsServer({
                        title: dataList[index][0],
                        answer: rest,
                        serial: index + 1
                    })
                    await newAnswer.save().catch(error => console.error('randomans #523 mongoDB error: ', error.name, error.reson));

                }
                rply.text = dataList.length + ' Done';
                return rply
            }
        case /(^[.]ras$)/i.test(mainMsg[0]) && /^(delete)$/i.test(mainMsg[1]):
            {
                if (!adminSecret) return rply;
                if (userid !== adminSecret) return rply;
                const [, , ...target] = mainMsg;
                let dataList = await schema.randomAnsServer.deleteMany(
                    {
                        "serial": isNumber(target)
                    }
                ).catch(error => console.error('randomans #538 mongoDB error: ', error.name, error.reson));
                rply.text = dataList.n + ' Done';
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
            ).catch(error => console.error('randomans #557 mongoDB error: ', error.name, error.reson));
            if (!getData || getData.length == 0) {
                rply.text = '沒有這骰子名稱, 請重新再試.\n本功能已改版，\n.rap 轉成個人專用的骰組，\n原全服群組(.rap)變成.ras\n .ra => random answer (group) \n.rap => random answer personal \n .ras => random answer server'
                return rply
            }
            for (let index = 0; index < getData.length; index++) {
                let temp = getData[index];
                if (repeat) {
                    //repeat mode
                    rply.text += temp.title + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.answer.length) - 1;
                        rply.text += (num == 0) ? temp.answer[randomNumber] : ', ' + temp.answer[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += temp.title + ' → ';
                    let items = [];
                    let tempItems = [...temp.answer]
                    if (tempItems.length === 0) continue;
                    while (items.length < times) {
                        items = tempItems
                            .map((a) => ({
                                sort: Math.random(),
                                value: a
                            }))
                            .sort((a, b) => a.sort - b.sort)
                            .map((a) => a.value)
                            .concat(items)
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
                if (temp.Title.length == 0) {
                    temp.Title = exports.z_Level_system.Title();
                }
                temp2 = await temp.Title.filter(function (item) {
                    return item;
                });
                num = rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = (temp2 && temp2[num]) ? temp2[num] : ' ';
                return temp;
            // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await findGpMember(groupid);
                num = (temp && temp.length) ? Math.max(membercount, temp.length) : membercount;
                return num || ' ';
            //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second): {
                //* {my.RankingPer} 現在排名百分比 \
                // let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                let gpMember = await findGpMember(groupid);
                temp2 = await ranking(userid, gpMember)
                if (!temp2) return ' ';
                num = (temp && gpMember.length) ? Math.max(membercount, gpMember.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10000) / 100 + '%';
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
                return displaynameDiscord || displayname || "無名";
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
    }).catch(error => console.error('randomans #696 mongoDB error: ', error.name, error.reson));
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
    }).catch(error => console.error('randomans #709 mongoDB error: ', error.name, error.reson));
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function findUser(groupid, userid) {
    if (!groupid || !userid) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    }).catch(error => console.error('randomans #720 mongoDB error: ', error.name, error.reson));
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
        return target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    if (Array.isArray(target)) {
        for (let index = 0; index < target.length; index++) {
            target[index] = target[index].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        return target;
    }
}
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};