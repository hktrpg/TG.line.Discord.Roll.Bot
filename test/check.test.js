const check = require('../modules/check');

test('Test group id is Channel', () => {
    expect(check.isChannel(5)).toBe(true);
});

test('Test group id is not Channel', () => {
    expect(check.isChannel(0)).toBe(false);
});

test('Test user super admin is admin', () => {
    expect(check.isAdmin(check.role.superAdmin)).toBe(true);
});

test('Test user admin is admin', () => {
    expect(check.isAdmin(check.role.admin)).toBe(true);
});

test('Test user dm is not admin', () => {
    expect(check.isAdmin(check.role.dm)).toBe(false);
});

test('Test user user is not admin', () => {
    expect(check.isAdmin(check.role.user)).toBe(false);
});

test('Test user nothing is not admin', () => {
    expect(check.isAdmin(check.role.nothing)).toBe(false);
});

test('Test user ban is not admin', () => {
    expect(check.isAdmin(check.role.ban)).toBe(false);
});

test('Test user super admin is manager', () => {
    expect(check.isManager(check.role.superAdmin)).toBe(true);
});

test('Test user admin is manager', () => {
    expect(check.isManager(check.role.admin)).toBe(true);
});

test('Test user dm is manager', () => {
    expect(check.isManager(check.role.dm)).toBe(true);
});

test('Test user user is not manager', () => {
    expect(check.isManager(check.role.user)).toBe(false);
});

test('Test user nothing is not manager', () => {
    expect(check.isManager(check.role.nothing)).toBe(false);
});

test('Test user ban is not manager', () => {
    expect(check.isManager(check.role.ban)).toBe(false);
});

test('Test bot is discord', () => {
    expect(check.isDiscord('Discord')).toBe(true);
});

test('Test bot is not discord', () => {
    expect(check.isDiscord('what ever')).toBe(false);
});