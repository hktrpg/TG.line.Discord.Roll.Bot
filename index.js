"use strict";
require("./modules/config");

const { mongoose, connect } = require('./modules/db-connector');
connect().then(() => {
  require('./modules/app');
});


/*
使用KOA2框架 和mongoose連接mongodb
然後讀取roll中的資料
1. 先連接mongodb, 用new promise包裝
2. 連接成功後, 使用koa框架, 使用router.get方法, 當訪問根路徑時, 返回roll中的資料
3. 啟動koa服務
4. 



*/