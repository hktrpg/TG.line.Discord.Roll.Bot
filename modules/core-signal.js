const {Client} = require("signal-bot");

const bot = new Client();

const prefix = "!";

bot.on("message", msg => {
  if (!msg.content.startsWith(prefix)) return;
  const command = msg.content.slice(prefix.length);

  if (command === "hello") {
    msg.conversation.sendMessage("Hello World!");
  } else if (command === "whoami") {
    msg.conversation.sendMessage(`You are ${msg.author.id}`);
  }
});

bot.connect();