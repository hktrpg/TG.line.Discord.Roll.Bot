"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const {
	ShardingManager
} = require('discord.js');

const manager = new ShardingManager('./modules/discord_bot.js', {
	token: channelSecret
});
const run = async () => {
	try {
		await manager.spawn();
	} catch (e) {
		console.log(`Failed to spawn shards: ${e} ${Object.entries(e)}`);
	}

};

run();
try {
	manager.on('shardCreate', shard => console.log(`Launched Discord shard ${shard.id}`));
} catch (error) {
	console.error(error);
}