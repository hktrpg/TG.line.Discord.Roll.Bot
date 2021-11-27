"use strict";
if (!process.env.mongoURL) return;
const master = require.main?.filename.includes('index');
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
            useUnifiedTopology: true
        });
    } catch (err) {
        console.error('DB CONNECT GET ERROR: ' + err)
    }
})();


const db = mongoose.connection;

db.on('error', console.error.bind(console, 'mlab connection error:'));
db.once('open', function () {
    console.log('mlab  connected!');
    if (!master) return;
    require('fs').readdirSync(__dirname).forEach(function (file) {
        if (file.match(/\.js$/) && file.match(/^core-/)) {
            console.log('file', file)
            var name = file.replace('.js', '');
            exports[name] = require('./' + file);
        }
    });

});

module.exports = {
    mongoose
};