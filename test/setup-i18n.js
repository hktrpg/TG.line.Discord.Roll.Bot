/**
 * Ensure i18n bundles are loaded before roll-module tests resolve translated strings.
 */
const i18n = require('../modules/i18n.js');

beforeAll(async () => {
    await i18n.init();
});
