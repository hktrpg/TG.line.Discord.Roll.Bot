"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const moment = require('moment');
const VIP = require('../modules/veryImportantPerson');
const checkMongodb = require('../modules/dbWatchdog.js');
const FUNCTION_AT_LIMIT = [5, 25, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema')
const FUNCTION_CRON_LIMIT = [2, 15, 30, 45, 99, 99, 99, 99];
const agenda = require('../modules/schedule')
const CRON_REGEX = /^(\d\d)(\d\d)((?:-([1-9]?[1-9]|((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?))){0,1})/i;
const VALID_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const checkTools = require('../modules/check.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');



const gameName = function (params = {}) {
    return resolveGameName(params, 'schedule.game_name', '【定時發訊功能】.at /.cron  mins hours delete show');
}

const gameType = function () {
    return 'funny:schedule:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.at$|^\.cron$/i,
        second: null
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'schedule.help', () => getT({ locale: 'zh-tw' })('schedule.help'));
}

function buildCronScheduleText(checkTime, translate) {
    const weekDayNames = checkTime.weeks.map(d => VALID_DAYS[d]);
    const scheduleTextParts = [];
    if (checkTime.days) {
        scheduleTextParts.push(translate('schedule.cron_every_n_days', { days: checkTime.days }));
    }
    if (weekDayNames.length > 0) {
        scheduleTextParts.push(translate('schedule.cron_weekly', { days: weekDayNames.join(',') }));
    }
    let scheduleText = scheduleTextParts.join(' ');
    if (!scheduleText) {
        scheduleText = translate('schedule.cron_daily');
    }
    return scheduleText;
}

function formatInputErrorHelp(params) {
    return `${getT(params)('schedule.input_error_header')}\n ${getHelpMessage(params)}`;
}
const initialize = function () {
    return "";
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    //displayname,
    channelid,
    locale,
    t
    // displaynameDiscord,
    //membercount
}) {
    const i18nParams = { locale, t };
    const translate = getT(i18nParams);
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if (!differentPeformAt(botname)) {
        rply.text = translate('schedule.discord_telegram_only');
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage(i18nParams);
            rply.quotes = true;
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = translate('schedule.group_only');
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
                check = {
                    name: differentPeformAt(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error:', error.name, error.reason))
            rply.text = await showJobs(jobs, translate);
            if (userrole == 3 && botname == "Discord") {
                const groupJobsText = rply.text;
                const channelCheck = {
                    name: differentPeformAt(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                };
                const channelJobs = await agenda.agenda.jobs(channelCheck)
                    .catch(error => console.error('agenda error:', error.name, error.reason));
                const channelJobsText = await showJobs(channelJobs, translate);
                rply.text = translate('schedule.at_list_combined', { groupList: groupJobsText, channelList: channelJobsText });
            } else if (botname == "Discord" && userrole < 3) {
                rply.text = translate('schedule.at_list_channel', { list: rply.text });
            } else {
                rply.text = translate('schedule.at_list_group', { list: rply.text });
            }
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = translate('schedule.group_only');
                return rply
            }
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = translate('schedule.at_delete_usage');
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
                check = {
                    name: differentPeformAt(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error:', error.name, error.reason))

            // Ensure any legacy jobs in this delete query get serials too
            await ensureSerials(jobs, jobs[0]?.attrs?.name, jobs[0]?.attrs?.data?.groupid).catch(() => {});

            const targetNum = Number(mainMsg[2]);
            // Only match by stable serial. No index fallback, to prevent deleting wrong job
            // when list changed between show and delete.
            let targetJob = jobs.find(j => j.attrs.data && j.attrs.data.serial === targetNum);
            if (!targetJob) {
                rply.text = translate('schedule.at_not_found');
                return rply;
            }
            try {
                let data = targetJob;
                await targetJob.remove();
                rply.text = translate('schedule.at_deleted', {
                    serial: targetNum,
                    content: data.attrs.data.replyText
                });
            } catch (error) {
                console.error("Remove at Error removing job from collection. input:", inputStr, error);
                rply.text = translate('schedule.at_delete_error');
                return rply;
            }
            return rply;
        }
        case /^\.at+$/i.test(mainMsg[0]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = translate('schedule.group_only');
                return rply
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = Math.max(gpLv, lv);
            let limit = FUNCTION_AT_LIMIT[lv];
            let check = {
                name: differentPeformAt(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule  #171 mongoDB error:', error.name, error.reason));
            if (checkGroupid >= limit) {
                rply.text = translate('schedule.at_limit_reached', { limit });
                return rply;
            }
            let roleName = getAndRemoveRoleNameAndLink(inputStr);
            inputStr = roleName.newText;

            let checkTime = checkAtTime(mainMsg[1], mainMsg[2]);
            if (!checkTime || checkTime.time == "Invalid Date") {
                rply.text = formatInputErrorHelp(i18nParams);
                return rply;
            }
            let text = (checkTime.threeColum) ? inputStr.replace(/^\s?\S+\s+\S+\s+\S+\s+/, '') : inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            let date = checkTime.time;
            if (roleName.roleName || roleName.imageLink) {
                if (lv === 0) {
                    rply.text = translate('schedule.patreon_only_at');
                    return rply;
                }
                if (!roleName.roleName || !roleName.imageLink) {
                    rply.text = translate('schedule.role_incomplete_at');
                    return rply;
                }

            }

            let callBotname = differentPeformAt(botname);
            const serial = await getNextSerial(callBotname, groupid);
            const atData = { imageLink: roleName.imageLink, roleName: roleName.roleName, replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid, serial };
            await agenda.agenda.schedule(date, callBotname, atData).catch(error => console.error('agenda error:', error.name, error.reason))
            rply.text = translate('schedule.at_added', {
                time: moment(date).format('YYYY-MM-DD HH:mm'),
                serial,
                content: text
            });
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            let check = {}
            if (botname == "Discord" && userrole < 3) {
                check = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            } else check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            ).catch(error => console.error('agenda error:', error.name, error.reason))
            rply.text = await showCronJobs(jobs, translate);
            if (userrole == 3 && botname == "Discord") {
                const groupJobsText = rply.text;
                const channelCheck = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                };
                const channelJobs = await agenda.agenda.jobs(channelCheck)
                    .catch(error => console.error('agenda error:', error.name, error.reason));
                const channelJobsText = await showCronJobs(channelJobs, translate);
                rply.text = translate('schedule.cron_list_combined', { groupList: groupJobsText, channelList: channelJobsText });
            } else if (botname == "Discord" && userrole < 3) {
                rply.text = translate('schedule.cron_list_channel', { list: rply.text });
            } else {
                rply.text = translate('schedule.cron_list_group', { list: rply.text });
            }
            return rply;
        }
        case /^\.cron$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = translate('schedule.cron_delete_usage');
                return rply
            }
            let check = {}
            if (botname == "Discord" && userrole < 3) {
                check = {
                    name: differentPeformCron(botname),
                    "data.channelid": channelid,
                    "data.groupid": groupid
                }
            }
            else check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            const jobs = await agenda.agenda.jobs(
                check
            )

            // Ensure any legacy jobs in this delete query get serials too
            await ensureSerials(jobs, jobs[0]?.attrs?.name, jobs[0]?.attrs?.data?.groupid).catch(() => {});

            const targetNum = Number(mainMsg[2]);
            // Only match by stable serial. No index fallback, to prevent deleting wrong job
            // when list changed between show and delete.
            let targetJob = jobs.find(j => j.attrs.data && j.attrs.data.serial === targetNum);
            if (!targetJob) {
                rply.text = translate('schedule.cron_not_found');
                return rply;
            }
            try {
                let data = targetJob;
                await targetJob.remove();
                rply.text = translate('schedule.cron_deleted', {
                    serial: targetNum,
                    content: data.attrs.data.replyText
                });

            } catch {
                console.error("Remove Cron Error removing job from collection, input:", inputStr);
                rply.text = translate('schedule.cron_delete_error');
                return rply;
            }
            return rply;
        }
        case /^\.cron+$/i.test(mainMsg[0]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (!mainMsg[2]) rply.text += translate('schedule.no_content');
            if (rply.text) return rply;

            let lv = await VIP.viplevelCheckUser(userid);
            let gpLv = await VIP.viplevelCheckGroup(groupid);
            lv = Math.max(gpLv, lv);
            let limit = FUNCTION_CRON_LIMIT[lv];
            let check = {
                name: differentPeformCron(botname),
                "data.groupid": groupid
            }
            let checkGroupid = await schema.agendaAtHKTRPG.countDocuments(
                check
            ).catch(error => console.error('schedule #278 mongoDB error:', error.name, error.reason));
            if (checkGroupid >= limit) {
                rply.text = translate('schedule.cron_limit_reached', { limit });
                return rply;
            }
            let roleName = getAndRemoveRoleNameAndLink(inputStr);
            inputStr = roleName.newText;

            let checkTime = checkCronTime(mainMsg[1]);
            if (!checkTime || !checkTime.min || !checkTime.hour) {
                rply.text = `${formatInputErrorHelp(i18nParams)} `;
                return rply;
            }
            if (roleName.roleName || roleName.imageLink) {
                if (lv === 0) {
                    rply.text = translate('schedule.patreon_only_cron');
                    return rply;
                }
                if (!roleName.roleName || !roleName.imageLink) {
                    rply.text = translate('schedule.role_incomplete_cron');
                    return rply;
                }

            }


            let text = inputStr.replace(/^\s?\S+\s+\S+\s+/, '');
            // "0 6 * * *"
            let date = `${checkTime.min} ${checkTime.hour} *${checkTime.days ? `/${checkTime.days}` : ''} * ${(checkTime.weeks.length > 0) ? checkTime.weeks : '*'}`;

            let callBotname = differentPeformCron(botname);
            const serial = await getNextSerial(callBotname, groupid);
            const cronData = { imageLink: roleName.imageLink, roleName: roleName.roleName, replyText: text, channelid: channelid, quotes: true, groupid: groupid, botname: botname, userid: userid, createAt: new Date(Date.now()), serial };
            const job = agenda.agenda.create(callBotname, cronData);
            job.repeatEvery(date);

            try {
                await job.save();
            } catch {
                console.error("schedule #301 Error saving job to collection");
            }

            const scheduleText = buildCronScheduleText(checkTime, translate);

            rply.text = translate('schedule.cron_added', {
                schedule: scheduleText,
                hour: checkTime.hour,
                min: checkTime.min,
                serial
            });
            return rply;
        }
        default: {
            break;
        }
    }
}
function differentPeformAt(botname) {
    switch (botname) {
        case "Discord":
            return "scheduleAtMessageDiscord"

        case "Telegram":
            return "scheduleAtMessageTelegram"

        case "Whatsapp":
            return "scheduleAtMessageWhatsapp"

        default:
            break;
    }
}
function getAndRemoveRoleNameAndLink(input) {
    let roleName = /^name=(.*)\n/mi.test(input) ? input.match(/^name=(.*)\n/mi)[1] : null;
    let imageLink = /^link=(.*)\n/mi.test(input) ? input.match(/^link=(.*)\n/mi)[1] : null;
    return { newText: input.replace(/^link=.*\n/mi, "").replace(/^name=.*\n/im, ""), roleName, imageLink };
}

/**
 * Get next stable serial for scheduled jobs within a group.
 * This ensures user-facing 序號 remains fixed even after deletes/adds.
 */
async function getNextSerial(jobName, groupid) {
    if (!groupid) return 1;
    try {
        const existing = await schema.agendaAtHKTRPG.find({
            name: jobName,
            "data.groupid": groupid
        }).sort({ "data.serial": -1 }).limit(1).lean().catch(() => []);
        if (existing && existing.length > 0 && existing[0].data && typeof existing[0].data.serial === 'number') {
            return existing[0].data.serial + 1;
        }
    } catch (error) {
        console.error('getNextSerial error:', error.message);
    }
    return 1;
}

/**
 * Backfill stable serial for legacy jobs that don't have one yet.
 * Called during show so old jobs gradually get fixed 序號.
 * This mutates the job objects and saves them.
 */
async function ensureSerials(jobs, jobName, groupid) {
    if (!jobs || jobs.length === 0 || !groupid || !jobName) return jobs;

    // Get max serial for this specific job type (name) within the group.
    // .at and .cron are independent functions, so they have separate serial counters.
    // This keeps serials stable per type even across channel-scoped views for low-priv users.
    let maxSerial = 0;
    try {
        const maxDoc = await schema.agendaAtHKTRPG.find({
            name: jobName,
            "data.groupid": groupid
        }).sort({ "data.serial": -1 }).limit(1).lean();
        if (maxDoc && maxDoc.length > 0 && typeof maxDoc[0].data?.serial === 'number') {
            maxSerial = maxDoc[0].data.serial;
        }
    } catch (error) {
        console.error('ensureSerials max query error:', error.message);
    }

    const toBackfill = [];
    for (const job of jobs) {
        const ser = job.attrs.data && job.attrs.data.serial;
        if (typeof ser === 'number') {
            maxSerial = Math.max(maxSerial, ser);
        } else {
            toBackfill.push(job);
        }
    }

    if (toBackfill.length === 0) {
        // still sort for consistent order
        jobs.sort((a, b) => {
            const sa = (a.attrs.data && a.attrs.data.serial) || 0;
            const sb = (b.attrs.data && b.attrs.data.serial) || 0;
            if (sa && sb && sa !== sb) return sa - sb;
            return String(a.attrs._id || '').localeCompare(String(b.attrs._id || ''));
        });
        return jobs;
    }

    for (const job of toBackfill) {
        maxSerial += 1;
        job.attrs.data = job.attrs.data || {};
        job.attrs.data.serial = maxSerial;

        try {
            await job.save();
        } catch (error) {
            console.error('Failed to backfill serial for job:', error.message);
        }
    }

    // Re-sort the (filtered) list by the now-updated serials
    jobs.sort((a, b) => {
        const sa = (a.attrs.data && a.attrs.data.serial) || 0;
        const sb = (b.attrs.data && b.attrs.data.serial) || 0;
        if (sa && sb && sa !== sb) return sa - sb;
        return String(a.attrs._id || '').localeCompare(String(b.attrs._id || ''));
    });

    return jobs;
}

function differentPeformCron(botname) {
    switch (botname) {
        case "Discord":
            return "scheduleCronMessageDiscord"

        case "Telegram":
            return "scheduleCronMessageTelegram"

        case "Whatsapp":
            return "scheduleCronMessageWhatsapp"

        default:
            break;
    }


}
function checkAtTime(first, second) {
    //const date = new Date(2012, 11, 21, 5, 30, 0);
    //const date = new Date(Date.now() + 5000);
    //   如 20220604 1900 < 年月日 時間
    //5mins  (五分鐘後)
    //5hours (五小時後)
    switch (true) {
        case /^\d+mins$/i.test(first): {
            let time = first.match(/^(\d+)mins$/i)[1];
            if (time > 44_640) time = 44_640;
            if (time < 1) time = 1;
            time = moment().add(time, 'minute').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+hours$/i.test(first): {
            let time = first.match(/^(\d+)hours$/i)[1];
            if (time > 744) time = 744;
            if (time < 1) time = 1;
            time = moment().add(time, 'hour').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d+days$/i.test(first): {
            let time = first.match(/^(\d+)days$/i)[1];
            if (time > 31) time = 31;
            if (time < 1) time = 1;
            time = moment().add(time, 'day').toDate();
            return { time: time, threeColum: false };
        }
        case /^\d{8}$/i.test(first) && /^\d{4}$/i.test(second): {
            let time = moment(`${first} ${second}`, "YYYYMMDD hhmm").toDate();
            return { time: time, threeColum: true };
        }
        default:
            break;
    }
}
function checkCronTime(text) {
    //const date = {hour: 14, minute: 30}
    //@{text} - 1133  / 1155-wed / 1125-(1-99)
    let hour = text.match(CRON_REGEX) && text.match(CRON_REGEX)[1];
    let min = text.match(CRON_REGEX) && text.match(CRON_REGEX)[2];
    let days = text.match(CRON_REGEX) && !text.match(CRON_REGEX)[6] && text.match(CRON_REGEX)[4] || null;
    //let weeks = text.match(CRON_REGEX) && text.match(CRON_REGEX)[6] || null;
    let weeks = []
    if (hour == 24) {
        hour = "00";
    }
    if (min == 60) {
        min = "00";
    }
    for (let index = 0; index < VALID_DAYS.length; index++) {
        text.toLowerCase().includes(VALID_DAYS[index]) ? weeks.push(index) : null

    }


    if (min >= 0 && min <= 60 && hour >= 0 && hour <= 24)
        return { min, hour, days, weeks };
    else return;
}




async function showJobs(jobs, translate) {
    const t = translate || getT({});
    let reply = '';
    if (jobs && jobs.length > 0) {
        // Backfill serials for legacy jobs (old jobs without serial get stable ones now)
        let processedJobs = await ensureSerials(jobs, jobs[0]?.attrs?.name, jobs[0]?.attrs?.data?.groupid);

        // For .at (one-time), prefer chronological order by next run time for better UX
        processedJobs = [...processedJobs].sort((a, b) => {
            const ta = new Date(a.attrs.nextRunAt).getTime();
            const tb = new Date(b.attrs.nextRunAt).getTime();
            if (ta !== tb) return ta - tb;
            const sa = (a.attrs.data && a.attrs.data.serial) || 0;
            const sb = (b.attrs.data && b.attrs.data.serial) || 0;
            return sa - sb;
        });

        for (let index = 0; index < processedJobs.length; index++) {
            let job = processedJobs[index];
            const displayId = (job.attrs.data && job.attrs.data.serial) || (index + 1);
            const timeStr = moment(job.attrs.nextRunAt).format('YYYY-MM-DD HH:mm');
            reply += t('schedule.job_separator');
            reply += t('schedule.job_serial', { serial: displayId });
            reply += t('schedule.job_next_run', { time: timeStr });
            reply += t('schedule.job_content', { content: job.attrs.data.replyText });
        }
        reply += t('schedule.job_separator');
        reply += t('schedule.job_at_tip');
    } else {
        reply = t('schedule.no_at_jobs');
    }
    return reply;
}
async function showCronJobs(jobs, translate) {
    const t = translate || getT({});
    let reply = '';
    if (jobs && jobs.length > 0) {
        // Backfill serials for legacy jobs so old .cron tasks also get stable 序號
        const processedJobs = await ensureSerials(jobs, jobs[0]?.attrs?.name, jobs[0]?.attrs?.data?.groupid);

        for (let index = 0; index < processedJobs.length; index++) {
            let job = processedJobs[index];
            let createAt = job.attrs.data.createAt;

            const cronParts = job.attrs.repeatInterval.split(' ');
            const min = cronParts[0];
            const hour = cronParts[1];
            const dayOfMonth = cronParts[2];
            const dayOfWeek = cronParts[4];

            let scheduleText = '';

            const daysIntervalMatch = dayOfMonth.match(/\*\/(\d+)/);
            if (daysIntervalMatch) {
                scheduleText += t('schedule.cron_every_n_days', { days: daysIntervalMatch[1] });
            }

            if (dayOfWeek !== '*') {
                const weekDays = dayOfWeek.split(',').map(d => VALID_DAYS[Number.parseInt(d, 10)]).join(',');
                if (scheduleText) scheduleText += ' ';
                scheduleText += t('schedule.cron_weekly', { days: weekDays });
            }

            if (!scheduleText) {
                scheduleText = t('schedule.cron_daily');
            }

            const displayId = (job.attrs.data && job.attrs.data.serial) || (index + 1);
            const createStr = createAt ? moment(createAt).format('YYYY-MM-DD HH:mm') : t('schedule.unknown_time');
            reply += t('schedule.job_separator');
            reply += t('schedule.job_serial', { serial: displayId });
            reply += t('schedule.job_created', { time: createStr });
            reply += t('schedule.job_run', { schedule: scheduleText, hour, min });
            reply += t('schedule.job_content', { content: job.attrs.data.replyText });
        }
        reply += t('schedule.job_separator');
        reply += t('schedule.job_cron_tip');
    } else {
        reply = t('schedule.no_cron_jobs');
    }
    return reply;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('at')
            .setDescription('【⏰定時任務功能】單次定時')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('datetime')
                    .setDescription('指定時間發送訊息')
                    .addStringOption(option =>
                        option.setName('date')
                            .setDescription('日期 (YYYYMMDD)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('time')
                            .setDescription('時間 (HHMM)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('要發送的訊息內容')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('dice')
                            .setDescription('骰子指令 (使用[[]]包覆)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('發送者名稱 (僅限Patreoner)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('頭像連結網址 (僅限Patreoner)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('countdown')
                    .setDescription('計時模式發送訊息')
                    .addIntegerOption(option =>
                        option.setName('amount')
                            .setDescription('倒數時間')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('unit')
                            .setDescription('單位 (mins/hours)')
                            .setRequired(true)
                            .addChoices(
                                { name: '分鐘', value: 'mins' },
                                { name: '小時', value: 'hours' }
                            ))
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('要發送的訊息內容')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('dice')
                            .setDescription('骰子指令 (使用[[]]包覆)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('發送者名稱 (僅限Patreoner)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('頭像連結網址 (僅限Patreoner)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('查看定時任務列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除定時任務')
                    .addIntegerOption(option =>
                        option.setName('id')
                            .setDescription('要刪除的任務序號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'show': {
                    return '.at show';
                }
                case 'delete': {
                    const id = interaction.options.getInteger('id');
                    return `.at delete ${id}`;
                }
                case 'datetime': {
                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');
                    const message = interaction.options.getString('message');
                    const dice = interaction.options.getString('dice');
                    const name = interaction.options.getString('name');
                    const link = interaction.options.getString('link');

                    let command = `.at ${date} ${time} ${message}`;
                    if (dice) command += ` ${dice}`;
                    if (name) command += `\nname=${name}`;
                    if (link) command += `\nlink=${link}`;

                    return command;
                }
                case 'countdown': {
                    const amount = interaction.options.getInteger('amount');
                    const unit = interaction.options.getString('unit');
                    const message = interaction.options.getString('message');
                    const dice = interaction.options.getString('dice');
                    const name = interaction.options.getString('name');
                    const link = interaction.options.getString('link');

                    let command = `.at ${amount}${unit} ${message}`;
                    if (dice) command += ` ${dice}`;
                    if (name) command += `\nname=${name}`;
                    if (link) command += `\nlink=${link}`;

                    return command;
                }
                // No default
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('cron')
            .setDescription('【⏰定時任務功能】循環定時')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('daily')
                    .setDescription('每天定時發送訊息')
                    .addStringOption(option =>
                        option.setName('time')
                            .setDescription('時間 (HHMM)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('要發送的訊息內容')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('dice')
                            .setDescription('骰子指令 (使用[[]]包覆)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('發送者名稱 (僅限Patreoner)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('頭像連結網址 (僅限Patreoner)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('interval')
                    .setDescription('間隔天數發送訊息')
                    .addStringOption(option =>
                        option.setName('time')
                            .setDescription('時間 (HHMM)')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('days')
                            .setDescription('間隔天數')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('要發送的訊息內容')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('dice')
                            .setDescription('骰子指令 (使用[[]]包覆)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('發送者名稱 (僅限Patreoner)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('頭像連結網址 (僅限Patreoner)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('weekly')
                    .setDescription('指定星期發送訊息')
                    .addStringOption(option =>
                        option.setName('time')
                            .setDescription('時間 (HHMM)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('days')
                            .setDescription('星期 (例如: wed-mon)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('要發送的訊息內容')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('dice')
                            .setDescription('骰子指令 (使用[[]]包覆)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('發送者名稱 (僅限Patreoner)')
                            .setRequired(false))
                    .addStringOption(option =>
                        option.setName('link')
                            .setDescription('頭像連結網址 (僅限Patreoner)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('查看定時任務列表'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('刪除定時任務')
                    .addIntegerOption(option =>
                        option.setName('id')
                            .setDescription('要刪除的任務序號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'show': {
                    return '.cron show';
                }
                case 'delete': {
                    const id = interaction.options.getInteger('id');
                    return `.cron delete ${id}`;
                }
                case 'daily': {
                    const time = interaction.options.getString('time');
                    const message = interaction.options.getString('message');
                    const dice = interaction.options.getString('dice');
                    const name = interaction.options.getString('name');
                    const link = interaction.options.getString('link');

                    let command = `.cron ${time} ${message}`;
                    if (dice) command += ` ${dice}`;
                    if (name) command += `\nname=${name}`;
                    if (link) command += `\nlink=${link}`;

                    return command;
                }
                case 'interval': {
                    const time = interaction.options.getString('time');
                    const days = interaction.options.getInteger('days');
                    const message = interaction.options.getString('message');
                    const dice = interaction.options.getString('dice');
                    const name = interaction.options.getString('name');
                    const link = interaction.options.getString('link');

                    let command = `.cron ${time}-${days} ${message}`;
                    if (dice) command += ` ${dice}`;
                    if (name) command += `\nname=${name}`;
                    if (link) command += `\nlink=${link}`;

                    return command;
                }
                case 'weekly': {
                    const time = interaction.options.getString('time');
                    const days = interaction.options.getString('days');
                    const message = interaction.options.getString('message');
                    const dice = interaction.options.getString('dice');
                    const name = interaction.options.getString('name');
                    const link = interaction.options.getString('link');

                    let command = `.cron ${time}-${days} ${message}`;
                    if (dice) command += ` ${dice}`;
                    if (name) command += `\nname=${name}`;
                    if (link) command += `\nlink=${link}`;

                    return command;
                }
                // No default
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