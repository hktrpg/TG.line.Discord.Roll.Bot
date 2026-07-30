"use strict";

/**
 * /root reload slash → `.root reload …` bridge + text-command handler.
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
	reload: jest.fn(),
	reloadLocal: jest.fn(),
	reloadRemote: jest.fn(),
	getStatus: jest.fn(),
	startIfConfigured: jest.fn(),
	shutdown: jest.fn(),
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

describe('/root reload slash', () => {
	const rootCommand = adminModule.discordCommand.find((cmd) => cmd.data?.name === 'root');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('registers reload subcommand with target choices', () => {
		expect(rootCommand).toBeTruthy();
		const json = rootCommand.data.toJSON();
		const reload = json.options.find((opt) => opt.name === 'reload');
		expect(reload).toBeTruthy();
		expect(reload.type).toBe(1); // SUB_COMMAND
		expect(reload.description).toMatch(/Roll Worker|計算|compute/i);
		const target = reload.options.find((opt) => opt.name === 'target');
		expect(target).toBeTruthy();
		expect(target.required).toBeFalsy();
		expect(target.choices.map((c) => c.value).sort()).toEqual(['all', 'local', 'remote']);
	});

	it('execute defaults target to local', async () => {
		const text = await rootCommand.execute(mockRootInteraction({
			subcommand: 'reload',
			getString: () => null,
		}));
		expect(text).toBe('.root reload local');
	});

	it.each([
		['local', '.root reload local'],
		['remote', '.root reload remote'],
		['all', '.root reload all'],
	])('execute maps target=%s', async (target, expected) => {
		const text = await rootCommand.execute(mockRootInteraction({
			subcommand: 'reload',
			getString: (name) => (name === 'target' ? target : null),
		}));
		expect(text).toBe(expected);
	});
});

describe('.root reload text command (slash bridge target)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rejects invalid target with usage text', async () => {
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'reload', 'nope'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(result.text).toMatch(/local\|remote\|all|用法|Usage/i);
		expect(localWorker.reload).not.toHaveBeenCalled();
	});

	it('calls localWorker.reload(local) by default and formats reply', async () => {
		localWorker.reload.mockResolvedValue({
			ok: true,
			mode: 'self-restart',
			url: 'http://127.0.0.1:3951',
			pid: 42,
		});
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'reload'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(localWorker.reload).toHaveBeenCalledWith('local');
		expect(result.quotes).toBe(true);
		expect(result.text).toContain('【.root reload local】成功');
		expect(result.text).toContain('self-restart');
	});

	it('calls localWorker.reload(remote) for slash-mapped remote', async () => {
		localWorker.reload.mockResolvedValue({
			ok: true,
			mode: 'self-restart',
			url: 'http://127.0.0.1:3950',
			pid: 7,
		});
		const result = await adminModule.rollDiceCommand({
			mainMsg: ['.root', 'reload', 'remote'],
			userid: 'test_admin_id',
			locale: 'zh-tw',
		});
		expect(localWorker.reload).toHaveBeenCalledWith('remote');
		expect(result.text).toContain('【.root reload remote】成功');
	});
});
