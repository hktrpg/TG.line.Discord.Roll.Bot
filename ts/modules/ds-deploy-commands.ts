"use strict";
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'REST'.
const { REST, Routes } = require('discord.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('node:fs');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'clientId'.
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelSec... Remove this comment to see the full error message
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'commands'.
const commands = []
    // @ts-expect-error TS(2339): Property 'toJSON' does not exist on type 'never'.
    .map(command => command.toJSON());
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rest'.
const rest = new REST().setToken(channelSecret);



// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
process.nextTick(() => {
    loadingSlashCommands();
});



//removeSlashCommands();
//testRegisteredSlashCommands();
//registeredGlobalSlashCommands();


// @ts-expect-error TS(2393): Duplicate function implementation.
async function registeredGlobalSlashCommands() {
    return rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => {
            console.log('Successfully Global registered application commands.')
            return "Successfully Global registered application commands.";
        })
        .catch((err: any) => {
            console.error(err)
            return "Error Global registered application commands." + err;
        });
}

// @ts-expect-error TS(2393): Duplicate function implementation.
async function testRegisteredSlashCommands(guildId: any) {
    return rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('Successfully registered application commands.')
            return "Successfully registered application commands." + (guildId);
        })
        .catch((err: any) => {
            console.error(err)
            return "Error Global registered application commands." + err;
        });
}





// @ts-expect-error TS(2393): Duplicate function implementation.
function loadingSlashCommands() {
    const commandFiles = fs.readdirSync('./roll/').filter((file: any) => file.endsWith('.js'));
    for (const file of commandFiles) {
        // @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
        const command = require(`../roll/${file}`);
        if (command?.discordCommand?.length > 0) {
            pushArraySlashCommands(command.discordCommand)
        }
    }

}
// @ts-expect-error TS(2393): Duplicate function implementation.
function pushArraySlashCommands(arrayCommands: any) {
    for (const file of arrayCommands) {
        commands.push(file.data.toJSON());
    }
}


// @ts-expect-error TS(2393): Duplicate function implementation.
function removeSlashCommands(guildId: any) {
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


// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    registeredGlobalSlashCommands,
    testRegisteredSlashCommands,
    removeSlashCommands
};
//https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling
//https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//https://discordjs.guide/popular-topics/builders.html#links