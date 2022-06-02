"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
const sharp = require('sharp');
const Jimp = require('jimp');
const axios = require('axios');
const getImage = async url => {
	//	const response = await axios(url, { responseType: 'arraybuffer' })
	//	const buffer64 = Buffer.from(response.data, 'binary').toString('base64')
	//	return buffer64


	return (await axios({ url, responseType: "arraybuffer" })).data;


}


const tokernMaker = async (imageLocation) => {
	try {
		//	let imageSteam = await getImage('https://i1.sndcdn.com/artworks-RS7ebM7TRAFPHKKU-7mHBgg-t500x500.jpg')
		//		console.log('imageSteam', imageSteam)
		const d = new Date();
		let time = d.getTime();
		let name = `testImageMaskImage_${time}_${imageLocation.replaceAll('/', '')}.png`
		let image = await sharp(imageLocation).resize({ height: 387, width: 375, fit: 'outside', withoutReduction: false })
		await image.toFile(`./new_${name}`)
		let newImage = await sharp((`./new_${name}`))
		let metadata = await newImage.metadata();
		console.log('metadata', metadata.width, metadata.height)
		let left = (parseInt((metadata.width - 375) / 2) < 0) ? 0 : parseInt((metadata.width - 375) / 2);
		let top = (parseInt((metadata.height - 387) / 2)) ? 0 : parseInt((metadata.height - 387) / 2);
		let width = (metadata.width < 375) ? metadata.width : 375;
		let height = (metadata.height < 387) ? metadata.height : 387;
		newImage = await newImage.extract({ left, top, width, height })
		await newImage.toFile(`./new2_${name}`)


		await sharp('./views/image/ONLINE_TOKEN.png')
			.composite(
				[{ input: `./new2_${name}`, blend: 'saturate', top: 28, left: 73 }
				]
			)
			.toFile(`./tzzzekImage234_${time}_${imageLocation.replaceAll('/', '')}.png`);





		//	return image;
	} catch (error) {
		console.log('error', error)
	}
}

 
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