(function () {
  'use strict';
  window.CardDesigns = window.CardDesigns || {};

  window.CardDesigns[3] = function ({ c, ui, esc, state }) {
    var isInvestigator = c.id === 'investigator';
    var tabs = [
      { id: 'overview', label: '扉頁' },
      { id: 'abilities', label: '本領' },
      { id: 'journal', label: '旅途' },
      { id: 'inventory', label: '背囊' }
    ];
    var tab = tabs.some(function (item) { return item.id === state.tab; }) ? state.tab : 'overview';
    var page = { overview: '01', abilities: '03', journal: '07', inventory: '11' }[tab];
    var contents;

    if (tab === 'abilities') {
      contents = '<div class="journal-chapter"><span class="journal-kicker">CHAPTER II · 習得之事</span><h2>路上練成的本領</h2><p class="journal-intro">每一項本領，都曾經救過我一次。選一項，讓骰子續寫故事。</p></div>' +
        '<section class="journal-section"><div class="journal-section-heading"><h3>六項天賦</h3><span>點按數值擲骰</span></div>' + ui.attrs() + '</section>' +
        '<section class="journal-section"><div class="journal-section-heading"><h3>熟練的事情</h3><span>SKILLS & INSTINCTS</span></div>' + ui.skills() + '</section>';
    } else if (tab === 'journal') {
      contents = '<div class="journal-chapter"><span class="journal-kicker">CHAPTER III · 沿途拾記</span><h2>值得留下的事</h2><p class="journal-intro">人名、路標、未兌現的承諾。趁還記得，把它寫下來。</p></div>' +
        '<div class="journal-writing-label">' + ui.icon('edit') + '<span>點入筆記即可修改 · 自動留在此裝置</span></div>' + ui.notes() +
        '<section class="journal-section journal-history"><div class="journal-section-heading"><h3>命運的旁註</h3><span>RECENT ROLLS</span></div>' + ui.rollLog() + '</section>';
    } else if (tab === 'inventory') {
      contents = '<div class="journal-chapter"><span class="journal-kicker">CHAPTER IV · 隨身之物</span><h2>背囊裏的小宇宙</h2><p class="journal-intro">能帶走的東西有限，有些重量卻捨不得放下。</p></div>' +
        '<div class="journal-inventory-caption"><span>物品清單</span><span>出發前再檢查一遍</span></div>' + ui.inventory() +
        '<div class="journal-pack-note"><span class="journal-handwritten">留一點空位，給下一段奇遇。</span>' + ui.icon('compass') + '</div>';
    } else {
      contents = '<div class="journal-chapter"><span class="journal-kicker">CHAPTER I · 今日的我</span><h2>旅途，尚未完結。</h2><p class="journal-intro">' + esc(c.bio) + '</p></div>' +
        '<section class="journal-section journal-condition"><div class="journal-section-heading"><h3>出發前的檢查</h3><button class="journal-text-button" data-action="rest">' + ui.icon('moon') + ' 歇一歇</button></div>' + ui.resources() + '</section>' +
        '<section class="journal-section journal-repertoire"><div class="journal-section-heading"><h3>我的拿手好戲</h3><span>點按右側擲骰</span></div>' + ui.actions() + '</section>' +
        '<div class="journal-bottom-note"><span class="journal-star">✳</span><p>「' + esc(c.quote) + '」</p><span class="journal-note-attribution">—— 寫在頁角的話</span></div>';
    }

    return '<div class="journal-desk">' +
      '<div class="journal-topline"><span>' + ui.icon('book') + ' 旅人手帳 <i>THE FIELD JOURNAL</i></span><span class="journal-edition">' + esc(c.system) + ' · ' + (isInvestigator ? '調查紀錄' : 'VOL. ' + String(c.level).padStart(2, '0')) + '</span></div>' +
      '<div class="journal-book">' +
        '<aside class="journal-left-page">' +
          '<div class="journal-page-eyebrow"><span>此冊屬於</span><span>THIS JOURNAL BELONGS TO</span></div>' +
          '<div class="journal-portrait-frame">' + ui.portrait('journal-portrait') + '<span class="journal-photo-tape"></span><div class="journal-portrait-caption">一個尚在路上的人 <span>Fig. 01</span></div></div>' +
          '<div class="journal-identity"><p class="journal-latin">' + esc(c.latin) + '</p><h1>' + esc(c.name) + '</h1><p class="journal-role">' + esc(c.role) + '<span>' + (isInvestigator ? 'INVESTIGATOR' : 'LEVEL ' + esc(c.level)) + '</span></p></div>' +
          '<div class="journal-locator">' + ui.icon('compass') + '<div><span>此刻身在</span><strong>' + esc(c.location) + '</strong></div></div>' +
          '<dl class="journal-facts"><div><dt>' + (isInvestigator ? '幸運' : '護甲') + '</dt><dd>' + esc(isInvestigator ? c.proficiency : c.ac) + '</dd></div><div><dt>' + (isInvestigator ? '敏捷' : '先攻') + '</dt><dd>' + esc(c.initiative) + '</dd></div><div><dt>速度</dt><dd>' + esc(c.speed) + '</dd></div></dl>' +
          '<div class="journal-status"><span class="journal-status-dot"></span>' + (c.conditions.length ? c.conditions.map(esc).join(' · ') : '一切安好，繼續前行') + '</div>' +
          '<div class="journal-owner-actions">' + ui.editButton() + ui.characterButton() + '</div>' +
          '<div class="journal-left-footer"><span>不必知道終點，先記住這一步。</span><span>02</span></div>' +
        '</aside>' +
        '<article class="journal-right-page">' +
          '<div class="journal-page-heading"><span>冒險者的隨身記錄</span><span>FIELD NOTES / ' + page + '</span></div>' +
          '<div class="journal-chapter-nav">' + ui.tabs(tabs) + '</div>' +
          '<div class="journal-page-content">' + contents + '</div>' +
          '<footer class="journal-page-footer"><span>走過的路，都算數。</span><span>— ' + page + ' —</span><span>續頁 ' + ui.icon('arrow') + '</span></footer>' +
        '</article>' +
      '</div>' +
      '<div class="journal-desk-footer"><span>範例角色 · 筆尖留下故事，骰子決定下一頁。</span><button class="journal-text-button" data-action="reset">重新翻開這本手帳</button></div>' +
    '</div>';
  };
}());
