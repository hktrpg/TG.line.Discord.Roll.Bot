"use strict";

const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { LANGUAGES } = require('./chatroom-translation');

const INVITE_MS = 10 * 60_000;
const DELIVERY_MS = 24 * 60 * 60_000;
const JOB_MS = 30_000;
const hash = code => createHash('sha256').update(code).digest('hex');
const link = channel => `https://discord.com/channels/${channel.guildId}/${channel._id}`;
const publicControls = '使用 /chatroom status 查看範圍；/chatroom optout 停止處理自己的新訊息；管理員可用 /chatroom pause 或 disconnect 停止互通。\nUse /chatroom status, optout, pause or disconnect to inspect or stop processing.';

class ChatroomError extends Error {}

function createChatroomService({ store, transport, translator, isCommand = () => false,
    isConfigured = async () => true,
    enabled = () => false, now = Date.now, dailyLimit = 10_000, globalDailyLimit = 100_000, maxQueue = 50,
    report = () => {} }) {
    const queues = new Map();
    const versions = new Map();
    const metrics = { sent: 0, skipped: 0, failed: 0, translationFailed: 0, queueFull: 0 };
    const assert = (condition, message) => { if (!condition) throw new ChatroomError(message); };
    const changed = result => {
        assert(result, '設定已被另一個操作更改，請查看 status 後重試。Settings changed; check status and retry.');
        return result;
    };
    const ready = () => assert(enabled(), '此部署未啟用同步聊天。Chatroom is disabled on this deployment.');

    function versionFor(message, replace = false, deleted = false) {
        const key = `${message.channelId}:${message.id}`;
        const cutoff = now() - JOB_MS * 2;
        for (const [id, entry] of versions) {
            if (entry.at < cutoff) versions.delete(id);
        }
        const current = versions.get(key);
        const editTimestamp = message.editedTimestamp || 0;
        if (replace && !deleted && editTimestamp > 0
            && editTimestamp <= (current?.editTimestamp || 0)) return null;
        if (replace || !versions.has(key)) {
            if (!versions.has(key) && versions.size >= 10_000) return null;
            versions.set(key, { value: randomUUID(), at: now(), deleted,
                editTimestamp: Math.max(editTimestamp, current?.editTimestamp || 0) });
        }
        const entry = versions.get(key);
        return entry.deleted ? null : entry.value;
    }

    async function paired(config) {
        if (!config?.enabled || !config.peerId || !config.roomId) return null;
        const peer = await store.getChannel(config.peerId);
        return peer?.enabled && peer.peerId === config._id && peer.roomId === config.roomId
            ? peer : null;
    }

    async function command({ action, channel, userId, code, language }) {
        ready();
        if (action === 'optout' || action === 'optin') {
            await store.setOptOut(userId, action === 'optout');
            return action === 'optout'
                ? '已停止處理你的新訊息（所有同步聊天／自動翻譯頻道）。既有 Discord 副本不會自動移除。\nYour new messages are excluded globally. Existing Discord copies remain.'
                : '已允許在管理員明確啟用的頻道處理你的新訊息。\nYour new messages may be processed in explicitly enabled channels.';
        }
        const config = await store.getChannel(channel.id);
        if (action === 'status') {
            const peer = config?.peerId ? await store.getChannel(config.peerId) : null;
            const active = Boolean(await paired(config));
            const user = await store.getUser(userId);
            return `同步聊天 / Bridge: ${active ? '運作中 / active' : '未啟用或待確認 / inactive or pending'}\n`
                + `目的地 / Destination: ${peer ? link(peer) : '無 / none'}\n`
                + `此頻道接收翻譯 / Incoming translation: ${config?.translationLanguage || 'off'}\n`
                + `你的退出設定 / Opted out: ${Boolean(user?.optedOut)}\n`
                + '只處理啟用後的新文字訊息；不補讀歷史或轉送附件。翻譯開啟時，文字會透過免 key 套件送到 Google 翻譯網頁介面（非官方 Cloud API）。\nNew text only; no history or attachments. Translation uses Google Translate through a keyless third-party library, not the official Cloud API.\n'
                + '訊息 ID 對照有效期 24 小時供同步編輯／刪除，之後由資料庫自動清理；不建立聊天原文資料庫。\nMessage-ID mappings expire after 24 hours and are cleaned by the database; no chat text database.\n'
                + publicControls
                + (channel.canManage ? `\n此程序 / This process: sent=${metrics.sent}, failed=${metrics.failed}, skipped=${metrics.skipped}, translationFailed=${metrics.translationFailed}, queueFull=${metrics.queueFull}` : '');
        }
        assert(channel.canManage, '只有具備管理此頻道權限的成員可以更改設定。Manage Channels is required.');
        if (!['pause', 'disconnect'].includes(action) && !(action === 'translate' && language === 'off')) {
            assert(!channel.nsfw, '此版本只支援非年齡限制頻道。Only non-age-restricted channels are supported.');
            assert(channel.canSend, 'Bot 需要檢視頻道、發送訊息及嵌入連結權限。Bot needs View Channel, Send Messages and Embed Links.');
        }
        const current = await store.ensureChannel(channel);

        if (action === 'invite') {
            assert(!current.roomId, '此頻道已有連結或邀請，請先 disconnect。Disconnect the existing link/invitation first.');
            const invite = randomBytes(24).toString('hex');
            const updated = changed(await store.changeChannel(channel.id, current.revision, {
                roomId: randomUUID(), peerId: null, enabled: false,
                inviteHash: hash(invite), inviteExpiresAt: new Date(now() + INVITE_MS), approvedBy: userId
            }));
            return `邀請碼（10 分鐘內使用，只交給另一端管理員）：\n${invite}\n`
                + '另一端在目標頻道執行 /chatroom join code:邀請碼。之後你必須在此頻道執行 confirm，確認實際目的地，才會開始轉送。\n'
                + `Invite expires in 10 minutes. The other admin joins, then you confirm the destination here.\n來源 / Source: ${link(updated)}`;
        }
        if (action === 'join') {
            assert(!current.roomId, '此頻道已有連結或邀請，請先 disconnect。Disconnect the existing link/invitation first.');
            assert(/^[\da-f]{48}$/.test(code || ''), '邀請碼無效。Invalid invitation.');
            const host = await store.findInvite(hash(code));
            assert(host && !host.peerId && new Date(host.inviteExpiresAt).getTime() > now()
                && host.guildId !== channel.guildId, '邀請已失效、已使用，或不屬於另一個伺服器。Invitation expired, used, or not cross-server.');
            const guest = changed(await store.changeChannel(channel.id, current.revision, {
                peerId: host._id, roomId: host.roomId, enabled: false, approvedBy: userId
            }));
            let claimed;
            try {
                claimed = await store.changeChannel(host._id, host.revision, { peerId: channel.id }, { inviteHash: 1 });
                assert(claimed, '邀請已被使用，請重新建立。Invitation already claimed.');
                await transport.notice(channel.id, `此頻道準備與 ${link(host)} 互通，加入代表同意轉送新文字訊息。等待來源端管理員 confirm。\nBridge requested; waiting for source admin confirmation.\n${publicControls}`);
                await transport.notice(host._id, `另一端管理員已要求連結 ${link(guest)}。核對目的地後，請在此頻道使用 /chatroom confirm。\nVerify this destination, then confirm here.\n${publicControls}`);
                changed(await store.changeChannel(channel.id, guest.revision, { enabled: true }));
            } catch (error) {
                // Fail closed. Never enable a link whose public notice failed.
                await store.changeChannel(channel.id, guest.revision, { enabled: false });
                throw error;
            }
            return `已同意連結 ${link(host)}，等待來源端 confirm。Joined; waiting for source confirmation.`;
        }
        if (action === 'confirm') {
            assert(current.peerId && current.roomId, '尚未有另一端加入。No peer has joined.');
            const peer = await store.getChannel(current.peerId);
            assert(peer?.roomId === current.roomId && peer.peerId === channel.id, '連結已失效。Link no longer valid.');
            const notice = `管理員確認同步聊天：${link(current)} ↔ ${link(peer)}。雙方啟用後會自動轉送新文字訊息。\nAdmins approve automatic forwarding between these channels.\n${publicControls}`;
            await transport.notice(current._id, notice);
            await transport.notice(peer._id, notice);
            const approved = changed(await store.changeChannel(channel.id, current.revision, { enabled: true, approvedBy: userId }));
            return await paired(approved)
                ? '已確認並啟用互通。Bridge active.'
                : '此端已確認，等待另一端 confirm。This side approved; peer must confirm.';
        }
        if (action === 'pause' || action === 'disconnect') {
            const update = { enabled: false };
            if (action === 'disconnect') Object.assign(update, { roomId: null, peerId: null });
            changed(await store.changeChannel(channel.id, current.revision, update,
                { inviteHash: 1, inviteExpiresAt: 1 }));
            if (action === 'disconnect' && current.peerId) {
                const peer = await store.getChannel(current.peerId);
                if (peer?.roomId === current.roomId && peer.peerId === channel.id) {
                    await store.changeChannel(peer._id, peer.revision, {
                        enabled: false, roomId: null, peerId: null
                    }, { inviteHash: 1, inviteExpiresAt: 1 });
                }
            }
            return '已停止雙向互通。此頻道的獨立翻譯設定不受影響；關閉翻譯請用 translate off。既有副本保留。\nBridge stopped. Use translate off to stop standalone translation. Existing copies remain.';
        }
        if (action === 'translate') {
            assert(language === 'off' || Object.hasOwn(LANGUAGES, language), '請選擇 zh-TW、en、ja 或 off。Choose zh-TW, en, ja or off.');
            if (language !== 'off') {
                assert(translator.available(), '此部署尚未啟用翻譯。Translation is disabled on this deployment.');
                await transport.notice(channel.id, `準備啟用自動翻譯（${LANGUAGES[language]}）：本頻道的新文字／接收的跨群文字會透過 @vitalets/google-translate-api 送到 Google 翻譯網頁介面，譯文會公開顯示。這是免 key 非官方介面，可能限流或暫停。\nAutomatic translation sends new/incoming text to Google Translate through a keyless third-party library and posts results here. This unofficial interface may be rate-limited or unavailable.\n${publicControls}`);
            }
            changed(await store.changeChannel(channel.id, current.revision, {
                translationLanguage: language === 'off' ? null : language, approvedBy: userId
            }));
            return language === 'off' ? '已關閉自動翻譯。Translation off.' : `已啟用自動翻譯：${language}。Translation enabled.`;
        }
        throw new ChatroomError('不支援的操作。Unsupported action.');
    }

    async function valid(job) {
        if (!enabled() || now() - job.createdAt >= JOB_MS
            || versions.get(job.key)?.value !== job.version) return false;
        const user = await store.getUser(job.userId);
        if (user?.optedOut || (user?.revision || '') !== job.userRevision) return false;
        const source = await store.getChannel(job.source._id);
        const target = job.target._id === job.source._id ? source : await store.getChannel(job.target._id);
        if (source?.revision !== job.source.revision || target?.revision !== job.target.revision) return false;
        if (job.bridge && !(await paired(source))) return false;
        return Boolean(await transport.canRead(job.source._id));
    }

    async function deliver(job) {
        if (!(await valid(job))) { metrics.skipped++; return; }
        const deliveryId = `${job.key}:${job.target._id}:${job.editTimestamp}`;
        if (!(await store.reserveDelivery({
            _id: deliveryId, sourceChannelId: job.source._id, sourceMessageId: job.messageId,
            targetChannelId: job.target._id, userId: job.userId,
            sourceEditedTimestamp: job.editTimestamp,
            expiresAt: new Date(now() + DELIVERY_MS)
        }))) return;
        let translation = null;
        let translationError = false;
        if (job.target.translationLanguage) {
            try {
                assert(translator.available(), 'translation_unavailable');
                assert(await store.consumeQuota(job.target.guildId, job.text.length, dailyLimit, now()), 'quota');
                assert(await store.consumeQuota('__deployment__', job.text.length, globalDailyLimit, now()), 'quota');
                // Check again before disclosing text to a third party.
                if (!(await valid(job))) return;
                translation = await translator.translate(job.text, job.target.translationLanguage);
            } catch {
                translationError = true;
                metrics.translationFailed++;
            }
        }
        if (!(await valid(job))) { metrics.skipped++; return; }
        const sent = await transport.send(job.target._id, {
            text: job.text, translation, translationError, bridge: job.bridge,
            author: job.author, sourceUrl: `${link(job.source)}/${job.messageId}`,
            sourceName: `${job.source.guildName} / ${job.source.channelName}`,
            nonce: hash(`${job.key}:${job.target._id}:${job.editTimestamp}`).slice(0, 24)
        });
        try {
            await store.completeDelivery(deliveryId, sent.id);
        } catch (error) {
            // Do not knowingly leave an untracked copy when its mapping cannot be saved.
            await transport.remove(job.target._id, sent.id);
            throw error;
        }
        // A delete/edit/opt-out may have arrived while the HTTP request was in flight.
        if (!(await valid(job))) {
            await transport.remove(job.target._id, sent.id);
            await store.forgetDelivery(deliveryId);
            return;
        }
        metrics.sent++;
    }

    function enqueue(job) {
        const key = job.target._id;
        const queue = queues.get(key) || { count: 0, tail: Promise.resolve() };
        if (queue.count >= maxQueue || (!queues.has(key) && queues.size >= 100)) {
            metrics.queueFull++;
            return Promise.resolve();
        }
        queue.count++;
        queues.set(key, queue);
        const work = queue.tail.then(() => deliver(job)).catch(() => {
            metrics.failed++;
            report('delivery_failed'); // Fixed category only: no content/credentials/provider errors.
        });
        queue.tail = work.finally(() => {
            queue.count--;
            if (!queue.count) queues.delete(key);
        });
        return queue.tail;
    }

    async function handleMessage(message, { version: suppliedVersion } = {}) {
        if (!enabled() || !message.guildId || message.author?.bot || message.webhookId
            || message.system || !message.author?.id || typeof message.content !== 'string'
            || !message.content.trim() || message.content.length > 2000) return;
        const version = suppliedVersion || versionFor(message);
        if (!version) return;
        const createdAt = now();
        try {
            if (!(await isConfigured(message.channelId))) {
                const key = `${message.channelId}:${message.id}`;
                if (versions.get(key)?.value === version) versions.delete(key);
                return;
            }
            const source = await store.getChannel(message.channelId);
            if (!source || source.guildId !== message.guildId) return;
            const user = await store.getUser(message.author.id);
            if (user?.optedOut) return;
            if (/^\s*(?:[./!？?]|d{1,3}r(?:\s|$))/i.test(message.content)
                || await isCommand(message.content)) return;
            const peer = await paired(source);
            const targets = [];
            if (peer) targets.push({ target: peer, bridge: true });
            if (source.translationLanguage) targets.push({ target: source, bridge: false });
            await Promise.all(targets.map(({ target, bridge }) => enqueue({
                source, target, bridge, text: message.content, userId: message.author.id,
                userRevision: user?.revision || '', messageId: message.id,
                editTimestamp: message.editedTimestamp || 0, createdAt, version,
                key: `${message.channelId}:${message.id}`,
                author: String(message.member?.displayName || message.author.username || 'User').slice(0, 100)
            })));
        } catch {
            metrics.failed++;
            report('message_failed');
        }
    }

    async function removeCopies(message, beforeEdit) {
        const records = await store.deliveriesFor(message.channelId, message.id, now());
        // Retained mappings protect ordering after the in-memory version expires.
        if (beforeEdit > 0 && records.some(record => (record.sourceEditedTimestamp || 0) >= beforeEdit)) return false;
        for (const record of records) {
            // A delayed older edit must never remove a newer edit's delivery.
            if (beforeEdit > 0 && (record.sourceEditedTimestamp || 0) >= beforeEdit) continue;
            try {
                // Only delete messages sent by this feature, identified by its own mapping.
                await transport.remove(record.targetChannelId, record.sentMessageId);
                await store.forgetDelivery(record._id);
            } catch {
                metrics.failed++;
                report('delete_failed');
            }
        }
        return true;
    }

    async function handleDelete(message) {
        if (!enabled()) return;
        versionFor(message, true, true); // Invalidate pending jobs before awaiting I/O.
        try { await removeCopies(message); } catch { report('delete_failed'); }
    }

    async function handleUpdate(message) {
        if (!enabled()) return;
        if (versions.get(`${message.channelId}:${message.id}`)?.deleted) return;
        const version = versionFor(message, true);
        if (!version) return;
        try {
            if (!(await removeCopies(message, message.editedTimestamp))) return;
            // Partial events never trigger a history fetch or guess at missing text.
            if (!message.partial && versions.get(`${message.channelId}:${message.id}`)?.value === version) {
                await handleMessage(message, { version });
            }
        } catch { report('edit_failed'); }
    }

    return { command, handleMessage, handleDelete, handleUpdate, metrics };
}

module.exports = { createChatroomService, ChatroomError, INVITE_MS, DELIVERY_MS, JOB_MS };
