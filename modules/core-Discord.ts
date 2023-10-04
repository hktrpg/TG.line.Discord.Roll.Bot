"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'agenda'.
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelSec... Remove this comment to see the full error message
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
require("./ds-deploy-commands");
let maxShard = 1;
const manager = new ClusterManager('./modules/discord_bot.js', {
	token: channelSecret,
	shardsPerClusters: 2,
	totalShards: "auto",
	//mode: 'process', // you can also choose "worker"
	//spawnTimeout: -1,
	//respawn: true
});
// @ts-expect-error TS(7006): Parameter 'shard' implicitly has an 'any' type.
manager.on('clusterCreate', shard => {
	console.log(`Launched shard #${shard.id}`);
	shard.on('ready', () => {
		console.log(`Shard ready. Shard Count: #${shard.manager.totalShards}`)
		maxShard = Math.ceil(shard.manager.totalShards / 3);
	});
// @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
	shard.on('disconnect', (a, b) => {
		console.log('Shard disconnected');
// @ts-expect-error TS(2693): 'any' only refers to a type, but is being used as ... Remove this comment to see the full error message
		console.log(a: any);
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
		console.log('Discord Shard died!!');
		//	console.log(a);
		//	console.log(b);
	});
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	shard.on('error', (error) => {
		console.error(error)
	})
});
// @ts-expect-error TS(7006): Parameter 'cluster' implicitly has an 'any' type.
manager.on("clusterCreate", cluster => {
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
	cluster.on("message", async message => {
		if (message.respawn === true && message.id !== null) {
			console.log('Respawn shared!! -> ', message.id);
			return manager.clusters.get(Number(message.id)).respawn({ delay: 100, timeout: 30000 });
		}
		if (message.respawnall === true) {
			console.log('Respawn all shared!!');
			return manager.respawnAll({ clusterDelay: 1000 * 60, respawnDelay: 500, timeout: 1000 * 60 * 2 });
		}
	})
});

(async function () {
	if (!agenda) return;

// @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
	agenda.define('0455restartdiscord', async (job) => {
		console.log('04:55 restart discord!!');
		manager.respawnAll({ clusterDelay: 1000 * 60, respawnDelay: 500, timeout: 1000 * 60 * 2 });

	});
})();

manager.extend(
	//new ReClusterManager(),
	new HeartbeatManager({
		interval: 2000, // Interval to send a heartbeat
		maxMissedHeartbeats: 10, // Maximum amount of missed Heartbeats until Cluster will get respawned
	})
)

manager.spawn({ timeout: -1 });
//manager.recluster?.start({ restartMode: 'gracefulSwitch', totalShards: getInfo().TOTAL_SHARDS })