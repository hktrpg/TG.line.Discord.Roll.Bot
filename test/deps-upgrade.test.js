"use strict";

/**
 * Compatibility checks for recently upgraded dependencies.
 * Uses real packages (not mocks) so import / API regressions surface early.
 */

const http = require('node:http');

describe('Dependency upgrade compatibility', () => {
    describe('chinese-conv v4 named exports', () => {
        test('exposes tify and sify as named exports for CJS require', () => {
            const chineseConv = require('chinese-conv');
            expect(typeof chineseConv.tify).toBe('function');
            expect(typeof chineseConv.sify).toBe('function');
        });

        test('supports destructured import style used by roll modules', () => {
            const { tify: chineseTify, sify: chineseSify } = require('chinese-conv');
            expect(chineseTify('简体')).toContain('簡');
            expect(chineseSify('繁體')).toContain('体');
        });
    });

    describe('axios-retry v4 CJS default export', () => {
        test('require(...).default is a function', () => {
            const axiosRetry = require('axios-retry').default;
            expect(typeof axiosRetry).toBe('function');
        });

        test('can attach retry interceptor to an axios instance', () => {
            const axios = require('axios');
            const axiosRetry = require('axios-retry').default;
            const client = axios.create();
            expect(() => axiosRetry(client, { retries: 1 })).not.toThrow();
        });
    });

    describe('mathjs v15 evaluate / randomInt', () => {
        const mathjs = require('mathjs');

        test('evaluate computes basic expressions', () => {
            expect(mathjs.evaluate('1+2*3')).toBe(7);
            expect(mathjs.evaluate('sqrt(9)')).toBe(3);
        });

        test('randomInt returns integers in range [min, max)', () => {
            for (let i = 0; i < 20; i++) {
                const value = mathjs.randomInt(1, 7);
                expect(Number.isInteger(value)).toBe(true);
                expect(value).toBeGreaterThanOrEqual(1);
                expect(value).toBeLessThan(7);
            }
        });

        test('named randomInt import used by pokemon.js works', () => {
            const { randomInt } = require('mathjs');
            const value = randomInt(0, 10);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(10);
        });
    });

    describe('sharp v0.35', () => {
        test('can create and encode a small PNG buffer', async () => {
            const sharp = require('sharp');
            const buffer = await sharp({
                create: {
                    width: 4,
                    height: 4,
                    channels: 3,
                    background: { r: 10, g: 20, b: 30 }
                }
            }).png().toBuffer();

            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.subarray(0, 8).equals(
                Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            )).toBe(true);
        });
    });

    describe('socket.io v4 Server API', () => {
        test('Server constructor accepts http server and cors options', async () => {
            const { Server } = require('socket.io');
            const server = http.createServer();

            const io = new Server(server, {
                cors: {
                    origin: ['http://127.0.0.1:20721', /\.hktrpg\.com$/],
                    methods: ['GET', 'POST'],
                    credentials: true
                }
            });

            expect(io).toBeDefined();
            expect(typeof io.on).toBe('function');
            expect(typeof io.emit).toBe('function');

            await new Promise((resolve, reject) => {
                server.listen(0, '127.0.0.1', (error) => (error ? reject(error) : resolve()));
            });

            const { port } = server.address();
            const response = await fetch(`http://127.0.0.1:${port}/socket.io/?EIO=4&transport=polling`);
            expect(response.status).toBe(200);
            const body = await response.text();
            expect(body).toContain('sid');

            await new Promise((resolve) => {
                io.close(() => {
                    server.close(() => resolve());
                });
            });
        });
    });

    describe('mongoose v9 API surface', () => {
        test('exports Schema and model factories', () => {
            const mongoose = require('mongoose');
            expect(typeof mongoose.Schema).toBe('function');
            expect(typeof mongoose.model).toBe('function');
            expect(mongoose.version).toMatch(/^9\./);
        });
    });

    describe('upgraded module load paths', () => {
        test('roll modules using upgraded deps load without throw', () => {
            expect(() => require('../roll/1-funny.js')).not.toThrow();
            expect(() => require('../roll/digmon.js')).not.toThrow();
            expect(() => require('../roll/z_async_test.js')).not.toThrow();
            expect(() => require('../roll/0-advroll.js')).not.toThrow();
            expect(() => require('../roll/wheel-animator.js')).not.toThrow();
        });
    });
});
