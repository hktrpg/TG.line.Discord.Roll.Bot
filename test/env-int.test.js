'use strict';

const { parsePositiveIntEnv, parseNonNegativeIntEnv } = require('../utils/env-int.js');

describe('utils/env-int', () => {
	it('parsePositiveIntEnv requires > 0', () => {
		expect(parsePositiveIntEnv('X', 42, {})).toBe(42);
		expect(parsePositiveIntEnv('X', 42, { X: '0' })).toBe(42);
		expect(parsePositiveIntEnv('X', 42, { X: '12' })).toBe(12);
		expect(parsePositiveIntEnv('X', 42, { X: 'nope' })).toBe(42);
	});

	it('parseNonNegativeIntEnv allows 0', () => {
		expect(parseNonNegativeIntEnv('HEALTH_COORDINATOR_CLUSTER_ID', 0, {})).toBe(0);
		expect(parseNonNegativeIntEnv('HEALTH_COORDINATOR_CLUSTER_ID', 0, { HEALTH_COORDINATOR_CLUSTER_ID: '0' })).toBe(0);
		expect(parseNonNegativeIntEnv('HEALTH_COORDINATOR_CLUSTER_ID', 0, { HEALTH_COORDINATOR_CLUSTER_ID: '5' })).toBe(5);
		expect(parseNonNegativeIntEnv('HEALTH_COORDINATOR_CLUSTER_ID', 0, { HEALTH_COORDINATOR_CLUSTER_ID: '-1' })).toBe(0);
	});
});
