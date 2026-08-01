'use strict';

/**
 * Per-file Jest cleanup: stop MongoDB connector retries / open sockets
 * so workers exit cleanly after suites that load schema/protection-layer.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

afterAll(async () => {
	try {
		const connectorPath = require.resolve('../modules/db/connector.js');
		if (!require.cache[connectorPath]) return;

		const connector = require('../modules/db/connector.js');
		if (typeof connector.notifyShuttingDown === 'function') {
			connector.notifyShuttingDown();
		}
		if (typeof connector.disconnect === 'function') {
			await Promise.race([
				connector.disconnect(),
				new Promise((resolve) => setTimeout(resolve, 2000)),
			]);
		}
	} catch {
		// Connector may be the no-mongoURL stub or already closed.
	}
});
