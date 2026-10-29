'use strict';

jest.mock('../modules/analytics', () => ({}));
jest.mock('../modules/roll-worker/character-action', () => ({}));
const { createRollWorkerApp } = require('../modules/roll-worker/server');

test('worker rejects unauthorized requests before its JSON parser', () => {
    const previous = process.env.ROLL_WORKER_TOKEN;
    process.env.ROLL_WORKER_TOKEN = 'isolated-test-token';
    try {
        const app = createRollWorkerApp({ disableRateLimit: true });
        const stack = app._router.stack;
        const jsonIndex = stack.findIndex(layer => layer.name === 'jsonParser');
        expect(jsonIndex).toBeGreaterThan(0);
        const auth = stack[jsonIndex - 1].handle;
        const req = { path: '/v1/parse', headers: { authorization: 'Bearer incorrect' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        auth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        req.headers.authorization = 'Bearer isolated-test-token';
        auth(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        clearInterval(app.locals.peerIdleTimer);
    } finally {
        if (previous === undefined) delete process.env.ROLL_WORKER_TOKEN;
        else process.env.ROLL_WORKER_TOKEN = previous;
    }
});
