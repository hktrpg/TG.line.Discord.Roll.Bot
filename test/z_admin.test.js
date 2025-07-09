"use strict";

// Mock environment variables
process.env.SALT = 'test_salt';
process.env.CRYPTO_SECRET = 'test_crypto_secret';
process.env.ADMIN_SECRET = 'test_admin_id';

// Mock dependencies
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('hashed_password')
    })
  }),
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('random_bytes')
  }),
  createCipheriv: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue(Buffer.from('encrypted')),
    final: jest.fn().mockReturnValue(Buffer.from(''))
  }),
  createDecipheriv: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue(Buffer.from('decrypted')),
    final: jest.fn().mockReturnValue(Buffer.from(''))
  })
}));

jest.mock('../modules/schema.js', () => ({
  accountPW: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn()
  },
  allowRolling: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndRemove: jest.fn()
  },
  veryImportantPerson: {
    updateOne: jest.fn()
  },
  theNewsMessage: {
    updateOne: jest.fn(),
    find: jest.fn()
  },
  mongodbState: jest.fn().mockResolvedValue({ connections: [] })
}));

jest.mock('../modules/check.js', () => ({
  permissionErrMsg: jest.fn(),
  flag: {
    ChkChannel: 1,
    ChkChannelAdmin: 2
  }
}));

jest.mock('../modules/ds-deploy-commands.js', () => ({
  registeredGlobalSlashCommands: jest.fn(),
  testRegisteredSlashCommands: jest.fn()
}));

// Import the module after mocking
const adminModule = require('../roll/z_admin.js');
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
    const _deploy = require('../modules/ds-deploy-commands.js');

describe('Admin Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    expect(adminModule.gameName()).toBe('【Admin Tool】.admin debug state account news on');
  });

  test('Test gameType returns correct type', () => {
    expect(adminModule.gameType()).toBe('admin:Admin:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = adminModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(2);
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.admin')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await adminModule.getHelpMessage();
    expect(helpText).toContain('管理員工具箱');
    expect(helpText).toContain('系統監控');
    expect(helpText).toContain('帳號管理');
    expect(helpText).toContain('更新通知');
  });

  test('Test initialize returns empty variables object', () => {
    expect(adminModule.initialize()).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe(await adminModule.getHelpMessage());
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with state command', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'state']
    });
    
    expect(result.type).toBe('text');
    expect(result.state).toBe(true);
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with mongod command (non-admin)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'mongod'],
      userid: 'non_admin'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with mongod command (admin)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'mongod'],
      userid: 'test_admin_id'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('[]');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with registerChannel (no permission)', async () => {
    checkTools.permissionErrMsg.mockReturnValueOnce('Permission denied');
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'registerChannel'],
      groupid: 'test_group'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('Permission denied');
  });

  test('Test rollDiceCommand with account command in group', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'testuser', 'password123'],
      groupid: 'test_group'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('設定帳號時，請直接和HKTRPG對話，禁止在群組中使用');
  });

  test('Test rollDiceCommand with account command (invalid username)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', '@#$', 'password123']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者名稱，4-16字，中英文限定，大小階相同');
  });

  test('Test rollDiceCommand with account command (invalid password)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', '123']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者密碼，6-16字，英文及以下符號限定!@#$%^&*');
  });

  test('Test rollDiceCommand with news on command', async () => {
    schema.theNewsMessage.updateOne.mockResolvedValueOnce({ ok: 1 });
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'news', 'on'],
      userid: 'test_user',
      botname: 'test_bot'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('更新成功\n你已開啓更新通知功能');
  });

  test('Test rollDiceCommand with news off command', async () => {
    schema.theNewsMessage.updateOne.mockResolvedValueOnce({ ok: 1 });
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'news', 'off'],
      userid: 'test_user',
      botname: 'test_bot'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('更新成功\n你已關閉更新通知功能');
  });

  test('Test rollDiceCommand with debug command', async () => {
    process.env.CRYPTO_SECRET = 'test_crypto_secret';
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'debug'],
      groupid: 'test_group',
      userid: 'test_user',
      channelid: 'test_channel',
      userrole: 'admin',
      botname: 'test_bot',
      displayname: 'Test User',
      displaynameDiscord: 'Test#1234',
      membercount: 100
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('Debug encrypt Data:');
    expect(result.text).toContain('random_bytes:656e63727970746564');
  });

  test('Test account command with valid inputs', async () => {
    schema.accountPW.findOne.mockResolvedValueOnce(null);
    schema.accountPW.findOneAndUpdate.mockResolvedValueOnce({ ok: 1 });

    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'password123'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('現在你的帳號是: validuser');
    expect(result.text).toContain('密碼: password123');
  });

  test('Test account command with duplicate username', async () => {
    schema.accountPW.findOne.mockResolvedValueOnce({
      id: 'other_user',
      userName: 'validuser'
    });

    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'password123'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('重覆用戶名稱');
  });
}); 