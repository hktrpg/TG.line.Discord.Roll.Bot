const mongoose = require('mongoose');
//const Schema = mongoose.Schema;
//const Message = mongoose.model('Message', schema);

const chattest = mongoose.model('chattest', {
    default: String,
    text: String,
    type: String
});
const block = mongoose.model('block', {
    groupid: String,
    blockfunction: String
});

const dog = mongoose.model('Dog', {
    name: String
});

module.exports = {
    dog,
    block,
    chattest
}
//const Cat = mongoose.model('Cat', { name: String });
//const kitty = new Cat({ name: 'Zildjian' });
/*
module.exports = new Schema({
    default: String,
    text: String,
    type: String

});
*/