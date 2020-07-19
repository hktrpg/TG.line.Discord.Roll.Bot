"use strict";
if (process.env.DISCORD_CHANNEL_SECRET) {
	const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
	const {
		ShardingManager
	} = require('discord.js');
	const manager = new ShardingManager('./discord_bot.js', {
		token: channelSecret
	});

	manager.spawn();
	manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

}