'use strict';

/** Public demo session logs for /logs showcase (no auth). */
const DEMO_LOGS = [
    {
        id: 'demo-01',
        title: '門後的目錄 · 第一場',
        subtitle: 'CoC 7th · 調查員們踏入舊書庫',
        sessionDate: '2025-08-12',
        location: '灣仔某巷舊書店',
        theme: 'kakuyomu',
        messageCount: 186,
        playerNames: ['KP', '美咲', '健一', '莉莉'],
        visibility: 'public',
    },
    {
        id: 'demo-02',
        title: '雨夜電車 · 序章',
        subtitle: '怪奇譚 · 末班車上的陌生人',
        sessionDate: '2025-07-03',
        location: '架空都市地鐵',
        theme: 'kindle',
        messageCount: 142,
        playerNames: ['GM', '阿哲', '小薇'],
        visibility: 'public',
    },
    {
        id: 'demo-03',
        title: '學園七不思議 · 試玩',
        subtitle: 'シノビガミ · 文化祭前夜',
        sessionDate: '2025-06-18',
        location: '私立星見學園',
        theme: 'discord',
        messageCount: 210,
        playerNames: ['GM', '紅', '藍', '黃'],
        visibility: 'public',
    },
    {
        id: 'demo-04',
        title: '沉沒的王冠 · 第二章',
        subtitle: 'D&D 5e · 海底神殿',
        sessionDate: '2025-05-22',
        location: '珊瑚海遺跡',
        theme: 'kakuyomu',
        messageCount: 268,
        playerNames: ['DM', 'Elara', 'Thorn', 'Mira', 'Kael'],
        visibility: 'public',
    },
    {
        id: 'demo-05',
        title: '廢棄療養院 · 夜間探索',
        subtitle: 'CoC 7th · 單次模組',
        sessionDate: '2025-04-09',
        location: '新界郊野',
        theme: 'term',
        messageCount: 95,
        playerNames: ['KP', '陳', '林'],
        visibility: 'public',
    },
    {
        id: 'demo-06',
        title: '王都陰影 · 開幕',
        subtitle: 'Pathfinder 2e · 酒館邂逅',
        sessionDate: '2025-03-14',
        location: '艾爾王都下城區',
        theme: 'kindle',
        messageCount: 175,
        playerNames: ['GM', 'Rin', 'Otto', 'Sera'],
        visibility: 'public',
    },
    {
        id: 'demo-07',
        title: '零號協議 · 潛入',
        subtitle: 'Cyberpunk RED · 企業資料庫',
        sessionDate: '2025-02-28',
        location: '夜城第 7 區',
        theme: 'discord',
        messageCount: 198,
        playerNames: ['GM', 'V', 'Jackie', 'Panam'],
        visibility: 'public',
    },
    {
        id: 'demo-08',
        title: '霧港見聞 · 第三章',
        subtitle: 'Blades in the Dark · 走私路線',
        sessionDate: '2025-01-20',
        location: 'Doskvol 霧港',
        theme: 'kakuyomu',
        messageCount: 156,
        playerNames: ['GM', 'Crew'],
        visibility: 'public',
    },
    {
        id: 'demo-09',
        title: '春櫻社日常 · 社團會議',
        subtitle: '青春劇 · 輕鬆 RP',
        sessionDate: '2024-12-08',
        location: '學園社團室',
        theme: 'kindle',
        messageCount: 88,
        playerNames: ['GM', '社長', '副社', '新人'],
        visibility: 'public',
    },
    {
        id: 'demo-10',
        title: '深淵迴響 · 終章',
        subtitle: 'CoC 7th · 長期戰役收尾',
        sessionDate: '2024-11-30',
        location: '調查員安全屋',
        theme: 'kakuyomu',
        messageCount: 312,
        playerNames: ['KP', 'Team Alpha'],
        visibility: 'public',
    },
];

const DEMO_EVENTS = {
    'demo-01': [
        { type: 'scene', title: '舊書店 · 傍晚' },
        { type: 'narration', text: '霉味與紙張混合的氣味撲面而來。門口的風鈴輕輕搖晃，卻沒有風。' },
        { type: 'say', name: '美咲', text: '這裡的書……好像都在看著我們。' },
        { type: 'say', name: '健一', text: '目錄在哪？我們時間不多。' },
        { type: 'dice', name: '美咲', label: '圖書館使用', expr: '1d100', result: '42', verdict: '成功' },
        { type: 'narration', text: '在櫃台後方，一本沒有書名的黑皮冊子微微發光。' },
        { type: 'ooc', name: 'KP', text: '大家可以描述一下想怎麼接近。' },
        { type: 'reference', caption: '書店平面圖', url: 'https://example.com/handout/map' },
    ],
};

function listDemoLogs() {
    return DEMO_LOGS.map((log) => ({
        ...log,
        isDemo: true,
        demo: true,
    }));
}

function getDemoLog(id) {
    const meta = DEMO_LOGS.find((log) => log.id === id);
    if (!meta) return null;
    const events = DEMO_EVENTS[id] || [
        { type: 'scene', title: meta.subtitle || meta.title },
        { type: 'narration', text: '這是示範團錄。登入後可匯入你自己的 Discord 聊天紀錄。' },
        { type: 'say', name: 'KP', text: '歡迎來到 HKTRPG 團錄閱讀器。' },
    ];
    return {
        ...meta,
        events,
        settings: { hideOOC: false, hideDice: false },
        isDemo: true,
        canEdit: false,
        isOwner: false,
    };
}

function isDemoLogId(id) {
    return typeof id === 'string' && id.startsWith('demo-');
}

module.exports = {
    listDemoLogs,
    getDemoLog,
    isDemoLogId,
};
