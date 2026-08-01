/**
 * Canonical Jest config is the "jest" field in package.json.
 * `yarn test` and CI use that config.
 *
 * This file re-exports it so `jest --config test/jest.config.js`
 * cannot accidentally diverge (older copies used a different setup).
 */
module.exports = require('../package.json').jest;
