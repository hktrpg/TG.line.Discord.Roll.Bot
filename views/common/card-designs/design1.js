(function () {
    'use strict';
    window.CardDesigns = window.CardDesigns || {};
    window.CardDesigns[1] = function ({ c, ui, esc, state }) {
        const sections = [{ id: 'overview', label: '人物與能力' }, { id: 'gear', label: '隨身之物' }, { id: 'notes', label: '旅途紀事' }];
        const content = state.tab === 'gear' ? `<div class="folio-section-heading"><span>04 / THE THINGS WE CARRY</span><h2>隨身之物</h2></div>${ui.inventory()}`
            : state.tab === 'notes' ? `<div class="folio-section-heading"><span>05 / NOTES ALONG THE WAY</span><h2>故事，仍在繼續。</h2></div>${ui.notes()}`
                : `<div class="folio-section-heading"><span>02 / INSTINCT & ABILITY</span><h2>本能，與磨練。</h2><small>點選能力，即可試擲檢定 ${ui.icon('arrow')}</small></div>${ui.attrs()}<div class="folio-two-column"><section><div class="folio-subheading"><span>慣用行動</span><span>ACTIONS</span></div>${ui.actions()}</section><section><div class="folio-subheading"><span>擅長之事</span><span>PROFICIENCIES</span></div>${ui.skills()}<div class="folio-reflection"><span>TRAVELLER’S NOTE</span><p>${esc(c.notes[0]?.text || c.bio)}</p></div></section></div>`;
        return `<div class="folio">
            <div class="folio-masthead"><span>THE CHARACTER ISSUE</span><span>一個名字，一段尚未寫完的冒險。</span><span>VOL. 01 / HKTRPG</span></div>
            <section class="folio-cover" aria-label="人物誌封面">
                <div class="folio-profile"><div class="folio-overline"><span class="folio-dot"></span>${esc(c.system)} <span>／</span> ${c.level ? `LEVEL ${c.level}` : 'INVESTIGATOR'}</div><h1>${esc(c.name)}</h1><p class="folio-latin">${esc(c.latin)}</p><p class="folio-role">${esc(c.role)}</p><div class="folio-profile-rule"></div><p class="folio-bio">${esc(c.bio)}</p><div class="folio-profile-actions">${ui.editButton()}<button type="button" class="folio-story-link" data-tab="notes">翻開她的故事 ${ui.icon('arrow')}</button></div><div class="folio-location">${ui.icon('compass')}<span>目前所在<br><strong>${esc(c.location)}</strong></span></div></div>
                <figure class="folio-art"><div class="folio-art-mat">${ui.portrait()}</div><figcaption><span>01 / PORTRAIT OF A WANDERER</span><span>${c.level ? '半精靈遊俠' : '調查員'}</span></figcaption><span class="folio-art-edition" aria-hidden="true">A character.<br>A thousand stories.</span></figure>
                <aside class="folio-vitals"><div class="folio-vitals-heading">此刻的狀態 <span>AT A GLANCE</span></div>${ui.resources()}<dl class="folio-facts"><div><dt>防禦</dt><dd>${esc(c.ac)}<small>${c.id === 'ranger' ? 'AC' : '護甲'}</small></dd></div><div><dt>移動</dt><dd>${esc(c.speed)}<small>${c.id === 'ranger' ? 'FT' : 'MOV'}</small></dd></div><div><dt>先攻</dt><dd>${esc(c.initiative)}</dd></div></dl><button type="button" class="folio-rest" data-action="rest">${ui.icon('moon')} 休息，整裝再出發 ${ui.icon('arrow')}</button><span class="folio-demo-label">範例角色 · 變更只保存在本機</span></aside>
            </section>
            <div class="folio-quote"><span>“</span><p>${esc(c.quote)}</p><small>— ${esc(c.name)}</small></div>
            <section class="folio-content">${ui.tabs(sections)}${content}</section>
            <footer class="folio-footer"><span>HKTRPG CHARACTER JOURNAL</span><button type="button" data-action="undo">復原上次修改</button><span>01 — THE CHARACTER ISSUE</span></footer>
        </div>`;
    };
}());
