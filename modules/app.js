"use strict";
const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();
exports.analytics = require('../modules/analytics.js');
const MESSAGE_SPLITOR = (/\S+/ig);

router.get('/roll', async (ctx, next) => {
    console.log('ctx:', ctx);
    console.log("request.query", ctx.request.query);
    if (!ctx.request.query.roll) return;
    const inputStr = ctx.request.query.roll.match(MESSAGE_SPLITOR);

    let target = exports.analytics.findRollList(inputStr);
    if (!target) return null;
});
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
}
);


// Requirements

