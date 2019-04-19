const mongoose = require('mongoose');
if (process.env.mongoURL) {
    let uristring = process.env.mongoURL;
    mongoose.connect(uristring);
    //export 
    var switchJson;
    mongoose.connect(uristring, function (err, res) {
        if (err) {
            console.log('ERROR connecting to: ' + uristring + '. ' + err);
        } else {
            console.log('Succeeded connected to: ' + uristring);
            // console.log('allswitch: ' + allswitch);
            functionSwitch.find({})
                .exec(function (error, posts) {
                    switchJson = posts.map(function (p) {
                        return p.toJSON()
                    });
                    switchJson.forEach(function (functionSwitch) {
                        if (functionSwitch.groupid == '002') console.log('DONE');
                    });
                })
        }
    });

    var functionSchema = new mongoose.Schema({
        groupid: String,
        function_name: String,
        switch: String
    });


    // Compiles the schema into a model, opening (or creating, if
    // nonexistent) the 'PowerUsers' collection in the MongoDB database
    var functionSwitch = mongoose.model('functionSwitchs', functionSchema);

    module.exports = {
        functionSwitch: functionSwitch
    };

}
