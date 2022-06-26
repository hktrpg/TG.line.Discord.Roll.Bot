"use strict";

// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('dotenv').config();
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (process.env.mongoURL) {
  // @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
  require('./modules/db-connector');
  // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
  return;
}



// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('fs').readdirSync(__dirname + '/modules/').forEach(function (file: any) {
  if (file.match(/\.js$/) && file.match(/^core-/)) {
    var name = file.replace('.js', '');
    // @ts-expect-error TS(2304): Cannot find name 'exports'.
    exports[name] = require('./modules/' + file);
  }
});

// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
process.on('warning', (warning: any) => {
  console.warn('warning', warning.name); // Print the warning name
  console.warn('warning', warning.message); // Print the warning message
  console.warn('warning', warning.stack); // Print the stack trace
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