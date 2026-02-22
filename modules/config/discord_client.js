const { Options, GatewayIntentBits, Partials } = require('discord.js');
const { getInfo } = require('discord-hybrid-sharding');

// Safely resolve sharding info. If clustering context isn't ready, fall back to 'auto'.
function resolveShardingInfo() {
    try {
        const info = getInfo();
        if (info && info.SHARD_LIST && info.TOTAL_SHARDS !== undefined) {
            return { shardList: info.SHARD_LIST, totalShards: info.TOTAL_SHARDS };
        }
    } catch {
        // ignore: occurs when not running inside a cluster child
    }
    return { shardList: 'auto', totalShards: 'auto' };
}

const channelFilter = channel => !channel.lastMessageId || 
    require('discord.js').SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 36_000;

const clientConfig = {
    sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
            interval: 900,  // Every 15 minutes
            lifetime: 600,  // Remove messages older than 10 minutes (keep roleReact/poll messages usable)
        },
        users: {
            interval: 900,
            lifetime: 300,
            filter: () => null,
        },
        threads: {
            interval: 900,
            lifetime: 300,
        }
    },
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0, // guild.commands
        BaseGuildEmojiManager: 0, // guild.emojis
        GuildBanManager: 0, // guild.bans
        GuildInviteManager: 0, // guild.invites
        GuildMemberManager: {
            maxSize: 10,
            // This will be configured after client is initialized
            // We can't use client.user.id here as client is not yet defined
            keepOverLimit: () => false, // Will be overridden later
        }, // guild.members
        GuildStickerManager: 0, // guild.stickers
        MessageManager: 100, // channel.messages (min 100 so messages with reactions stay for roleReact/poll)
        //PermissionOverwriteManager: 200, // channel.permissionOverwrites
        PresenceManager: 0, // guild.presences
        ReactionManager: 200, // message.reactions (must be >0 to tally poll reactions)
        ReactionUserManager: 200, // reaction.users (allow fetching unique user counts)
        StageInstanceManager: 0, // guild.stageInstances
        ThreadManager: 0, // channel.threads
        ThreadMemberManager: 0, // threadchannel.members
        UserManager: 50, // client.users
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
    ...(() => {
        const { shardList, totalShards } = resolveShardingInfo();
        return {
            shards: shardList,  // An array of shards that will get spawned
            shardCount: totalShards, // Total number of shards
        };
    })(),
    restRequestTimeout: 45_000, // Timeout for REST requests
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
        Partials.Reaction,
        Partials.User // required when not using privileged presence intent and for DM support
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