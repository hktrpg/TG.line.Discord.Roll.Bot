"use strict";

const { ChannelType } = require('discord.js');

jest.mock('../modules/db/schema.js', () => ({
	userLang: {
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
	},
	groupLang: {
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
	},
}));

const lang = require('../roll/lang.js');

describe('lang channelType (worker-serializable)', () => {
	it('treats channelType DM as DM without discordMessage', async () => {
		const rply = await lang.rollDiceCommand({
			inputStr: '.lang list',
			mainMsg: ['.lang', 'list'],
			botname: 'Discord',
			groupid: '',
			userid: 'u1',
			channelType: ChannelType.DM,
			locale: 'zh-tw',
			t: (key) => key,
		});
		expect(rply).toBeDefined();
		expect(rply.text).toBeTruthy();
	});

	it('uses channelType from params when discordMessage is null (remote worker)', async () => {
		const rply = await lang.rollDiceCommand({
			inputStr: '.lang list',
			mainMsg: ['.lang', 'list'],
			botname: 'Discord',
			groupid: 'g1',
			userid: 'u1',
			channelType: ChannelType.GuildText,
			discordMessage: null,
			locale: 'zh-tw',
			t: (key) => key,
		});
		expect(rply).toBeDefined();
		expect(rply.text).toBeTruthy();
	});
});
