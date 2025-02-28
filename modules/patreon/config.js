module.exports = {
    clientId: process.env.PATREON_CLIENT_ID,       // Set in environment variables
    clientSecret: process.env.PATREON_CLIENT_SECRET, // Set in environment variables
    redirectUri: process.env.PATREON_CLIENT_CALLBACK, // Update with your domain
    tierQuotas: {
        1: 5,   // Tier 1: 5 VIP slots
        2: 10,  // Tier 2: 10 VIP slots
        3: 20   // Tier 3 and above: 20 VIP slots
    },
    cacheDuration: 5 * 60 * 1000 // 5 minutes
};