"use strict";
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;

if (!channelSecret) {
    console.error('Discord channel secret is missing!');
    return;
}

const commands = [];
const rest = new REST({ version: '10' }).setToken(channelSecret);

process.nextTick(() => {
    loadingSlashCommands();
});

async function registeredGlobalSlashCommands() {
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Successfully registered global commands');
        return "Successfully registered global commands";
    } catch (error) {
        console.error('Failed to register global commands:', error);
        throw error;
    }
}

async function testRegisteredSlashCommands(guildId) {
    return rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('Successfully registered application commands.')
            return "Successfully registered application commands." + (guildId);
        })
        .catch(err => {
            console.error(err)
            return "Error Global registered application commands." + err;
        });
}

async function loadingSlashCommands() {
    try {
        const commandFiles = fs.readdirSync('./roll/').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(`../roll/${file}`);
                if (command?.discordCommand?.length > 0) {
                    pushArraySlashCommands(command.discordCommand);
                }
            } catch (error) {
                console.error(`Failed to load command from ${file}:`, error);
            }
        }
        console.log(`Loaded ${commands.length} slash commands`);
    } catch (error) {
        console.error('Failed to load commands:', error);
    }
}

function pushArraySlashCommands(arrayCommands) {
    for (const file of arrayCommands) {
        commands.push(file.data.toJSON());
    }
}

function removeSlashCommands(guildId) {
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

module.exports = {
    registeredGlobalSlashCommands,
    testRegisteredSlashCommands,
    removeSlashCommands
};
//https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling
//https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//https://discordjs.guide/popular-topics/builders.html#links