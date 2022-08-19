"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const fs = require('node:fs');
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
const guildId = process.env.DISCORD_CHANNEL_GUILDID || "628181436129607680";
const commands = []
    .map(command => command.toJSON());
const rest = new REST({ version: '9' }).setToken(channelSecret);





loadingSlashCommands();

//removeSlashCommands();
//testRegisteredSlashCommands();
//registeredGlobalSlashCommands();


function registeredGlobalSlashCommands() {
    rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => {
            console.log('Successfully Global registered application commands.')
        })
        .catch(err => {
            console.error(err)
        });
}

function testRegisteredSlashCommands() {
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('Successfully registered application commands.')
        })
        .catch(err => {
            console.error(err)
        });
}





function loadingSlashCommands() {
    const commandFiles = fs.readdirSync('./roll/').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`../roll/${file}`);
        if (command && command.discordCommand) {
            pushArraySlashCommands(command.discordCommand)
        }
    }

}
function pushArraySlashCommands(arrayCommands) {
    for (const file of arrayCommands) {
        commands.push(file.data.toJSON());
    }
}


function removeSlashCommands() {
    //remove all old command, devlopment only
    rest.get(Routes.applicationGuildCommands(clientId, guildId))
        .then(data => {
            const promises = [];
            for (const command of data) {
                const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
                promises.push(rest.delete(deleteUrl));
            }
            return Promise.all(promises);
        });
}
//https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling

    //https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//    https://discordjs.guide/popular-topics/builders.html#links