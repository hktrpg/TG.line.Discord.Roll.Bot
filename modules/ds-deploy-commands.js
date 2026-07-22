"use strict";
const fs = require('node:fs');
const { REST, Routes } = require('discord.js');
const i18n = require('./i18n.js');
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

function deployT(locale) {
    return i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
}

async function registeredGlobalSlashCommands(locale) {
    const t = deployT(locale);
    // Ensure commands are loaded before registering
    await loadingSlashCommands();

    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('[ds-deploy-commands] Successfully registered global commands');
        return t('admin.deploy_global_success');
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
                
                return t('admin.deploy_duplicate_global', { names: duplicates.join(', ') });
            } catch {
                return t('admin.deploy_duplicate_unknown', { message: error.message });
            }
        }
        
        return t('admin.deploy_global_failed', { message: error.message });
    }
}

async function testRegisteredSlashCommands(guildId, locale) {
    const t = deployT(locale);
    // Ensure commands are loaded before registering
    await loadingSlashCommands();

    return rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('[ds-deploy-commands] Successfully registered application commands.')
            return t('admin.deploy_guild_success', { guildId });
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
                            
                            return t('admin.deploy_duplicate_global', { names: duplicates.join(', ') });
                        })
                        .catch(() => {
                            return t('admin.deploy_duplicate_unknown', { message: error.message });
                        });
                } catch {
                    return t('admin.deploy_duplicate_unknown', { message: error.message });
                }
            }
            
            return t('admin.deploy_guild_failed', { message: error.message });
        });
}

function pushArraySlashCommands(arrayCommands) {
    for (const file of arrayCommands) {
        const commandData = file.data.toJSON();
        i18n.enrichSlashCommandLocalizations(commandData);
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
        return;
    }

    // Create loading promise
    loadingPromise = (async () => {
        try {
            console.log('[ds-deploy-commands] Loading slash commands...');
            await i18n.init();

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

async function removeSlashCommands(guildId, locale) {
    const t = deployT(locale);
    // Remove all guild application commands for the specified guild (development / cleanup only)
    try {
        const data = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
        if (!Array.isArray(data) || data.length === 0) {
            console.log(`[ds-deploy-commands] No guild commands to remove for guild ${guildId}`);
            return t('admin.deploy_remove_none', { guildId });
        }

        // 刪除時個別處理 10063 / 404（Unknown application command），避免整批失敗
        await Promise.all(
            data.map(command =>
                rest
                    .delete(Routes.applicationGuildCommand(clientId, guildId, command.id))
                    .catch(error => {
                        const code = error && String(error.code);
                        const status = error && error.status;
                        const isUnknownCommand = code === '10063' || status === 404;
                        if (isUnknownCommand) {
                            console.warn(
                                `[ds-deploy-commands] Command ${command.id} already gone (Unknown application command) for guild ${guildId}`,
                            );
                            return null;
                        }
                        throw error;
                    }),
            ),
        );

        console.log(`[ds-deploy-commands] Removed ${data.length} guild commands for guild ${guildId}`);
        return t('admin.deploy_remove_success', { count: data.length, guildId });
    } catch (error) {
        console.error('[ds-deploy-commands] Failed to remove guild commands:', error);
        return t('admin.deploy_remove_failed', { guildId, message: error.message });
    }
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