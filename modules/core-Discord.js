"use strict";
if (process.env.DISCORD_CHANNEL_SECRET) {
	const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
	const {
		ShardingManager
	} = require('discord.js');


	const run = async () => {
		const manager = new ShardingManager('./modules/discord_bot.js', {
			token: channelSecret
		});
		try {
			console.log(manager.totalShards);
			await manager.spawn();
		} catch (e) {
			console.log(`Failed to spawn shards: ${e} ${Object.entries(e)}`);
		}
		await manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
	};

	run();


}