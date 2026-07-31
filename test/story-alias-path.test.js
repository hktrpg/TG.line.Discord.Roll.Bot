'use strict';

const path = require('node:path');
const {
	isValidStoryAlias,
	resolveContainedStoryPath,
	STORY_TELLER_DIR,
} = require('../roll/z-story-teller.js');

describe('Story Teller alias path containment', () => {
	it('accepts safe aliases', () => {
		expect(isValidStoryAlias('demo')).toBe(true);
		expect(isValidStoryAlias('My_Story-01')).toBe(true);
	});

	it('rejects traversal / unsafe aliases', () => {
		expect(isValidStoryAlias('../package')).toBe(false);
		expect(isValidStoryAlias('foo/bar')).toBe(false);
		expect(isValidStoryAlias(String.raw`foo\bar`)).toBe(false);
		expect(isValidStoryAlias('')).toBe(false);
	});

	it('resolves only inside storyTeller directory', () => {
		const ok = resolveContainedStoryPath('demo');
		expect(ok).toBe(path.join(STORY_TELLER_DIR, 'demo.json'));
		expect(resolveContainedStoryPath('../package')).toBeNull();
		expect(resolveContainedStoryPath('a/b')).toBeNull();
	});
});
