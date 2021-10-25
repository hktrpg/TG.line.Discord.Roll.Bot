const Agenda = require("agenda");
const mongoose = require('./core-db-connector');
//const mongoConnectionString = "mongodb://127.0.0.1/agenda";
const agenda = new Agenda({ mongo: mongoose });

// Or override the default collection name:
// const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName'}});

// or pass additional connection options:
// const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName', options: {ssl: true}}});

// or pass in an existing mongodb-native MongoClient instance
// const agenda = new Agenda({mongo: myMongoClient});



(async function () {
    // IIFE to give access to async/await
    await agenda.start();

    await agenda.every("3 minutes", "delete old users");

    // Alternatively, you could also do:
    // await agenda.every("*/3 * * * *", "delete old users");
})();


agenda.define("delete old users", async (job) => {
    //await User.remove({ lastLogIn: { $lt: twoDaysAgo } });
    console.log("delete!")
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

const discordSchedule = require('./discord_bot');
//discordSchedule.scheduleAtMessage


async function scheduleSettup({ date, text, id, botname }) {
    switch (botname) {
        case 'Discord':
            console.log('AA')
            console.log(discordSchedule)
            await discordSchedule.scheduleAtMessage({ date, text, channelid: id })
            break;

        default:
            break;
    }
}

module.exports = {
    scheduleSettup
};