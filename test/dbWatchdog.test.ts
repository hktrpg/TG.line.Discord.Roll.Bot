"use strict";
const wdt = require('../modules/dbWatchdog');

test('Test wdt dbErrOccurs less then max retry count should be online', () => {
    wdt.dbErrOccurs();
    expect(wdt.isDbOnline()).toBe(true);
});

test('Test wdt dbErrOccurs more then max retry count should be offline', () => {
    wdt.dbErrOccurs();
    wdt.dbErrOccurs();
    wdt.dbErrOccurs();
    expect(wdt.isDbOnline()).toBe(false);
});
