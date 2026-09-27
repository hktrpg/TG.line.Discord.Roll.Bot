(function () {
  'use strict';
  window.CardaThemes = window.CardaThemes || {};
  Object.assign(window.CardaThemes, {
    1: { name: '現場檔案', english: 'Field Dossier', description: '一張辦案卷宗把角色全貌攤開；三欄交叉對照，適合同時掃讀技能、行動和狀態。', order: ['attributes', 'status', 'saves', 'senses', 'training', 'skills', 'actions', 'powers', 'features', 'inventory', 'background', 'notes'] },
    2: { name: '戰術訊號', english: 'Signal', description: '駕駛艙操作模型：骰值與戰鬥操作固定在主控台；下方支援資料可單項、多選或全部顯示。', order: ['attributes', 'senses', 'status', 'saves', 'skills', 'actions', 'powers', 'training', 'features', 'background', 'notes', 'inventory'] },
    3: { name: '冒險總帳', english: 'The Ledger', description: '帳簿逐行對值；編號、欄名和內容沿同一基線排列，方便核對大量角色資料。', order: ['attributes', 'saves', 'senses', 'training', 'skills', 'actions', 'powers', 'status', 'features', 'inventory', 'background', 'notes'] },
    4: { name: '理性索引', english: 'Swiss Index', description: '索引在左、閱讀區在右；可單項查閱、在目錄多選，或一次展開所有資料。', order: ['attributes', 'status', 'saves', 'skills', 'actions', 'senses', 'powers', 'training', 'features', 'background', 'notes', 'inventory'] },
    5: { name: '冒險公報', english: 'The Gazette', description: '報紙閱讀次序：人物故事作頭版，數值作導讀，其他資料依欄流分頁閱讀。', order: ['attributes', 'saves', 'senses', 'training', 'skills', 'actions', 'powers', 'status', 'features', 'inventory', 'background', 'notes'] },
    6: { name: '旅人抄本', english: 'The Manuscript', description: '章節目錄配正文；可專讀一章、選取多章並列，或展開全卷，再以前後頁瀏覽。', order: ['attributes', 'saves', 'senses', 'skills', 'actions', 'training', 'powers', 'status', 'background', 'features', 'inventory', 'notes'] },
    7: { name: '能力路線圖', english: 'Transit', description: '把資訊變成可操作路線；可沿站點單項查閱、多選站點，或一次顯示整條路線的記錄。', order: ['attributes', 'saves', 'senses', 'training', 'actions', 'skills', 'powers', 'status', 'features', 'inventory', 'background', 'notes'] },
    8: { name: '角色藍圖', english: 'Blueprint', description: '十二個資料模組落在工程座標網格；位置即索引，方便全盤掃描角色結構。', order: ['attributes', 'saves', 'senses', 'actions', 'skills', 'powers', 'training', 'features', 'status', 'inventory', 'background', 'notes'] },
    9: { name: '調查實驗室', english: 'Laboratory', description: '先選工作模組，再在檯面閱讀該組數據；身心、行動、訓練和人物檔分開檢視。', order: ['status', 'attributes', 'senses', 'saves', 'skills', 'actions', 'training', 'features', 'powers', 'inventory', 'background', 'notes'] },
    10: { name: '角色終端', english: 'Terminal', description: '命令目錄加輸出視窗；可搜尋後單項查閱、多選模組，或用全部顯示一次展開角色資料。', order: ['attributes', 'saves', 'status', 'skills', 'actions', 'senses', 'powers', 'training', 'features', 'inventory', 'background', 'notes'] }
  });
})();
