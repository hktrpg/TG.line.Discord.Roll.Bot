"use strict";

const { isNonFatalApplicationError } = require('../utils/non-fatal-error');

describe('isNonFatalApplicationError', () => {
	it('returns false for empty reasons', () => {
		expect(isNonFatalApplicationError(null)).toBe(false);
		expect(isNonFatalApplicationError()).toBe(false);
	});

	it('detects TypeError / ReferenceError / RangeError / SyntaxError by name', () => {
		expect(isNonFatalApplicationError(new TypeError('x is not a function'))).toBe(true);
		expect(isNonFatalApplicationError(new ReferenceError('x is not defined'))).toBe(true);
		expect(isNonFatalApplicationError(new RangeError('out of range'))).toBe(true);
		expect(isNonFatalApplicationError(new SyntaxError('bad'))).toBe(true);
	});

	it('detects common message patterns', () => {
		expect(isNonFatalApplicationError({ message: 'translate is not a function' })).toBe(true);
		expect(isNonFatalApplicationError({ message: "Cannot read properties of undefined (reading 'x')" })).toBe(true);
		expect(isNonFatalApplicationError({ message: 'foo is not defined' })).toBe(true);
		expect(isNonFatalApplicationError({ message: "Cannot set properties of null (setting 'y')" })).toBe(true);
	});

	it('returns false for unrelated errors', () => {
		expect(isNonFatalApplicationError(new Error('MongoDB connection timed out'))).toBe(false);
		expect(isNonFatalApplicationError({ message: 'EPIPE' })).toBe(false);
	});
});
