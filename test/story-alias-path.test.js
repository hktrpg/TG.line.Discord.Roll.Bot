'use strict';

const path = require('node:path');
const {
	isValidStoryAlias,
	isPathSafeStoryAlias,
	resolveContainedStoryPath,
	STORY_TELLER_DIR,
} = require('../roll/z-story-teller.js');

describe('Story Teller alias path containment', () => {
	it('strict alias accepts ASCII-safe names only', () => {
		expect(isValidStoryAlias('demo')).toBe(true);
		expect(isValidStoryAlias('My_Story-01')).toBe(true);
		expect(isValidStoryAlias('my story')).toBe(false);
		expect(isValidStoryAlias('冒險')).toBe(false);
	});

	it('path-safe alias allows legacy names but blocks traversal', () => {
		expect(isPathSafeStoryAlias('my story')).toBe(true);
		expect(isPathSafeStoryAlias('冒險')).toBe(true);
		expect(isPathSafeStoryAlias('../package')).toBe(false);
		expect(isPathSafeStoryAlias('foo/bar')).toBe(false);
		expect(isPathSafeStoryAlias(String.raw`foo\bar`)).toBe(false);
		expect(isPathSafeStoryAlias('')).toBe(false);
		expect(isPathSafeStoryAlias('..')).toBe(false);
	});

	it('resolves legacy names inside storyTeller and rejects traversal', () => {
		expect(resolveContainedStoryPath('demo')).toBe(path.join(STORY_TELLER_DIR, 'demo.json'));
		expect(resolveContainedStoryPath('my story')).toBe(path.join(STORY_TELLER_DIR, 'my story.json'));
		expect(resolveContainedStoryPath('../package')).toBeNull();
		expect(resolveContainedStoryPath('a/b')).toBeNull();
	});

	it('strict mode rejects non-ASCII aliases for new imports', () => {
		expect(resolveContainedStoryPath('my story', { strict: true })).toBeNull();
		expect(resolveContainedStoryPath('demo', { strict: true })).toBe(path.join(STORY_TELLER_DIR, 'demo.json'));
	});
});
