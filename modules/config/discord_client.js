const { Options, GatewayIntentBits, Partials } = require('discord.js');
const { getInfo } = require('discord-hybrid-sharding');

const channelFilter = channel => !channel.lastMessageId || 
    require('discord.js').SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 36000;

const clientConfig = {
    sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
            interval: 1800, // Every hour...
            lifetime: 900,  // Remove messages older than 30 minutes.
        },
        users: {
            interval: 1800, // Every hour...
            lifetime: 900,  // Remove messages older than 30 minutes.
            filter: () => null,
        },
        threads: {
            interval: 1800, // Every hour...
            lifetime: 900,  // Remove messages older than 30 minutes.
        }
    },
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0, // guild.commands
        BaseGuildEmojiManager: 0, // guild.emojis
        GuildBanManager: 0, // guild.bans
        GuildInviteManager: 0, // guild.invites
        GuildMemberManager: {
            maxSize: 200,
            // This will be configured after client is initialized
            // We can't use client.user.id here as client is not yet defined
            keepOverLimit: (member) => false, // Will be overridden later
        }, // guild.members
        GuildStickerManager: 0, // guild.stickers
        MessageManager: 200, // channel.messages
        //PermissionOverwriteManager: 200, // channel.permissionOverwrites
        PresenceManager: 0, // guild.presences
        ReactionManager: 0, // message.reactions
        ReactionUserManager: 0, // reaction.users
        StageInstanceManager: 0, // guild.stageInstances
        ThreadManager: 0, // channel.threads
        ThreadMemberManager: 0, // threadchannel.members
        UserManager: 200, // client.users
        VoiceStateManager: 0,// guild.voiceStates

        //GuildManager: 200, // roles require guilds
        //RoleManager: 200, // cache all roles
        PermissionOverwrites: 0, // cache all PermissionOverwrites. It only costs memory if the channel it belongs to is cached
        ChannelManager: {
            maxSize: Infinity, // prevent automatic caching
            sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
            sweepInterval: 3600
        },
        GuildChannelManager: {
            maxSize: Infinity, // prevent automatic caching
            sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
            sweepInterval: 3600
        },
    }),
    shards: getInfo().SHARD_LIST,  // An array of shards that will get spawned
    shardCount: getInfo().TOTAL_SHARDS, // Total number of shards
    restRequestTimeout: 45000, // Timeout for REST requests
    /**
        cacheGuilds: true,
        cacheChannels: true,
        cacheOverwrites: false,
        cacheRoles: true,
        cacheEmojis: false,
        cachePresences: false
    */
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ], 
    partials: [
        Partials.Message, 
        Partials.Channel, 
        Partials.Reaction
    ],
};

// Function to update the config with client reference
clientConfig.updateWithClient = function(client) {
    if (client && client.user) {
        const botId = client.user.id;
        // Instead of trying to modify the cached config object directly,
        // update client's cache settings to use the botId
        if (client.options && client.options.makeCache && 
            client.options.makeCache.GuildMemberManager) {
            client.options.makeCache.GuildMemberManager.keepOverLimit = 
                (member) => member.id === botId;
        }
    }
};

module.exports = clientConfig; 