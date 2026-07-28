"use strict";

/**
 * Shared classifier: which admin/root/patreon subs need live Discord on Roll Worker.
 * Kept outside roll/z_admin.js so Jest can unit-test without loading deploy-commands top-level return.
 */
function adminSubNeedsLiveDiscord(mainMsg0, mainMsg1) {
	const cmd = String(mainMsg0 || '').toLowerCase();
	const sub = String(mainMsg1 || '').toLowerCase();
	if (cmd === '.admin') {
		return !(!sub || sub === 'help' || sub === 'state' || sub === 'debug' || sub === 'id' || sub === 'mongod');
	}
	if (cmd === '.patreon') {
		return false;
	}
	if (cmd === '.root') {
		return !(!sub || sub === 'help');
	}
	return true;
}

module.exports = {
	adminSubNeedsLiveDiscord,
};
