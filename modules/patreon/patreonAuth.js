const patreon = require('patreon');
const config = require('./config');

const patreonOAuthClient = patreon.oauth(config.clientId, config.clientSecret);

function getLoginUrl() {
    return `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=identity%20identity.memberships`;
}

function handleCallback(code) {
    return patreonOAuthClient.getTokens(code, config.redirectUri)
        .then(tokens => ({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in
        }))
        .catch(err => {
            throw new Error('Failed to exchange code for tokens: ' + err.message);
        });
}

function refreshToken(refreshToken) {
    return patreonOAuthClient.refreshToken(refreshToken)
        .then(tokens => ({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in
        }))
        .catch(err => {
            throw new Error('Failed to refresh token: ' + err.message);
        });
}

module.exports = { getLoginUrl, handleCallback, refreshToken };