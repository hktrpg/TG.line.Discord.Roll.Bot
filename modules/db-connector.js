"use strict";
if (!process.env.mongoURL) return;
const mongoose = require('mongoose');
/* mongoose.connect(process.env.mongoURL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
*/

(async () => {
    try {
        await mongoose.connect(process.env.mongoURL, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
            // retry to connect for 60 times
            reconnectTries: 10,
            // wait 1 second before retrying
            reconnectInterval: 500
        });
    } catch (err) {
        console.error('DB CONNECT GET ERROR: ' + err.name, err.reason)
    }
})();


mongoose.connection.on('error', err => {
    console.error('DB CONNECT ON GET ERROR: ' + err.name, err.reason)
});

const db = mongoose.connection;

db.on('error', console.error.bind('mlab connection error:', console));
db.once('open', function () {
    console.log('mlab  connected!');
});

module.exports = {
    mongoose
};