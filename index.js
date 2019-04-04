require('fs').readdirSync(__dirname + '/modules/').forEach(function (file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    exports[name] = require('./modules/' + file);
  }
});
const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.EnvironmentPlugin([
        'HEROKU_RELEASE_VERSION',
      ]),
    ]
  }
}
console.log('VERSION: ' + process.env.HEROKU_RELEASE_VERSION || '404')
/*
流程解釋

首先這裡會call modules/中的Discord line Telegram 三個檔案
如果在Heroku 有輸入它們各自的TOKEN 的話
服務就會各自啓動

Discord line Telegram三套BOT 都會統一呼叫analytics.js
再由analytics.js 呼叫roll/ 中各個的骰檔

所以基本上,要增加骰組
都要修改analytics.js 及把新骰組放在Roll中

以上, 有不明可以在GITHUB問我

另外, 使用或參考其中代碼的話, 請保持開源
感謝

*/