"use strict";

const check = require('../modules/check.js');

describe('Check Module Tests', () => {
    describe('Role Constants', () => {
        test('Role constants are correctly defined', () => {
            expect(check.role.ban).toBe(-1);
            expect(check.role.nothing).toBe(0);
            expect(check.role.user).toBe(1);
            expect(check.role.dm).toBe(2);
            expect(check.role.admin).toBe(3);
            expect(check.role.superAdmin).toBe(4);
        });
    });

    describe('Flag Constants', () => {
        test('Flag constants are correctly defined', () => {
            expect(check.flag.ChkGuild).toBe(0x3); // 0x1 | 0x2
            expect(check.flag.ChkChannel).toBe(0x1);
            expect(check.flag.ChkChannelManager).toBe(0x5); // 0x1 | 0x4
            expect(check.flag.ChkChannelAdmin).toBe(0x3); // 0x1 | 0x2
            expect(check.flag.ChkBot).toBe(0xD); // 0x1 | 0x4 | 0x8
            expect(check.flag.ChkManager).toBe(0x4);
        });
    });

    describe('Permission Error Messages', () => {
        test('Returns empty string when all permissions are valid', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkGuild,
                gid: '123',
                role: check.role.admin,
                name: 'Discord'
            });
            expect(result).toBe('');
        });

        test('Returns channel error when not in a channel', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkGuild,
                gid: null,
                role: check.role.admin,
                name: 'Discord'
            });
            expect(result).toContain('這裡不是群組，這是頻道功能，需要在頻道上使用');
        });

        test('Returns admin error when user is not admin', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkGuild,
                gid: '123',
                role: check.role.user,
                name: 'Discord'
            });
            expect(result).toContain('你沒有相關權限，禁止使用這功能，\n你需要有群組管理員權限');
        });

        test('Returns manager error when user is not manager', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkChannelManager,
                gid: '123',
                role: check.role.user,
                name: 'Discord'
            });
            expect(result).toContain('你沒有相關權限，禁止使用這功能，\n你需要有管理此頻道的權限或群組管理員權限');
        });

        test('Returns Discord error when not in Discord', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkBot,
                gid: '123',
                role: check.role.admin,
                name: 'Telegram'
            });
            expect(result).toContain('這是Discord限定功能');
        });

        test('Returns multiple error messages when multiple checks fail', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkBot,
                gid: null,
                role: check.role.user,
                name: 'Telegram'
            });
            expect(result).toContain('這裡不是群組，這是頻道功能，需要在頻道上使用');
            expect(result).toContain('你沒有相關權限，禁止使用這功能，\n你需要有管理此頻道的權限或群組管理員權限');
            expect(result).toContain('這是Discord限定功能');
        });

        test('Handles superAdmin role correctly', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkGuild,
                gid: '123',
                role: check.role.superAdmin,
                name: 'Discord'
            });
            expect(result).toBe('');
        });

        test('Handles dm role correctly', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkChannelManager,
                gid: '123',
                role: check.role.dm,
                name: 'Discord'
            });
            expect(result).toBe('');
        });

        test('Handles ban role correctly', () => {
            const result = check.permissionErrMsg({
                flag: check.flag.ChkGuild,
                gid: '123',
                role: check.role.ban,
                name: 'Discord'
            });
            expect(result).toContain('你沒有相關權限，禁止使用這功能，\n你需要有群組管理員權限');
        });
    });
}); 