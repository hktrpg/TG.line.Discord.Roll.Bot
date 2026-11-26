'use strict';

const { readFileSync } = require('node:fs');
const { compileFunction } = require('node:vm');
const grammy = require('grammy');
const telegramVideo = require('../modules/chat/telegram-social-video');

const url = 'https://www.facebook.com/reel/123';
const botInfo = { id: 100, is_bot: true, first_name: 'Local Test', username: 'LocalTestBot' };
const user = { id: 101, is_bot: false, first_name: 'Test Sender', username: 'TestSender' };
const chat = { id: -100_123, type: 'supergroup', title: 'Local Fixture' };

async function runTelegramCommand(deliver, failUpload = false, text = '.video ' + url, replyTo) {
    const calls = [];
    const delivery = [];
    let handleUpdate;
    class LocalBot extends grammy.Bot {
        constructor() {
            super('100:synthetic-test-token', { botInfo });
            this.api.config.use(async (_call, method, payload) => {
                if (method === 'getMe') return { ok: true, result: botInfo };
                if (method === 'getChatMemberCount') return { ok: true, result: 2 };
                calls.push({ method, payload });
                if (failUpload && method === 'sendVideo') {
                    return { ok: false, error_code: 403, description: 'Forbidden' };
                }
                return { ok: true, result: method === 'deleteMessage' ? true : { message_id: 501 } };
            });
            handleUpdate = update => this.handleUpdate(update);
        }

        start() {
            return Promise.resolve();
        }
    }

    const dependencies = {
        grammy: { ...grammy, Bot: LocalBot },
        ws: {},
        '../modules/misc/candleDays.js': {},
        '../modules/runtime/schedule': {},
        './runtime/problem-debug': {},
        './chat/getRoll': {},
        './analytics': { findRollList: async () => false },
        './roll-worker/parse-router': { shouldSkipLocalFindRollList: () => false },
        './roll-worker/defer-queue': { registerDeliverer: () => {} },
        './roll-worker/dark-rolling': {},
        './chat/social-video': { handleSocialVideo(input) {
            const task = Promise.resolve().then(() => deliver(input));
            delivery.push(task);
            return task;
        } },
        './chat/telegram-social-video': telegramVideo,
        './chat/message': {},
        './i18n/i18n.js': { resolveLocale: async () => 'zh-tw' },
        './chat/level': {},
        './chat/logs': {},
    };
    const filename = require.resolve('../modules/core-Telegram');
    const load = compileFunction(readFileSync(filename, 'utf8'), ['require', 'exports', 'process'], { filename });
    load(name => {
        if (!Object.hasOwn(dependencies, name)) throw new Error('Unexpected gateway dependency: ' + name);
        return dependencies[name];
    }, {}, { env: { TELEGRAM_CHANNEL_SECRET: '100:synthetic-test-token' } });
    await handleUpdate({
        update_id: 200,
        message: { message_id: 500, chat, from: user, text, is_topic_message: true, message_thread_id: 10, reply_to_message: replyTo },
    });
    expect(delivery).toHaveLength(1);
    const [result] = await Promise.allSettled(delivery);
    return { calls, result };
}

test('Telegram sends a mention and original link before deleting the successful command', async () => {
    const { calls, result } = await runTelegramCommand(async input => {
        await input.sendVideo('fake.mp4', { url });
        await input.deleteCommand();
    });

    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendVideo', 'deleteMessage']);
    expect(calls[0].payload).toMatchObject({
        caption: '@TestSender : 已下載 ' + url,
        caption_entities: [{ type: 'text_mention', offset: 0, length: '@TestSender'.length, user }],
        message_thread_id: 10,
    });
    expect(calls[0].payload.reply_parameters).toBeUndefined();
    expect(calls[1].payload).toMatchObject({ chat_id: chat.id, message_id: 500 });
});

test('Telegram delivers a .video reply with a caption and deletes only the command', async () => {
    const original = { message_id: 499, chat, from: user, text: url };
    const { calls, result } = await runTelegramCommand(async input => {
        expect(input.messageContext).toMatchObject({ id: 500, replyToId: original.message_id });
        const { text } = await input.getRepliedMessage();
        await input.sendVideo('fake.mp4', { url: text });
        await input.deleteCommand();
    }, false, '.video', original);

    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendVideo', 'deleteMessage']);
    expect(calls[0].payload).toMatchObject({
        caption: '@TestSender : 已下載 ' + url,
        message_thread_id: 10,
    });
    expect(calls[0].payload.reply_parameters).toBeUndefined();
    expect(calls[1].payload).toMatchObject({ chat_id: chat.id, message_id: 500 });
});

test('a bare /video can reply with a selective input prompt in the same topic', async () => {
    const { calls, result } = await runTelegramCommand(input => input.promptForLink(), false, '/video');
    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendMessage']);
    expect(calls[0].payload).toMatchObject({
        text: telegramVideo.videoLinkPrompt,
        message_thread_id: 10,
        reply_parameters: { message_id: 500 },
        reply_markup: { force_reply: true, selective: true },
        entities: [{ ...telegramVideo.videoLinkPromptMention, user }],
    });
});

test('only the intended user can use a /video link prompt as an explicit request', async () => {
    const prompt = {
        message_id: 499, chat, from: botInfo, text: telegramVideo.videoLinkPrompt,
        entities: [{ ...telegramVideo.videoLinkPromptMention, user }],
    };
    const { calls, result } = await runTelegramCommand(async input => {
        expect(input.messageContext.linkPromptReply).toBe(true);
        await input.sendVideo('fake.mp4', { url });
    }, false, url, prompt);

    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendVideo']);
    expect(calls[0].payload.caption).toBe('@TestSender : 已下載 ' + url);
    expect(telegramVideo.isTelegramVideoLinkReply({ reply_to_message: prompt, from: { id: 102 } }, botInfo.id)).toBe(false);
    expect(telegramVideo.isTelegramVideoLinkReply({ reply_to_message: prompt, from: user }, 103)).toBe(false);
});

test('Telegram keeps the command when the attachment fails to send', async () => {
    const { calls, result } = await runTelegramCommand(input => input.sendVideo('fake.mp4', { url }), true);

    expect(result.status).toBe('rejected');
    expect(calls.map(call => call.method)).toEqual(['sendVideo']);
});

test('Telegram attaches the caption once for a downloaded photo album', async () => {
    const { calls, result } = await runTelegramCommand(async input => {
        await input.sendImages([{ file: 'fake.jpg' }, { file: 'other.jpg' }], { url });
        await input.deleteCommand();
    });

    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendMediaGroup', 'deleteMessage']);
    expect(calls[0].payload.media[0].caption).toBe('@TestSender : 已下載 ' + url);
    expect(calls[0].payload.media[1].caption).toBeUndefined();
    expect(calls[0].payload.message_thread_id).toBe(10);
});

test('Telegram attaches the same caption for an automatic link', async () => {
    const { calls, result } = await runTelegramCommand(input => input.sendVideo('fake.mp4', { url }), false, url);

    expect(result.status).toBe('fulfilled');
    expect(calls.map(call => call.method)).toEqual(['sendVideo']);
    expect(calls[0].payload.reply_parameters).toBeUndefined();
    expect(calls[0].payload.caption).toBe('@TestSender : 已下載 ' + url);
});
