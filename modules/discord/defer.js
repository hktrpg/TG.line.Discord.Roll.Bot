"use strict";
const { Snowflake } = require('nodejs-snowflake');

class DiscordDefer {
    constructor() {
        this.deferID = [];
    }

    addDeferID() {
        this.defer.push(message);
    }

    async resolveDefer() {
        for (let i = 0; i < this.defer.length; i++) {
            await this.defer[i].edit(this.defer[i].content + "\n(已處理)");
        }
    }
}