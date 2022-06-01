"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
	return;
}
const sharp = require('sharp');
const Jimp = require('jimp');
const tokernMaker = async (imageLocation) => {
    try {
        const d = new Date();
        let time = d.getTime();
        let image = await Jimp.read('./views/image/ONLINE_TOKEN.png')
        let targetImage = await Jimp.read(imageLocation)
        targetImage.resize(Jimp.AUTO, 390)
        if (targetImage.bitmap.width < 378)
            targetImage.resize(378, Jimp.AUTO)
        if (targetImage.bitmap.width > 378)
            targetImage.crop((targetImage.bitmap.width - 378) / 2, 0, 378, targetImage.bitmap.height);


        image.composite(targetImage, 70, 27, {
            mode: Jimp.BLEND_DESTINATION_OVER
        })
        const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
        image.print(
            font,
            Jimp.HORIZONTAL_ALIGN_CENTER, Jimp.VERTICAL_ALIGN_BOTTOM,
            {
                text: '太惡',
                alignmentX: 0,
                alignmentY: 0
            }
        )
            .write(`./testImageMaskImage_${time}_${imageLocation.replaceAll('/', '')}.png`);

        return image;
    } catch (error) {
        console.log('error', error)
    }
}
tokernMaker('./test/a.png');

tokernMaker('./test/b.png');
tokernMaker('./test/c.png');
tokernMaker('./test/d.jpg');
tokernMaker('./test/f.jpg');
tokernMaker('./test/g.jpg');
tokernMaker('./test/h.jpg');
tokernMaker('./test/i.jpg');
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