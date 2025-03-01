const patreon = require('patreon');
const config = require('./config');

let cache = {
    data: null,
    timestamp: 0
};

function getPatreonUserData(accessToken) {
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < config.cacheDuration) {
        return Promise.resolve(cache.data);
    }

    const patreonAPIClient = patreon.patreon(accessToken);
    return patreonAPIClient('/api/oauth2/v2/identity?include=memberships')
        .then(({ store }) => {
            console.log(store);
            const user = store.findAll('user')[0];
            const membership = store.findAll('membership')[0];
            const tier = membership ? parseInt(membership.attributes.patron_status || '0') : 0;
            cache.data = { userId: user.id, tier: tier > 3 ? 3 : tier };
            cache.timestamp = now;
            return cache.data;
        })
        .catch(err => {
            throw new Error('Failed to fetch Patreon data: ' + err.message);
        });
}

module.exports = { getPatreonUserData };