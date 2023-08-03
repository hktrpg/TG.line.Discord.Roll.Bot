"use strict";

class Params {
    constructor() {
        this._params = {};
    }

    get(key) {
        return this._params[key];
    }

    set(key, value) {
        this._params[key] = value;
    }
}