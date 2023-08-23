"use strict";

require('dotenv').config({ override: true });
const fs = require('fs');



fs.readdirSync(__dirname + '/modules/').forEach(function (file) {
  if (file.match(/\.js$/) && file.match(/^core-/)) {
    let name = file.replace('.js', '');
    exports[name] = require('./modules/' + file);
  }
});

process.on('warning', (warning) => {
  console.warn('warning', warning.name); // Print the warning name
  console.warn('warning', warning.message); // Print the warning message
  console.warn('warning', warning.stack); // Print the stack trace
});

process.stdout.on('error', function (err) {
  if (err.code == "EPIPE") {
    console.log('EPIPE err:', err);
  }
});
/*
流程解釋

首先這裡會call modules/中的Discord line Telegram 三個檔案
如果在Heroku 有輸入它們各自的TOKEN 的話
服務就會各自啓動

Discord line Telegram三套BOT 都會統一呼叫analytics.js
再由analytics.js 呼叫roll/ 中各個的骰檔

所以基本上,要增加骰組
參考/roll中的DEMO骰組就好

以上, 有不明可以在GITHUB問我

另外, 使用或參考其中代碼的話, 請保持開源
感謝

*/