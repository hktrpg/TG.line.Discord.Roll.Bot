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

jest.mock('../modules/schema.js', () => {
  const mockAccountPW = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data)
  }));
  mockAccountPW.findOne = jest.fn();
  mockAccountPW.findOneAndUpdate = jest.fn();
  mockAccountPW.updateOne = jest.fn();
  
  return {
    accountPW: mockAccountPW,
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
  };
});

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

  // Test additional admin functions
  test('Test rollDiceCommand with unknown command', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'unknown']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with account command (username too short)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'ab', 'password123']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者名稱，4-16字，中英文限定，大小階相同');
  });

  test('Test rollDiceCommand with account command (username too long)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'verylongusernamethatexceedslimit', 'password123']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者名稱，4-16字，中英文限定，大小階相同');
  });

  test('Test rollDiceCommand with account command (password too short)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', '12345']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者密碼，6-16字，英文及以下符號限定!@#$%^&*');
  });

  test('Test rollDiceCommand with account command (password too long)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'verylongpasswordthatexceedslimit']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者密碼，6-16字，英文及以下符號限定!@#$%^&*');
  });

  test('Test rollDiceCommand with account command (invalid characters in username)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'user@#$%', 'password123']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者名稱，4-16字，中英文限定，大小階相同');
  });

  test('Test rollDiceCommand with account command (invalid characters in password)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'password+invalid']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('使用者密碼，6-16字，英文及以下符號限定!@#$%^&*');
  });

  test('Test rollDiceCommand with news command (no userid)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'news', 'on']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with news command (invalid action)', async () => {
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'news', 'invalid'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with registerChannel (with permission)', async () => {
    checkTools.permissionErrMsg.mockReturnValueOnce(null);
    schema.allowRolling.findOne.mockResolvedValueOnce(null);
    schema.allowRolling.findOneAndUpdate.mockResolvedValueOnce({ ok: 1 });
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'registerChannel'],
      groupid: 'test_group',
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('註冊成功');
  });

  test('Test rollDiceCommand with registerChannel (already registered)', async () => {
    checkTools.permissionErrMsg.mockReturnValueOnce(null);
    schema.allowRolling.findOne.mockResolvedValueOnce({
      groupid: 'test_group',
      allow: true
    });
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'registerChannel'],
      groupid: 'test_group',
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('註冊成功');
  });

  test('Test rollDiceCommand with registerChannel (database error)', async () => {
    checkTools.permissionErrMsg.mockReturnValueOnce(null);
    schema.allowRolling.findOne.mockRejectedValueOnce(new Error('Database error'));
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'registerChannel'],
      groupid: 'test_group',
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('註冊成功');
  });

  test('Test rollDiceCommand with registerChannel (update error)', async () => {
    checkTools.permissionErrMsg.mockReturnValueOnce(null);
    schema.allowRolling.findOne.mockResolvedValueOnce(null);
    schema.allowRolling.findOneAndUpdate.mockRejectedValueOnce(new Error('Update error'));
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'registerChannel'],
      groupid: 'test_group',
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('註冊成功');
  });

  test('Test rollDiceCommand with news command (database error)', async () => {
    schema.theNewsMessage.updateOne.mockRejectedValueOnce(new Error('Database error'));
    
    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'news', 'on'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('更新失敗');
  });

  test('Test rollDiceCommand with account command (database error)', async () => {
    schema.accountPW.findOne.mockRejectedValueOnce(new Error('Database error'));

    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'password123'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with account command (update error)', async () => {
    schema.accountPW.findOne.mockResolvedValueOnce(null);
    schema.accountPW.findOneAndUpdate.mockRejectedValueOnce(new Error('Update error'));

    const result = await adminModule.rollDiceCommand({
      mainMsg: ['.admin', 'account', 'validuser', 'password123'],
      userid: 'test_user'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

});

describe('Admin Module Advanced Coverage Tests', () => {
  let adminModule;
  let schema;

  beforeAll(() => {
    adminModule = require('../roll/z_admin.js');
    schema = require('../modules/schema.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test rollDiceCommand with state command', async () => {
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin state',
      mainMsg: ['.admin', 'state'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeDefined();
  });

  test('Test rollDiceCommand with debug command', async () => {
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin debug',
      mainMsg: ['.admin', 'debug'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with mongod command (admin user)', async () => {
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin mongod',
      mainMsg: ['.admin', 'mongod'],
      userid: process.env.ADMIN_SECRET,
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with allowrolling command', async () => {
    schema.allowRolling.findOne.mockResolvedValue(null);
    schema.allowRolling.findOneAndUpdate.mockResolvedValue({
      groupid: 'testgroup',
      allow: true
    });
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin allowrolling',
      mainMsg: ['.admin', 'allowrolling'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with disallowrolling command', async () => {
    schema.allowRolling.findOne.mockResolvedValue({
      groupid: 'testgroup',
      allow: true
    });
    schema.allowRolling.findOneAndRemove.mockResolvedValue({
      groupid: 'testgroup'
    });
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin disallowrolling',
      mainMsg: ['.admin', 'disallowrolling'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with unregisterChannel command', async () => {
    schema.accountPW.findOne.mockResolvedValue({
      userid: 'testuser',
      groupid: 'testgroup',
      allow: true
    });
    schema.accountPW.updateOne.mockResolvedValue({
      userid: 'testuser',
      groupid: 'testgroup'
    });
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin unregisterChannel',
      mainMsg: ['.admin', 'unregisterChannel'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with news command (on)', async () => {
    schema.theNewsMessage.updateOne.mockResolvedValue({
      userid: 'testuser',
      news: true
    });
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin news on',
      mainMsg: ['.admin', 'news', 'on'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with news command (off)', async () => {
    schema.theNewsMessage.updateOne.mockResolvedValue({
      userid: 'testuser',
      news: false
    });
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin news off',
      mainMsg: ['.admin', 'news', 'off'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with news command (show)', async () => {
    schema.theNewsMessage.find.mockResolvedValue([
      { userid: 'user1', news: true },
      { userid: 'user2', news: false }
    ]);
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin news show',
      mainMsg: ['.admin', 'news', 'show'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeDefined();
  });

  test('Test rollDiceCommand with news command (database error)', async () => {
    schema.theNewsMessage.updateOne.mockRejectedValue(new Error('Database error'));
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin news on',
      mainMsg: ['.admin', 'news', 'on'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with allowrolling command (database error)', async () => {
    schema.allowRolling.findOne.mockRejectedValue(new Error('Database error'));
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin allowrolling',
      mainMsg: ['.admin', 'allowrolling'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with disallowrolling command (database error)', async () => {
    schema.allowRolling.findOne.mockRejectedValue(new Error('Database error'));
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin disallowrolling',
      mainMsg: ['.admin', 'disallowrolling'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with unregisterChannel command (database error)', async () => {
    schema.accountPW.findOne.mockRejectedValue(new Error('Database error'));
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin unregisterChannel',
      mainMsg: ['.admin', 'unregisterChannel'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with unregisterChannel command (not found)', async () => {
    schema.accountPW.findOne.mockResolvedValue(null);
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin unregisterChannel',
      mainMsg: ['.admin', 'unregisterChannel'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test rollDiceCommand with unregisterChannel command (update error)', async () => {
    schema.accountPW.findOne.mockResolvedValue({
      userid: 'testuser',
      groupid: 'testgroup',
      allow: true
    });
    schema.accountPW.updateOne.mockRejectedValue(new Error('Update error'));
    const result = await adminModule.rollDiceCommand({
      inputStr: '.admin unregisterChannel',
      mainMsg: ['.admin', 'unregisterChannel'],
      userid: 'testuser',
      groupid: 'testgroup'
    });
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });
}); 