'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

// Exercise the real event handlers without starting WhatsApp, Chromium or a database.
const source = fs.readFileSync(path.join(__dirname, '../modules/core-Whatsapp.js'), 'utf8');
const handlers = source.slice(source.indexOf('\t\t// QR printing strategy:'),
	source.indexOf('\n\t\tasync function initializeWithRetry'));
const minute = 60_000;

function setup({ tty = false, writable = true } = {}) {
	const client = new EventEmitter();
	let now = 1_000_000;
	const log = jest.fn();
	const persist = jest.fn(() => ({
		ascii: 'test-ascii', asciiPaths: writable ? ['/qr/last-qr.ascii'] : [],
		payloadPaths: [], errors: writable ? [] : ['test write failure'],
	}));
	vm.runInNewContext(handlers, {
		client, persistWhatsappQrFiles: persist,
		process: { stdout: { isTTY: tty } },
		Date: { now: () => now }, console: { log, error: jest.fn() },
	});
	return { client, log, persist, at: (time) => { now = 1_000_000 + time; } };
}

test('one QR event per second only logs at exponentially spaced reminders', () => {
	const { client, log, persist, at } = setup();
	const notifiedAt = [];
	for (let second = 0; second <= 155 * 60; second++) {
		at(second * 1000);
		const previous = log.mock.calls.length;
		client.emit('qr', `qr-${second}`);
		if (log.mock.calls.length > previous) notifiedAt.push(second / 60);
	}
	// Intervals: immediate, then 5, 10, 20, 40, 80 minutes.
	expect(notifiedAt).toEqual([0, 5, 15, 35, 75, 155]);
	expect(persist).toHaveBeenCalledTimes(155 * 60 + 1);
	expect(persist).toHaveBeenLastCalledWith('qr-9300');
	expect(log.mock.calls[0][0]).toContain('QR RECEIVED');
	expect(log.mock.calls.slice(1).every(([line]) => line.includes('QR code refreshed'))).toBe(true);
});

test.each(['ready', 'disconnected'])('%s resets the next QR flow to an immediate reminder', (event) => {
	const { client, log, at } = setup();
	client.emit('qr', 'first');
	at(5 * minute);
	client.emit('qr', 'refresh');
	client.emit(event);
	log.mockClear();
	at(5 * minute + 1000);
	client.emit('qr', 'new-flow');
	expect(log).toHaveBeenCalledTimes(1);
	expect(log.mock.calls[0][0]).toContain('QR RECEIVED');
	at(10 * minute + 999);
	client.emit('qr', 'early');
	expect(log).toHaveBeenCalledTimes(1);
	at(10 * minute + 1000);
	client.emit('qr', 'due');
	expect(log).toHaveBeenCalledTimes(2);
});

test('TTY QR output and file-write warnings are throttled too', () => {
	const { client, log, persist, at } = setup({ tty: true, writable: false });
	client.emit('qr', 'first');
	at(1000);
	client.emit('qr', 'second');
	expect(persist).toHaveBeenCalledTimes(2);
	expect(log).toHaveBeenCalledTimes(2); // ASCII plus one failure hint.
	at(5 * minute);
	client.emit('qr', 'third');
	expect(log).toHaveBeenCalledTimes(4);
	expect(log.mock.calls[3][0]).toContain('could not write QR files');
});
