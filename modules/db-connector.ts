"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) return;
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const master = require.main?.filename.includes('index');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'mongoose'.
const mongoose = require('mongoose');
/* mongoose.connect(process.env.mongoURL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
*/

(async () => {
    try {
        // @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
        await mongoose.connect(process.env.mongoURL, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
    } catch (err) {
        console.error('DB CONNECT GET ERROR: ' + (err as any).name, (err as any).reason);
    }
})();


mongoose.connection.on('error', (err: any) => {
    console.error('DB CONNECT ON GET ERROR: ' + err.name, err.reason)
});

const db = mongoose.connection;

db.on('error', console.error.bind('mlab connection error:', console));
db.once('open', function () {
    console.log('mlab  connected!');
    if (!master) return;
    // @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
    require('fs').readdirSync(__dirname).forEach(function (file: any) {
        if (file.match(/\.js$/) && file.match(/^core-/)) {
            var name = file.replace('.js', '');
            // @ts-expect-error TS(2304): Cannot find name 'exports'.
            exports[name] = require('./' + file);
        }
    });

});

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    mongoose
};