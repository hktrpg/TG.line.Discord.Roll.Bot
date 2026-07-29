'use strict';

/**
 * Discord defer-busy drain delivery (injected deps — unit-testable).
 * /mee → myNames webhook; /me → myspeck; else editReply / channel (honors result.quotes).
 *
 * @param {object} job
 * @param {object} result
 * @param {{
 *   repeatMessages: Function,
 *   sendMeMessage: Function,
 *   sendToReplyChannel: Function,
 *   clearInteraction: Function,
 *   fetchChannel: Function,
 *   replyInteraction?: Function,
 *   formatDisplayPrefix?: Function,
 * }} hooks
 */
async function deliverDiscordDeferred(job, result, hooks) {
	const {
		repeatMessages,
		sendMeMessage,
		sendToReplyChannel,
		clearInteraction,
		fetchChannel,
		replyInteraction,
		formatDisplayPrefix,
	} = hooks;

	const rawText = result?.text || '';
	const levelUp = result?.LevelUp || '';
	const quotes = Boolean(result?.quotes);
	const target = job.replyTarget || {};
	const interaction = target.interaction;
	const groupid = target.guildId || '';
	const uid = target.userid || job.userid;
	const text = (typeof formatDisplayPrefix === 'function' && rawText)
		? formatDisplayPrefix(job, rawText)
		: rawText;

	if (result?.myNames?.length) {
		let messageLike = interaction;
		if (!messageLike && target.channelId) {
			const channel = await fetchChannel(target.channelId);
			messageLike = { channel, channelId: target.channelId, delete: async () => {} };
		}
		if (!messageLike) throw new Error('Discord myNames deliver missing channel');
		const ok = await repeatMessages(messageLike, result);
		if (interaction && target.isInteraction) await clearInteraction(interaction);
		if (!ok) throw new Error('Discord myNames webhook failed');
		return { mode: 'myNames' };
	}

	if (result?.myspeck) {
		if (interaction && target.isInteraction) {
			await sendMeMessage({ message: interaction, rplyVal: result, groupid });
			await clearInteraction(interaction);
			return { mode: 'myspeck' };
		}
		if (target.channelId && result.myspeck.content) {
			await sendToReplyChannel({
				replyText: result.myspeck.content,
				channelid: target.channelId,
				groupid,
			});
			return { mode: 'myspeck-channel' };
		}
		throw new Error('Discord myspeck deliver missing target');
	}

	if (interaction && target.isInteraction) {
		try {
			if (typeof replyInteraction === 'function') {
				await replyInteraction(interaction, { text: text || '\u200b', quotes });
			} else if (interaction.deferred && !interaction.replied) {
				await interaction.editReply({ content: text || '\u200b' });
			} else if (!interaction.replied) {
				await interaction.reply({ content: text || '\u200b' });
			} else if (typeof interaction.followUp === 'function') {
				await interaction.followUp({ content: text || '\u200b' });
			}
		} catch (error) {
			const channelId = target.channelId || interaction.channelId;
			if (channelId && text) {
				await sendToReplyChannel({
					replyText: text,
					channelid: channelId,
					groupid,
					quotes,
				});
			} else {
				throw error;
			}
		}
		if (levelUp && target.channelId) {
			await sendToReplyChannel({
				replyText: uid ? `<@${uid}>\n${levelUp}` : levelUp,
				channelid: target.channelId,
				groupid,
			});
		}
		return { mode: 'interaction-text' };
	}

	if (target.channelId && (text || levelUp)) {
		if (levelUp) {
			await sendToReplyChannel({
				replyText: uid ? `<@${uid}>\n${levelUp}` : levelUp,
				channelid: target.channelId,
				groupid,
			});
		}
		if (text) {
			await sendToReplyChannel({
				replyText: text,
				channelid: target.channelId,
				groupid,
				quotes,
			});
		}
		return { mode: 'channel-text' };
	}

	return { mode: 'noop' };
}

module.exports = {
	deliverDiscordDeferred,
};
