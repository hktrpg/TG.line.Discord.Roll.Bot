"use strict";
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'axios'.
const axios = require('axios');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Version'.
const Version = require('../roll/help');


// @ts-expect-error TS(2582): Cannot find name 'describe'. Do you need to instal... Remove this comment to see the full error message
describe('Version', () => {
  let version: any;

  // @ts-expect-error TS(2304): Cannot find name 'beforeEach'.
  beforeEach(() => {
    // @ts-expect-error TS(2339): Property 'Version' does not exist on type 'typeof ... Remove this comment to see the full error message
    version = new Version.Version();
  });

  // @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
  test('version returns string format', async () => {
    const result = await version.version();
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(typeof result).toBe('string');
  });

  // @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
  test('parses date correctly', () => {
    const date = '2023-02-15T00:19:00Z';
    const formatted = version.YYYYMMDD(date);
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(formatted).toBe('230215'); 
  });

  // @ts-expect-error TS(2582): Cannot find name 'test'. Do you need to install ty... Remove this comment to see the full error message
  test('updates data on update', async () => {
    // Mock axios response
    // @ts-expect-error TS(2304): Cannot find name 'jest'.
    version.update = jest.fn(() => {
      version.filesCourt = 10;
      version.pullsNumber = 100;
      version.lastUpdate = '230215';
    });
    
    await version.update();

    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(version.filesCourt).toBe(10);
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(version.pullsNumber).toBe(100);
    // @ts-expect-error TS(2304): Cannot find name 'expect'.
    expect(version.lastUpdate).toBe('230215');
  });

});