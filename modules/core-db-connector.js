"use strict";
if (process.env.mongoURL) {
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
                useFindAndModify: true,
                useUnifiedTopology: true
            });
        } catch (err) {
            console.log('error: ' + err)
        }
    })()


    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'mlab connection error:'));
    db.once('open', function () {
        console.log('mlab  connected!');
    });

    module.exports = {
        mongoose
    };

}