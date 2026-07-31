'use strict';

const { isEnvEnabled } = require('../utils/env-flag.js');

describe('isEnvEnabled', () => {
	it('treats true/1/yes/on as enabled', () => {
		expect(isEnvEnabled('X', { X: 'true' })).toBe(true);
		expect(isEnvEnabled('X', { X: '1' })).toBe(true);
		expect(isEnvEnabled('X', { X: 'YES' })).toBe(true);
		expect(isEnvEnabled('X', { X: ' on ' })).toBe(true);
	});

	it('does not treat false/0/empty as enabled', () => {
		expect(isEnvEnabled('X', { X: 'false' })).toBe(false);
		expect(isEnvEnabled('X', { X: '0' })).toBe(false);
		expect(isEnvEnabled('X', { X: '' })).toBe(false);
		expect(isEnvEnabled('X', {})).toBe(false);
	});
});
