(function () {
  'use strict';
  window.CardDesigns = window.CardDesigns || {};
  window.CardDesigns[4] = function ({ c, ui, esc, state }) {
    const tab = state.tab || 'overview';
    const navigation = [{ id: 'overview', label: '角色總覽' }, { id: 'skills', label: '能力索引' }, { id: 'notes', label: '冒險筆記' }, { id: 'gear', label: '隨身裝備' }];
    const search = '<label class="index-search">' + ui.icon('search') + '<input type="search" data-skill-search value="' + esc(state.search || '') + '" placeholder="搜尋能力、行動…" aria-label="搜尋能力及行動"><span>/ INDEX</span></label>';
    const heading = (number, title, subtitle) => '<div class="index-section-heading"><span class="index-section-number">' + number + '</span><h2>' + title + '</h2><span class="index-section-caption">' + subtitle + '</span></div>';
    let content;
    if (tab === 'skills') {
      content = heading('02', '能力索引', 'SKILLS & ACTIONS') + search + ui.skills() + heading('02.1', '可用行動', 'READY TO ROLL') + ui.actions();
    } else if (tab === 'notes') {
      content = heading('03', '冒險筆記', 'FIELD NOTES') + '<p class="index-section-intro">把未完的故事、重要的名字，以及下一次冒險的線索留在這裏。</p>' + ui.notes();
    } else if (tab === 'gear') {
      content = heading('04', '隨身裝備', 'PERSONAL INVENTORY') + ui.inventory();
    } else {
      content = heading('01', '核心能力', 'ABILITY SCORES') + ui.attrs() + heading('01.1', '常用行動', 'QUICK ACTIONS') + ui.actions() + heading('01.2', '角色簡介', 'PERSONAL PROFILE') + '<p class="index-biography">' + esc(c.bio) + '</p><div class="index-profile-bottom"><span>' + ui.icon('compass') + esc(c.location) + '</span><button class="index-text-link" data-tab="notes">查看冒險筆記 ' + ui.icon('arrow') + '</button></div>';
    }
    return '<div class="character-index">' +
      '<aside class="index-rail"><div class="index-wordmark"><span class="index-logo">i.</span><span>角色索引<small>THE CHARACTER INDEX</small></span></div><div class="index-rail-label">CHARACTER / 001</div><nav class="index-navigation" aria-label="角色資料分類">' + navigation.map((item, index) => '<button data-tab="' + item.id + '" class="index-nav-item' + (tab === item.id ? ' is-active' : '') + '"' + (tab === item.id ? ' aria-current="page"' : '') + '><span>0' + (index + 1) + '</span>' + item.label + ui.icon('arrow') + '</button>').join('') + '</nav><div class="index-rail-bottom"><span class="index-live-dot"></span> 冒險進行中<small>KEEP YOUR STORY IN ORDER.</small>' + ui.characterButton() + '</div></aside>' +
      '<div class="index-main"><div class="index-topline"><span>你的冒險 / <strong>' + esc(c.system) + '</strong></span><div>' + ui.editButton() + '</div></div><header class="index-identity"><div class="index-identity-copy"><p class="index-overline">PLAYER CHARACTER <span>—</span> ' + (c.level ? 'LEVEL ' + esc(String(c.level)) : '調查員') + '</p><h1>' + esc(c.name) + '<span class="index-name-dot">.</span></h1><div class="index-identity-meta"><span>' + esc(c.latin) + '</span><span>' + esc(c.role) + '</span></div></div><div class="index-portrait-wrap">' + ui.portrait('index-portrait') + '<span>PERSONAL RECORD / 001</span></div></header><div class="index-quote"><span>“</span><p>' + esc(c.quote) + '</p></div><div class="index-workspace"><section class="index-content">' + content + '</section><aside class="index-utility"><div class="index-section-heading"><h2>即時狀態</h2><span class="index-section-caption">LIVE</span></div>' + ui.resources() + '<div class="index-combat-stats"><div><span>' + (c.id === 'investigator' ? '幸運' : '防禦') + '</span><strong>' + esc(String(c.id === 'investigator' ? c.proficiency : c.ac)) + '</strong><small>' + (c.id === 'investigator' ? 'LUCK' : 'AC') + '</small></div><div><span>速度</span><strong>' + esc(String(c.speed)) + '</strong><small>SPEED</small></div><div><span>先攻</span><strong>' + esc(String(c.initiative)) + '</strong><small>INIT</small></div></div><button class="index-rest" data-action="rest">' + ui.icon('moon') + '<span>休息與恢復</span>' + ui.icon('arrow') + '</button><div class="index-log-title">最近擲骰 <span>ROLL HISTORY</span></div>' + ui.rollLog() + '</aside></div><footer class="index-footer"><span>HKTRPG / CHARACTER INDEX</span><span>每個數字，都有一段故事。</span><span>04 — INDEX</span></footer></div></div>';
  };
})();
