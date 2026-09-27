(function () {
  'use strict';
  window.CardDesigns = window.CardDesigns || {};

  window.CardDesigns[5] = function ({ c, ui, esc, state }) {
    const isCoc = c.id === 'investigator';
    const signed = value => { const n = Number(String(value).replace('−', '-')); return Number.isFinite(n) ? (n >= 0 ? '+' : '') + n : String(value); };
    const tab = ['overview', 'actions', 'inventory', 'notes'].includes(state.tab) ? state.tab : 'overview';
    const tabs = [{ id: 'overview', label: '角色' }, { id: 'actions', label: '行動' }, { id: 'inventory', label: '背包' }, { id: 'notes', label: '紀事' }];
    const headings = {
      overview: ['THE SOUL WITHIN', '每一段旅程，都留下印記。'],
      actions: ['INSTINCT & INTENTION', '在下一個瞬間，作出選擇。'],
      inventory: ['THINGS WE CARRY', '行囊之中，是走過的路。'],
      notes: ['CHAPTERS UNWRITTEN', '故事尚未寫完。']
    };
    const header = headings[tab];
    let content;
    if (tab === 'actions') {
      content = `<div class="living-section-title"><span>可用行動</span><small>選擇招式以擲骰</small></div>${ui.actions()}<div class="living-section-title living-second-title"><span>技能檢定</span><small>跟隨你的直覺</small></div>${ui.skills()}`;
    } else if (tab === 'inventory') {
      content = `<div class="living-inventory-intro">${ui.icon('pack')}<p>真正重要的東西，<br>未必可以秤出重量。</p></div>${ui.inventory()}`;
    } else if (tab === 'notes') {
      content = `<p class="living-notes-hint">在這裏留下旅途的片段。你的記錄會保存在範例角色的本機筆記。</p>${ui.notes()}`;
    } else {
      content = `<div class="living-biography"><span class="living-initial">${esc(Array.from(c.name || '旅')[0])}</span><p>${esc(c.bio)}</p></div>
        <div class="living-section-title"><span>天賦與本能</span><small>點選屬性進行檢定</small></div>
        <div class="living-attributes">${c.attrs.map(a => `<button type="button" class="living-attribute" data-roll="${esc(isCoc ? 'cc:' + a.value : '1d20' + signed(a.mod))}" data-roll-name="${esc(a.name)}檢定" aria-label="擲骰：${esc(a.name)}"><span class="living-attribute-key">${esc(a.key)}</span><strong>${esc(a.value)}</strong><span class="living-attribute-name">${esc(a.name)}</span><span class="living-attribute-mod">${esc(isCoc ? '困難 ' + Math.floor(a.value / 2) : signed(a.mod))}</span></button>`).join('')}</div>
        <div class="living-section-title living-second-title"><span>擅長的事</span><small>每一次擲骰，一個可能</small></div>${ui.skills()}`;
    }
    return `<div class="living-world">
      <div class="living-mist living-mist-one" aria-hidden="true"></div><div class="living-mist living-mist-two" aria-hidden="true"></div>
      <header class="living-titlebar"><div class="living-wordmark"><span class="living-emblem" aria-hidden="true">✧</span><div>靈魂之境<small>THE LIVING CHARACTER</small></div></div><span class="living-world-location">${ui.icon('compass')}${esc(c.location)}</span><div class="living-tools">${ui.characterButton()}${ui.editButton()}</div></header>
      <main class="living-main">
        <section class="living-stage" aria-label="${esc(c.name)}角色肖像">
          <div class="living-portrait-halo" aria-hidden="true"></div>
          <div class="living-orbit living-orbit-one" aria-hidden="true"></div><div class="living-orbit living-orbit-two" aria-hidden="true"></div>
          <div class="living-stage-caption"><span>${isCoc ? 'CASE FILE / 01' : 'CHAPTER ' + String(c.level).padStart(2, '0')}</span><span>${esc(c.system)}</span></div>
          <div class="living-portrait">${ui.portrait('living-character-art')}</div>
          <div class="living-floating-stat living-stat-defense">${ui.icon('shield')}<span>${isCoc ? '護甲' : '防禦'}</span><strong>${esc(c.ac)}</strong></div>
          <div class="living-floating-stat living-stat-speed">${ui.icon('compass')}<span>移動</span><strong>${esc(c.speed)}</strong></div>
          <div class="living-floating-stat living-stat-initiative">${ui.icon('dice')}<span>${isCoc ? '敏捷' : '先攻'}</span><strong>${esc(isCoc ? c.initiative : signed(c.initiative))}</strong></div>
          <div class="living-identity"><div class="living-character-role"><span class="living-tiny-star">✦</span> ${esc(c.role)} <span class="living-identity-separator">/</span> ${isCoc ? '調查員' : '等級 ' + esc(c.level)}</div><h1>${esc(c.name)}</h1><p class="living-latin">${esc(c.latin)}</p><blockquote>「${esc(c.quote)}」</blockquote></div>
        </section>
        <section class="living-details" aria-label="角色詳細資料"><div class="living-detail-top">${ui.tabs(tabs)}</div><div class="living-detail-scroll"><div class="living-chapter-heading"><span>${header[0]}</span><h2>${header[1]}</h2><i aria-hidden="true"></i></div><div class="living-tab-content">${content}</div></div><div class="living-conditions">${c.conditions.length ? c.conditions.map(condition => `<span>${ui.icon('moon')}${esc(typeof condition === 'object' ? condition.name : condition)}</span>`).join('') : `<span class="living-condition-clear">${ui.icon('check')} 身心安定</span>`}<span class="living-proficiency">${isCoc ? '幸運 ' + esc(c.proficiency) : '熟練加值 ' + esc(signed(c.proficiency))}</span></div></section>
      </main>
      <footer class="living-dock"><div class="living-resource-label"><span class="living-tiny-star">✦</span><div>生命的脈動<small>VITAL ESSENCE</small></div></div><div class="living-resources">${ui.resources()}</div><div class="living-dock-actions"><button type="button" class="living-rest" data-action="rest">${ui.icon('moon')}<span>稍作歇息<small>恢復資源</small></span></button><button type="button" class="living-turn" data-action="next-turn">${ui.icon('arrow')}<span>繼續旅程</span></button></div></footer>
      <div class="living-journal"><div class="living-journal-heading">${ui.icon('book')}<span>命運的迴響</span><span class="living-journal-line"></span><button type="button" data-action="undo">撤回上次變更</button></div>${ui.rollLog()}</div>
    </div>`;
  };
}());
