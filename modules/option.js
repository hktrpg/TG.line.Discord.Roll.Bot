
"use strict";
class Options {
    constructor() {
        const { Client, GatewayIntentBits, Partials, Options } = Discord;
        this._options = {
            discordOptions: {
                sweepers: {
                    ...Options.DefaultSweeperSettings,
                    messages: {
                        interval: 1800, // Every hour...
                        lifetime: 900,	// Remove messages older than 30 minutes.
                    },
                    users: {
                        interval: 1800, // Every hour...
                        lifetime: 900,	// Remove messages older than 30 minutes.
                        filter: () => null,
                    },
                    threads: {
                        interval: 1800, // Every hour...
                        lifetime: 900,	// Remove messages older than 30 minutes.
                    }
                },
                makeCache: Options.cacheWithLimits({
                    ApplicationCommandManager: 0, // guild.commands
                    BaseGuildEmojiManager: 0, // guild.emojis
                    GuildBanManager: 0, // guild.bans
                    GuildInviteManager: 0, // guild.invites
                    GuildMemberManager: {
                        maxSize: 200,
                        keepOverLimit: (member) => member.id === client.user.id,
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
                intents: [GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent], partials: [Partials.Message, Partials.Channel, Partials.Reaction],
            }

        };
    }
    get options() {
        return this._options;
    }
}
const options = new Options();
module.exports = options;