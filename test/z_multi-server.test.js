"use strict";

const feature = require('../roll/z_multi-server');

describe('chatroom command definitions and legacy compatibility', () => {
    it('exposes all settings and personal privacy controls as slash subcommands', () => {
        const json = feature.discordCommand[0].data.toJSON();
        expect(json.name).toBe('chatroom');
        expect(json.options.map(item => item.name)).toEqual(expect.arrayContaining([
            'invite', 'join', 'confirm', 'pause', 'disconnect', 'status', 'translate', 'optout', 'optin'
        ]));
        expect(json.default_member_permissions).toBeUndefined();
    });

    it('legacy create/join/exit never mutate old records or claim activation', async () => {
        for (const action of ['create', 'join', 'exit']) {
            const result = await feature.rollDiceCommand({ mainMsg: ['.chatroom', action, '123'] });
            expect(result.text).toContain('/chatroom');
            expect(result.text).toContain('舊 .chatroom 設定不會自動恢復');
        }
    });

    it('uses the same help for prefix and slash compatibility handlers', async () => {
        expect(feature.prefixs()[0].first.test('.chatroom')).toBe(true);
        expect(await feature.discordCommand[0].execute()).toBe('.chatroom help');
        const result = await feature.rollDiceCommand({ mainMsg: ['.chatroom', 'help'] });
        expect(result.text).toBe(feature.getHelpMessage());
    });
});
