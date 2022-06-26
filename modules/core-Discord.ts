"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.DISCORD_CHANNEL_SECRET) {
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
	return;
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelSec... Remove this comment to see the full error message
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Cluster'.
const Cluster = require('discord-hybrid-sharding');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require("./ds-deploy-commands");
const manager = new Cluster.Manager('./modules/discord_bot.js', {
	token: channelSecret,
	shardsPerClusters: 3,
	totalShards: "auto",
	mode: 'process', // you can also choose "worker"
	//spawnTimeout: -1,
	//respawn: true
});

// @ts-expect-error TS(7006): Parameter 'shard' implicitly has an 'any' type.
manager.on('clusterCreate', shard => {
	console.log(`Launched shard #${shard.id}`);
	shard.on('ready', () => {
		console.log(`Shard ready. Shard Count: #${shard.manager.totalShards}`)
	});
// @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
	shard.on('disconnect', (a, b) => {
		console.log('Shard disconnected');
		console.log(a);
		console.log(b);
	});
// @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
	shard.on('reconnecting', (a, b) => {
		console.log('Shard reconnecting');
		console.log(a);
		console.log(b);
	});
// @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
	shard.on('death', (a, b) => {
		console.log('Shard died');
		console.log(a);
		console.log(b);
	});
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	shard.on('error', (error) => {
		console.error(error)
	})
});
manager.spawn({ timeout: -1 });