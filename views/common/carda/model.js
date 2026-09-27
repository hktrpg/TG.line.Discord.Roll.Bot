(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.CardaModel = factory();
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const signed = value => Number(value) >= 0 ? '+' + Number(value) : String(Number(value));
    function modifier(data, key) { return Math.floor(((data.attributes.find(a => a.key === key)?.value || 10) - 10) / 2); }
    function skillValue(data, skill) { return data.system === 'coc' ? skill.value : modifier(data, skill.key) + (skill.proficient ? data.proficiency : 0) + (Number(skill.extra) || 0); }
    function actionHitValue(data, action) {
        const skill = data.system === 'coc' && action.skill ? data.skills.find(s => s.name === action.skill) : null;
        return skill ? skillValue(data, skill) : action.hit;
    }
    function notation(data, value) { return data.system === 'coc' ? 'cc:' + value : '1d20' + signed(value); }
    function roll(input, mode, random) {
        const die = sides => Math.floor(random() * sides) + 1;
        const cc = /^cc:(\d{1,3})$/.exec(input);
        if (cc) {
            const target = Number(cc[1]);
            if (target > 100) throw new Error('百分比必須介乎 0 至 100。');
            const unit = die(10) - 1;
            const tens = [die(10) - 1];
            if (mode === 'advantage' || mode === 'disadvantage') tens.push(die(10) - 1);
            const candidates = tens.map(t => t === 0 && unit === 0 ? 100 : t * 10 + unit);
            const value = mode === 'disadvantage' ? Math.max(...candidates) : Math.min(...candidates);
            const outcome = value === 1 ? '大成功' : value === 100 || (target < 50 && value >= 96) ? '大失敗' : value <= Math.floor(target / 5) ? '極難成功' : value <= Math.floor(target / 2) ? '困難成功' : value <= target ? '成功' : '失敗';
            return { value, outcome, detail: `${candidates.join(' / ')} ≤ ${target} · ${outcome}${tens.length > 1 ? (mode === 'advantage' ? ' · 獎勵骰' : ' · 懲罰骰') : ''}` };
        }
        const clean = input.replace(/\s/g, '').replace(/[−－]/g, '-').replace(/＋/g, '+');
        if (!/^[+-]?(?:\d{1,2}d\d{1,3}|\d{1,3})(?:[+-](?:\d{1,2}d\d{1,3}|\d{1,3}))*$/i.test(clean)) throw new Error('此算式不在試玩支援範圍。');
        const terms = clean.match(/[+-]?(?:\d+d\d+|\d+)/gi);
        let value = 0, diceCount = 0;
        const detail = [];
        for (const term of terms) {
            const match = /^([+-]?)(\d+)d(\d+)$/i.exec(term);
            if (!match) { value += Number(term); detail.push(term); continue; }
            const count = Number(match[2]), sides = Number(match[3]);
            diceCount += count;
            if (diceCount > 40 || count < 1 || sides < 2 || sides > 100) throw new Error('最多 40 粒骰，每粒 2–100 面。');
            const rolls = Array.from({ length: count }, () => die(sides));
            if (count === 1 && sides === 20 && mode !== 'normal') {
                rolls.push(die(20));
                const selected = mode === 'advantage' ? Math.max(...rolls) : Math.min(...rolls);
                value += (match[1] === '-' ? -1 : 1) * selected;
                detail.push(`[${rolls.join(',')}]→${selected}`);
            } else {
                value += (match[1] === '-' ? -1 : 1) * rolls.reduce((a, b) => a + b, 0);
                detail.push(`${match[1]}[${rolls.join(',')}]`);
            }
        }
        return { value, outcome: '', detail: `${input} · ${detail.join(' ')} = ${value}` };
    }
    function applyPatch(base, patch) {
        const data = clone(base);
        if (!patch || typeof patch !== 'object') return data;
        if (typeof patch.name === 'string' && patch.name.trim()) data.name = patch.name.slice(0, 80);
        if (typeof patch.subtitle === 'string') data.subtitle = patch.subtitle.slice(0, 160);
        if (Array.isArray(patch.resources)) for (const item of data.resources) {
            const saved = patch.resources.find(r => r?.key === item.key);
            if (saved && Number.isFinite(saved.current)) item.current = Math.max(0, Math.min(item.max, saved.current));
        }
        if (Array.isArray(patch.slots)) for (const slot of data.slots) {
            const saved = patch.slots.find(s => s?.level === slot.level);
            if (saved && Number.isFinite(saved.current)) slot.current = Math.max(0, Math.min(slot.max, saved.current));
        }
        if (Array.isArray(patch.conditions)) data.conditions = patch.conditions.filter(c => data.conditionOptions.includes(c));
        if (Array.isArray(patch.notes)) data.notes = patch.notes.slice(0, 40).filter(n => n && typeof n.title === 'string' && typeof n.text === 'string').map(n => ({ title: n.title.slice(0, 100), text: n.text.slice(0, 12000) }));
        if (Array.isArray(patch.skills)) for (const skill of data.skills) {
            const saved = patch.skills.find(s => s?.name === skill.name);
            if (!saved) continue;
            if (data.system === 'coc' && Number.isFinite(saved.value)) skill.value = Math.max(0, Math.min(100, saved.value));
            if (data.system === 'dnd' && typeof saved.proficient === 'boolean') skill.proficient = saved.proficient;
            skill.developmentChecked = saved.developmentChecked === true;
        }
        data.inspiration = patch.inspiration === true;
        if (Array.isArray(patch.death)) data.death = patch.death.slice(0, 6).map(Boolean);
        return data;
    }
    return { clone, signed, modifier, skillValue, actionHitValue, notation, roll, applyPatch };
}));
