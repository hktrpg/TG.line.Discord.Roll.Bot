"use strict";
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const wdt = require('../modules/dbWatchdog');

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test wdt dbErrOccurs less then max retry count should be online', () => {
    wdt.dbErrOccurs();
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(wdt.isDbOnline()).toBe(true);
});

// @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
test('Test wdt dbErrOccurs more then max retry count should be offline', () => {
    wdt.dbErrOccurs();
    wdt.dbErrOccurs();
    wdt.dbErrOccurs();
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(wdt.isDbOnline()).toBe(false);
});
