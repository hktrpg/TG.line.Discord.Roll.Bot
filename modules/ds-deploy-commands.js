"use strict";
const fs = require('node:fs');
const { REST, Routes } = require('discord.js');
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;

if (!channelSecret) {
    //console.warn('Discord channel secret is missing! Skipping slash command deployment.');
    return;
}

// Command management with singleton pattern
let commands = [];
let commandsLoaded = false;
let loadingPromise = null;

const rest = new REST({ version: '10' }).setToken(channelSecret);

async function registeredGlobalSlashCommands() {
    // Ensure commands are loaded before registering
    await loadingSlashCommands();

    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('[ds-deploy-commands] Successfully registered global commands');
        return "Successfully registered global commands";
    } catch (error) {
        console.error('Failed to register global commands:', error);
        
        // Check if it's a duplicate command name error
        if (error.code === 50_035 && error.rawError?.errors && 
            JSON.stringify(error.rawError.errors).includes('APPLICATION_COMMANDS_DUPLICATE_NAME')) {
            
            try {
                // Get existing commands to compare with new ones
                const existingCommands = await rest.get(Routes.applicationCommands(clientId))
                    .then(data => data.map(cmd => cmd.name));
                
                // Find duplicates by comparing with commands array
                const duplicates = commands
                    .filter(cmd => existingCommands.includes(cmd.name))
                    .map(cmd => cmd.name);
                
                return `Error: 發現重複的全域斜線指令名稱: ${duplicates.join(', ')}`;
            } catch {
                return `Error: 發現重複的全域斜線指令名稱，但無法確定哪些指令重複。錯誤: ${error.message}`;
            }
        }
        
        return `Failed to register global commands: ${error.message}`;
    }
}

async function testRegisteredSlashCommands(guildId) {
    // Ensure commands are loaded before registering
    await loadingSlashCommands();

    return rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('[ds-deploy-commands] Successfully registered application commands.')
            return "Successfully registered application commands." + (guildId);
        })
        .catch(error => {
            console.error(error);
            // Check if it's a duplicate command name error
            if (error.code === 50_035 && error.rawError?.errors && 
                JSON.stringify(error.rawError.errors).includes('APPLICATION_COMMANDS_DUPLICATE_NAME')) {
                
                // Extract command names for comparison
                const existingCommands = [];
                try {
                    // Get existing commands to compare with new ones
                    return rest.get(Routes.applicationGuildCommands(clientId, guildId))
                        .then(data => {
                            // Build list of existing commands
                            for (const cmd of data) existingCommands.push(cmd.name);
                            
                            // Find duplicates by comparing with commands array
                            const duplicates = commands
                                .filter(cmd => existingCommands.includes(cmd.name))
                                .map(cmd => cmd.name);
                            
                            return `Error: 發現重複的斜線指令名稱: ${duplicates.join(', ')}`;
                        })
                        .catch(() => {
                            return `Error: 發現重複的斜線指令名稱，但無法確定哪些指令重複。錯誤: ${error.message}`;
                        });
                } catch {
                    return `Error: 發現重複的斜線指令名稱，但無法確定哪些指令重複。錯誤: ${error.message}`;
                }
            }
            
            return "Error Global registered application commands: " + error.message;
        });
}

function pushArraySlashCommands(arrayCommands) {
    for (const file of arrayCommands) {
        const commandData = file.data.toJSON();
        // Check if command with same name already exists
        const existingIndex = commands.findIndex(cmd => cmd.name === commandData.name);
        if (existingIndex !== -1) {
            console.warn(`[WARNING] Duplicate command name detected: '${commandData.name}' - skipping duplicate from ${file}`);
            continue;
        }
        commands.push(commandData);
    }
}

// Check for duplicate command names in the commands array
function checkDuplicateCommands() {
    const commandNames = commands.map(cmd => cmd.name);
    const uniqueNames = new Set(commandNames);
    
    if (uniqueNames.size !== commandNames.length) {
        // Find the duplicates
        const duplicates = commandNames.filter((name, index) => {
            return commandNames.indexOf(name) !== index;
        });
        
        // Get unique duplicates
        const uniqueDuplicates = [...new Set(duplicates)];
        
        if (uniqueDuplicates.length > 0) {
            console.warn(`Warning: Found duplicate command names: ${uniqueDuplicates.join(', ')}`);
            return uniqueDuplicates;
        }
    }
    
    return null;
}

// Thread-safe singleton command loading
async function loadingSlashCommands() {
    // Return existing promise if loading is in progress
    if (loadingPromise) {
        return loadingPromise;
    }

    // Return immediately if already loaded
    if (commandsLoaded) {
        return Promise.resolve();
    }

    // Create loading promise
    loadingPromise = (async () => {
        try {
            console.log('[ds-deploy-commands] Loading slash commands...');

            // Ensure clean state
            commands = [];

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

            // Check for duplicates after loading all commands
            const duplicates = checkDuplicateCommands();
            if (duplicates) {
                console.warn(`Duplicate command names detected. Please fix these before registering: ${duplicates.join(', ')}`);
            }

            commandsLoaded = true;
            console.log(`[ds-deploy-commands] Successfully loaded ${commands.length} slash commands`);
        } catch (error) {
            console.error('Failed to load commands:', error);
            throw error;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
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

// Public initialization function for external callers
async function initializeCommands() {
    return loadingSlashCommands();
}

// Export functions and utilities
module.exports = {
    initializeCommands,
    registeredGlobalSlashCommands,
    testRegisteredSlashCommands,
    removeSlashCommands,
    checkDuplicateCommands,
    // Export for testing/debugging
    getCommandCount: () => commands.length,
    isLoaded: () => commandsLoaded
};
//https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling
//https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//https://discordjs.guide/popular-topics/builders.html#links