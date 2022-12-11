"use strict";
const schedule = require('node-schedule');
if (!process.env.mongoURL) return;
const restartTime = '30 4 * * *';
const master = require.main?.filename.includes('index');
const mongoose = require('mongoose');

/* mongoose.connect(process.env.mongoURL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
*/
async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.mongoURL, {
            //    useNewUrlParser: true,
            //  useFindAndModify: false,
            //   useUnifiedTopology: true,
            socketTimeoutMS: 15000,
            //  poolSize: 10,
            //serverSelectionTimeoutMS: 5000,

        });
    } catch (err) {
        console.error('DB CONNECT GET ERROR: ' + err.name, err.reason)
    }
}

(async () => {
    connectMongoDB()

})();
const job = schedule.scheduleJob(restartTime, function () {
    //  console.log('04:30 reconnect MongoDB!!');
    //   restartMongoDB();
});

function restartMongoDB() {
    mongoose.connection.close()
    connectMongoDB();
}

mongoose.connection.on('error', err => {
    console.error('DB CONNECT ON GET ERROR: ' + err.name, err.reason)
});

const db = mongoose.connection;

db.on('error', console.error.bind('mlab connection error:', console));
db.once('open', function () {
    console.log('mlab  connected!');
    if (!master) return;
    require('fs').readdirSync(__dirname).forEach(function (file) {
        if (file.match(/\.js$/) && file.match(/^core-/)) {
            var name = file.replace('.js', '');
            exports[name] = require('./' + file);
        }
    });

});

module.exports = {
    mongoose
};