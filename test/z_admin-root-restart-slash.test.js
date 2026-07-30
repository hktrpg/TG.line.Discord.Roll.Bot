"use strict";

/**
 * /root restart|stop slash → `.root …` bridge + text handlers.
 */
process.env.SALT = process.env.SALT || 'test_salt';
process.env.CRYPTO_SECRET = process.env.CRYPTO_SECRET || 'test_crypto_secret';
process.env.ADMIN_SECRET = 'test_admin_id';

jest.mock('../modules/db/connector.js', () => ({
	mongoose: {
		connection: { readyState: 0, db: null },
		model: jest.fn(),
		Schema: jest.fn(),
	},
	isConnected: () => false,
}));

jest.mock('../modules/db/schema.js', () => ({
	accountPW: { findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() },
	allowRolling: {
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
		findOneAndDelete: jest.fn(),
	},
	veryImportantPerson: { updateOne: jest.fn() },
	theNewsMessage: { updateOne: jest.fn(), find: jest.fn() },
	discordRespawnSchedule: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
	mongodbState: jest.fn().mockResolvedValue({ connections: [] }),
	mongodbStateCheck: jest.fn().mockResolvedValue({ connections: [] }),
}));

jest.mock('../modules/db/protection-layer.js', () => ({
	getProtectionStatus: jest.fn().mockReturnValue({}),
	isDegraded: jest.fn().mockReturnValue(false),
}));

jest.mock('../modules/runtime/cluster-protection.js', () => ({
	getClusterHealth: jest.fn().mockReturnValue({}),
}));

jest.mock('../modules/patreon/veryImportantPerson.js', () => ({
	viplevelCheckUser: jest.fn().mockResolvedValue(0),
	viplevelCheckGroup: jest.fn().mockResolvedValue(0),
}));

jest.mock('../modules/patreon/patreon-sync.js', () => ({
	importPatreonCsv: jest.fn(),
}));

jest.mock('../modules/chat/check.js', () => ({
	permissionErrMsg: jest.fn(),
	flag: { ChkChannel: 1, ChkChannelAdmin: 2 },
}));

jest.mock('../modules/discord/deploy-commands.js', () => ({
	registeredGlobalSlashCommands: jest.fn(),
	testRegisteredSlashCommands: jest.fn(),
	removeSlashCommands: jest.fn(),
}));

jest.mock('../modules/runtime/schedule.js', () => ({
	agenda: null,
	JOB_NAME: 'dailyDiscordMaintenance',
	AGENDA_TIMEZONE: 'Asia/Hong_Kong',
	SCHEDULE_DOC_KEY: 'default',
	buildCronExpression: ({ dayOfWeek, hour, minute }) => `${minute} ${hour} * * ${dayOfWeek}`,
	getRespawnScheduleDoc: jest.fn().mockResolvedValue(null),
	syncDiscordMaintenanceSchedule: jest.fn().mockResolvedValue({
		cancelled: true,
		registered: false,
	}),
}));

jest.mock('../modules/roll-worker/local-worker', () => ({
	restart: jest.fn(),
	stop: jest.fn(),
	restartStandby: jest.fn(),
	restartPrimary: jest.fn(),
	stopStandby: jest.fn(),
	stopPrimary: jest.fn(),
	getStatus: jest.fn(),
	startIfConfigured: jest.fn(),
	shutdown: jest.fn(),
	isPrimaryStopped: jest.fn(() => false),
	isStandbyStopped: jest.fn(() => false),
}));

const adminModule = require('../roll/z_admin.js');
const localWorker = require('../modules/roll-worker/local-worker');

function mockRootInteraction({ subcommand, getString = () => null } = {}) {
	return {
		_hktrpgLocale: 'zh-tw',
		_hktrpgT: undefined,
		options: {
			getSubcommandGroup: jest.fn(() => null),
			getSubcommand: jest.fn(() => subcommand),
			getString: jest.fn((name) => getString(name)),
			getInteger: jest.fn(),
			getBoolean: jest.fn(),
			getAttachment: jest.fn(),
		},
	};
}

describe('/root restart|stop slash', () => {
	const rootCommand = adminModule.discordCommand.find((cmd) => cmd.data?.name === 'root');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('registers restart and stop; removes reload/respawn', () => {
		expect(rootCommand).toBeTruthy();
		const json = rootCommand.data.toJSON();
		const names = json.options.map((opt) => opt.name);
		expect(names).toContain('restart');
		expect(names).toContain('stop');
		expect(names).not.toContain('reload');
		expect(names).not.toContain('respawn');
		expect(names).not.toContain('respawnall');

		const restart = json.options.find((opt) => opt.name === 'restart');
		const target = restart.options.find((opt) => opt.name === 'target');
		expect(target.required).toBe(true);
		expect(target.choices.map((c) => c.value).sort()).toEqual([
			'all', 'discord', 'gateway', 'primary', 'standby',
		]);
	});

	it.each([
		['primary', '.root restart primary'],
		['standby', '.root restart standby'],
		['discord', '.root restart discord'],
		['gateway', '.root restart gateway'],
		['all', '.root restart all'],
	])('execute restart maps target=%s', async (target, expected) => {
		const text = await rootCommand.execute(mockRootInteraction({
			subcommand: 'restart',
			getString: (name) => (name === 'target' ? target : null),
		}));
		expect(text).toBe(expected);
	});

	it('execute restart discord with cluster_id', async () => {
		const text = await rootCommand.execute(mockRootInteraction({
			subcommand: 'restart',
			getString: (name) => {
				if (name === 'target') return 'discord';
				if (name === 'cluster_id') return '2';
				return null;
			},
		}));
		expect(text).toBe('.root restart discord 2');
	});

	it.each([
		['primary', '.root stop primary'],
		['standby', '.root stop standby'],
	])('execute stop maps target=%s', async (target, expected) => {
		const text = await rootCommand.execute(mockRootInteraction({
			subcommand: 'stop',
			getString: (name) => (name === 'target' ? target : null),
		}));
		expect(text).toBe(expected);
	});
});

describe('.root restart|stop text', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rejects invalid restart target', async () => {
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'restart', 'nope'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(result.text).toMatch(/primary\|standby|用法|Usage/i);
		expect(localWorker.restart).not.toHaveBeenCalled();
	});

	it('calls localWorker.restart(standby)', async () => {
		localWorker.restart.mockResolvedValue({
			ok: true,
			mode: 'self-restart',
			url: 'http://127.0.0.1:3951',
			pid: 42,
		});
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'restart', 'standby'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(localWorker.restart).toHaveBeenCalledWith('standby');
		expect(result.quotes).toBe(true);
		expect(result.text).toContain('【.root restart standby】成功');
	});

	it('calls localWorker.stop(primary)', async () => {
		localWorker.stop.mockResolvedValue({
			ok: true,
			mode: 'stopped',
			url: 'http://127.0.0.1:3950',
		});
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'stop', 'primary'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(localWorker.stop).toHaveBeenCalledWith('primary');
		expect(result.text).toContain('【.root stop primary】成功');
	});

	it('restart discord returns clusterIpc respawnall', async () => {
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'restart', 'discord'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
			botname: 'Discord',
		});
		expect(result.clusterIpc).toEqual(expect.objectContaining({ respawnall: true }));
		expect(result.text).toMatch(/restart discord/i);
	});
});
