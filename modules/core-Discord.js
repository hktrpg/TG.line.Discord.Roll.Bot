"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
const sharp = require('sharp');
const tokernMaker = async (imageLocation) => {
	try {
		const d = new Date();
		let time = d.getTime();
		let name = `./testImageMaskImage_${time}_${imageLocation.replaceAll('/', '')}.png`
		let targetImage = await sharp(imageLocation).resize({ height: 380 })

		let metadata = await targetImage.metadata()

		if (metadata.width < 390) {
			await targetImage.resize({ width: 390 })
			metadata = await sharp(name).metadata()
		}
		console.log('metadata', metadata.width, metadata.height)
		if (metadata.width > 390) {
			await targetImage.extract({ left: parseInt((metadata.width - 390) / 2), top: 0, width: 390, height: metadata.height }).toFile(name);
		}

		await sharp('./views/image/ONLINE_TOKEN.png')
			.composite(
				[{ input: name, top: 27, left: 70, blend: 'saturate' }
				]
			)
			.toFile(`./testImageMaskImage23_${time}_${imageLocation.replaceAll('/', '')}.png`);


		//	return image;
	} catch (error) {
		console.log('error', error)
	}
}
tokernMaker('./test/a.png');

//tokernMaker('./test/b.png');
//tokernMaker('./test/c.png');
//tokernMaker('./test/d.jpg');
//tokernMaker('./test/f.jpg');
//tokernMaker('./test/g.jpg');
//tokernMaker('./test/h.jpg');
//tokernMaker('./test/i.jpg');
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const Cluster = require('discord-hybrid-sharding');
require("./ds-deploy-commands");
const manager = new Cluster.Manager('./modules/discord_bot.js', {
	token: channelSecret,
	shardsPerClusters: 10,
	totalShards: "auto",
	mode: 'process', // you can also choose "worker"
	//spawnTimeout: -1,
	//respawn: true
});

manager.on('clusterCreate', shard => {
	console.log(`Launched shard #${shard.id}`);
	shard.on('ready', () => {
		console.log(`Shard ready. Shard Count: #${shard.manager.totalShards}`)
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
		console.log('Shard died');
		console.log(a);
		console.log(b);
	});
	shard.on('error', (error) => {
		console.error(error)
	})
});
manager.spawn({ timeout: -1 });