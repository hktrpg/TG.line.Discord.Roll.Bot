(function () {
  /*global module, require */

  'use strict';
  const log = require('log-to-file');
  const scan = require('./modules/scan2'),
    assert = require('assert'),
    util = require('util');
  function check(text, elements) {
    assert.deepEqual(scan(text), elements);
  }

  function checkPunctuator(text) {
    assert.deepEqual(scan(text), [{
      position: 0, line: 1, column: 1,
      punctuator: text, text: text
    }]);
  }
  console.log('start')
  // empty
  function stringify(x) {
    return JSON.stringify(x)

  }
  let a = scan(require('fs').readFileSync('./modules/scan2.js', 'utf8'));
  log(stringify(a), 'my-log.log');

}());