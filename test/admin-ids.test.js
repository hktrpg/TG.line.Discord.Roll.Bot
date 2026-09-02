'use strict';

const { parseAdminIds, parseAdminSecrets } = require('../utils/admin-ids.js');

describe('utils/admin-ids', () => {
	it('parses comma / semicolon / whitespace separated IDs', () => {
		expect(parseAdminIds('a, b;c  d')).toEqual(['a', 'b', 'c', 'd']);
		expect(parseAdminSecrets('348092121267437568')).toEqual(['348092121267437568']);
	});

	it('returns empty array for missing input', () => {
		expect(parseAdminIds()).toEqual([]);
		expect(parseAdminIds('')).toEqual([]);
		expect(parseAdminIds(null)).toEqual([]);
	});

	it('aliases parseAdminSecrets to parseAdminIds', () => {
		expect(parseAdminSecrets).toBe(parseAdminIds);
	});
});
