"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const commands = [
    new SlashCommandBuilder().setName('ping2').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('server2').setDescription('Replies with server info!'),
    new SlashCommandBuilder().setName('user2').setDescription('Replies with user info!'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(channelSecret);


(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands("544561773488111636"), { body: commands })
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();


    //https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//    https://discordjs.guide/popular-topics/builders.html#links