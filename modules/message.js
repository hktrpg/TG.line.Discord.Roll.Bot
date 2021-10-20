const fs = require('fs');
function joinMessage() {
	const rawdata = fs.readFileSync("./assets/message.json");
	const message = JSON.parse(rawdata);
	let newJoinMessage = ""
	for (let index = 0; index < message.joinMessage.length; index++) {
		newJoinMessage += message.joinMessage[index] + "\n";
	}
	return newJoinMessage;
}

module.exports = {
	joinMessage
};