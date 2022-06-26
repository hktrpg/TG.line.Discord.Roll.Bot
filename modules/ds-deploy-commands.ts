"use strict";
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'SlashComma... Remove this comment to see the full error message
const { SlashCommandBuilder } = require('@discordjs/builders');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const { REST } = require('@discordjs/rest');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const { Routes } = require('discord-api-types/v9');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelSec... Remove this comment to see the full error message
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('node:fs');
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const guildId = process.env.DISCORD_CHANNEL_GUILDID || "628181436129607680";
const commands = []
    .map(command => (command as any).toJSON());
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
        .catch((err: any) => {
            console.error(err)
        });
}

function testRegisteredSlashCommands() {
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('Successfully registered application commands.')
        })
        .catch((err: any) => {
            console.error(err)
        });
}





function loadingSlashCommands() {
    const commandFiles = fs.readdirSync('./roll/').filter((file: any) => file.endsWith('.js'));
    for (const file of commandFiles) {
        // @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
        const command = require(`../roll/${file}`);
        if (command && command.discordCommand) {
            pushArraySlashCommands(command.discordCommand)
        }
    }

}
function pushArraySlashCommands(arrayCommands: any) {
    for (const file of arrayCommands) {
        commands.push(file.data.toJSON());
    }
}


function removeSlashCommands() {
    //remove all old command, devlopment only
    rest.get(Routes.applicationGuildCommands(clientId, guildId))
        .then((data: any) => {
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