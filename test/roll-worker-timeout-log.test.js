"use strict";

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../modules/roll-worker/request-auth', () => ({ attachGatewayAuth: (body) => body }));

const axios = require('axios');
const client = require('../modules/roll-worker/client');

test('logs the actual per-request timeout rather than the default', async () => {
	const oldEnv = { ...process.env };
	const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		process.env.NODE_ENV = 'production';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:20612';
		process.env.ROLL_WORKER_ALLOW_NO_TOKEN = 'true';
		process.env.ROLL_WORKER_TIMEOUT_MS = '120000';
		const error = Object.assign(new Error('request timed out'), { code: 'ECONNABORTED' });
		axios.post.mockRejectedValueOnce(error);

		await expect(client.parse({ inputStr: '.ai test' }, { timeoutMs: 300_000 })).rejects.toBe(error);
		expect(axios.post.mock.calls[0][2].timeout).toBe(300_000);
		expect(warning).toHaveBeenCalledWith(expect.stringContaining('timeoutMs=300000'));
	} finally {
		process.env = oldEnv;
		warning.mockRestore();
	}
});
