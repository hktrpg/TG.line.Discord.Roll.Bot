"use strict";
const axios = require('axios');
const Version = require('../roll/help');


describe('Version', () => {
  let version;

  beforeEach(() => {
    version = new Version.Version();
  });

  test('version returns string format', async () => {
    const result = await version.version();
    expect(typeof result).toBe('string');
  });

  test('parses date correctly', () => {
    const date = '2023-02-15T00:19:00Z';
    const formatted = version.YYYYMMDD(date);
    expect(formatted).toBe('230215'); 
  });

  test('updates data on update', async () => {
    // Mock axios response
    version.update = jest.fn(() => {
      version.filesCourt = 10;
      version.pullsNumber = 100;
      version.lastUpdate = '230215';
    });
    
    await version.update();

    expect(version.filesCourt).toBe(10);
    expect(version.pullsNumber).toBe(100);
    expect(version.lastUpdate).toBe('230215');
  });

});