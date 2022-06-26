"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const Agenda = require("agenda");
//const mongoConnectionString = "mongodb://127.0.0.1/agenda";
//const agenda = new Agenda({ mongo: mongoose.mongoose });

// Or override the default collection name:
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'agenda'.
const agenda = new Agenda({ db: { address: process.env.mongoURL, collection: 'agendaAtHKTRPG' }, maxConcurrency: 20000, defaultConcurrency: 2000 });

// or pass additional connection options:
// const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName', options: {ssl: true}}});

// or pass in an existing mongodb-native MongoClient instance
// const agenda = new Agenda({mongo: myMongoClient});



(async function () {
    // IIFE to give access to async/await
    try {
        await agenda.start()
    } catch (error) {
        console.error(`agenda start error #25`, error)
    }


})();


agenda.on("fail", (err: any, job: any) => {
    console.error(`#33 Job failed with error: ${err.message}`);
});
/**
 * 對schedule 中發佈的文字進行處理
 *
 * 先擲骰一次
 *
 * 有沒有結果，也把內容進行REPLACE
 * 支援{}類置換，
 * 
 */

//discordSchedule.scheduleAtMessage


// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    agenda
};