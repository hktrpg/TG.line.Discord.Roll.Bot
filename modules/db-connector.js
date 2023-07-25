"use strict";
if (!process.env.mongoURL) return;
const schedule = require('node-schedule');
const restartTime = '30 04 */3 * *';
const master = require.main?.filename.includes('index');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const cachegoose = require('recachegoose');
/* mongoose.connect(process.env.mongoURL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
*/

cachegoose(mongoose, {
    engine: 'memory'
});
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
    if (!master) return;
    await connectMongoDB()
    const job = schedule.scheduleJob(restartTime, function () {
        console.log('04:30 reconnect MongoDB!!');
        restartMongoDB();
    });
})();


async function restartMongoDB() {
    mongoose.connection.close()
    await connectMongoDB();
}

mongoose.connection.on('error', err => {
    console.error('DB CONNECT ON GET ERROR: ' + err.name, err.reason);
    restartMongoDB();
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