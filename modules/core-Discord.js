"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");
let maxShard = 1;
const manager = new ClusterManager('./modules/discord_bot.js', {
	token: channelSecret,
	shardsPerClusters: 3,
	totalShards: "auto",
	mode: 'process', // you can also choose "worker"
	//spawnTimeout: -1,
	//respawn: true
});
manager.on('clusterCreate', shard => {
	console.log(`Launched shard #${shard.id}`);
	shard.on('ready', () => {
		console.log(`Shard ready. Shard Count: #${shard.manager.totalShards}`)
		maxShard = Math.ceil(shard.manager.totalShards / 3);
	});
	shard.on('disconnect', (a, b) => {
		console.log('Shard disconnected');
		console.log(a);
		console.log(b);
	});
	shard.on('reconnecting', (a, b) => {
		console.log('Shard reconnecting');
		console.log(a);
		console.log(b);
	});
	shard.on('death', (a, b) => {
		console.log('Discord Shard died!!');
		//	console.log(a);
		//	console.log(b);
	});
	shard.on('error', (error) => {
		console.error(error)
	})
});
manager.on("clusterCreate", cluster => {
	cluster.on("message", async message => {
		console.log(message);
		if (message.respawn === true && message.id !== null) {
			console.log('Respawn message!! -> ', message.id);
			return manager.clusters.get(Number(message.id)).respawn({ delay: 100, timeout: 30000 });
		}
		if (message.respawnall === true) {
			console.log('Respawn all message!!');
			return manager.respawnAll({ clusterDelay: 5000, respawnDelay: 5500, timeout: 30000 });
		}
	})
});

(async function () {
	if (!agenda) return;

	agenda.define('0455restartdiscord', async (job) => {
		console.log('04:55 restart discord!!');
		for (let index = 0; index < maxShard; index++) {
			manager.clusters.get(Number(index)).respawn({ delay: 2000, timeout: -1 })

		}

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