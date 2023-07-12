"use strict";
const { Snowflake } = require('nodejs-snowflake');
//https://www.npmjs.com/package/nodejs-snowflake
class DiscordDefer {
    constructor() {
        this.deferID = [];
    }

    addDeferID() {
        const uid = new Snowflake(config);
        this.defer.push();
    }

    async resolveDefer() {
        for (let i = 0; i < this.defer.length; i++) {
            await this.defer[i].edit(this.defer[i].content + "\n(已處理)");
        }
    }
}