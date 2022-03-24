(function () {
    /*global module, require */

    'use strict';

    const scan = require('./scan2'),
        assert = require('assert')

    function check(text, elements) {
        assert.deepEqual(scan(text), elements);
    }

    function checkPunctuator(text) {
        assert.deepEqual(scan(text), [{
            position: 0, line: 1, column: 1,
            punctuator: text, text: text
        }]);
    }

    // empty
    check('', []);

    // whitespace
    check(' ', [
        { position: 0, line: 1, column: 1, whitespace: ' ', text: ' ' }
    ]);

    check('  ', [
        { position: 0, line: 1, column: 1, whitespace: '  ', text: '  ' }
    ]);

    // line terminators
    check('\n', [
        { position: 0, line: 1, column: 1, lineTerminator: '\n', text: '\n' }
    ]);

    check('\n\n', [
        { position: 0, line: 1, column: 1, lineTerminator: '\n', text: '\n' },
        { position: 1, line: 2, column: 1, lineTerminator: '\n', text: '\n' }
    ]);

    check('\r\n\n', [
        {
            position: 0, line: 1, column: 1, lineTerminator: '\r\n',
            text: '\r\n'
        },
        { position: 2, line: 2, column: 1, lineTerminator: '\n', text: '\n' }
    ]);

    // line terminators and whitespace
    check(' \r\n \n ', [
        { position: 0, line: 1, column: 1, whitespace: ' ', text: ' ' },
        {
            position: 1, line: 1, column: 2, lineTerminator: '\r\n',
            text: '\r\n'
        },
        { position: 3, line: 2, column: 1, whitespace: ' ', text: ' ' },
        { position: 4, line: 2, column: 2, lineTerminator: '\n', text: '\n' },
        { position: 5, line: 3, column: 1, whitespace: ' ', text: ' ' }
    ]);

    // punctuators
    checkPunctuator('{');
    checkPunctuator('}');
    checkPunctuator('(');
    checkPunctuator(')');
    checkPunctuator('[');
    checkPunctuator(']');
    checkPunctuator('.');
    checkPunctuator(';');
    checkPunctuator(',');
    checkPunctuator('<');
    checkPunctuator('>');
    checkPunctuator('+');
    checkPunctuator('-');
    checkPunctuator('*');
    checkPunctuator('%');
    checkPunctuator('&');
    checkPunctuator('|');
    checkPunctuator('^');
    checkPunctuator('!');
    checkPunctuator('~');
    checkPunctuator('?');
    checkPunctuator(':');
    checkPunctuator('=');

    checkPunctuator('<=');
    checkPunctuator('>=');
    checkPunctuator('==');
    checkPunctuator('!=');
    checkPunctuator('-=');
    checkPunctuator('+=');
    checkPunctuator('*=');
    checkPunctuator('%=');
    checkPunctuator('&=');
    checkPunctuator('|=');
    checkPunctuator('^=');

    checkPunctuator('===');
    checkPunctuator('!==');

    checkPunctuator('++');
    checkPunctuator('--');
    checkPunctuator('<<');
    checkPunctuator('>>');
    checkPunctuator('>>>');
    checkPunctuator('||');
    checkPunctuator('&&');
    checkPunctuator('<<=');
    checkPunctuator('>>=');

    // strings
    check('\'a\'', [
        { position: 0, line: 1, column: 1, str: '\'a\'', text: '\'a\'' }
    ]);

    check('"a"', [
        { position: 0, line: 1, column: 1, str: '"a"', text: '"a"' }
    ]);

    check('\'a"b\'', [
        { position: 0, line: 1, column: 1, str: '\'a"b\'', text: '\'a"b\'' }
    ]);

    check('\'a\\\'b\'', [
        {
            position: 0, line: 1, column: 1, str: '\'a\\\'b\'',
            text: '\'a\\\'b\''
        }
    ]);

    check('\'\\\\\'', [
        {
            position: 0, line: 1, column: 1, str: '\'\\\\\'',
            text: '\'\\\\\''
        }
    ]);

    // comments
    check('//', [
        {
            position: 0, line: 1, column: 1,
            comment: '//', text: '//'
        }
    ]);

    check('//\n', [
        {
            position: 0, line: 1, column: 1,
            comment: '//', text: '//'
        },
        { position: 2, line: 1, column: 3, lineTerminator: '\n', text: '\n' }
    ]);

    check('/*  */\n', [
        {
            position: 0, line: 1, column: 1, multiline: true,
            comment: '/*  */', text: '/*  */', terminator: false
        },
        { position: 6, line: 1, column: 7, lineTerminator: '\n', text: '\n' }
    ]);

    check('/* \r */\n', [
        {
            position: 0, line: 1, column: 1, multiline: true,
            comment: '/* \r */', text: '/* \r */', terminator: true
        },
        { position: 7, line: 2, column: 3, lineTerminator: '\n', text: '\n' }
    ]);

    // numbers
    check('0', [
        { position: 0, line: 1, column: 1, number: '0', text: '0' }
    ]);

    check('0x00FE', [
        { position: 0, line: 1, column: 1, number: '0x00FE', text: '0x00FE' }
    ]);

    check('a', [
        { position: 0, line: 1, column: 1, id: 'a', text: 'a' }
    ]);

    // names
    check('_', [
        { position: 0, line: 1, column: 1, id: '_', text: '_' }
    ]);

    check('$', [
        { position: 0, line: 1, column: 1, id: '$', text: '$' }
    ]);

    check('tst', [
        { position: 0, line: 1, column: 1, id: 'tst', text: 'tst' }
    ]);

    check('/**/v//', [
        {
            position: 0, line: 1, column: 1, multiline: true,
            comment: '/**/', text: '/**/', terminator: false
        },
        { position: 4, line: 1, column: 5, id: 'v', text: 'v' },
        {
            position: 5, line: 1, column: 6, comment: '//',
            text: '//'
        }
    ]);

    check('var q = 1', [
        { position: 0, line: 1, column: 1, keyword: 'var', text: 'var' },
        { position: 3, line: 1, column: 4, whitespace: ' ', text: ' ' },
        { position: 4, line: 1, column: 5, id: 'q', text: 'q' },
        { position: 5, line: 1, column: 6, whitespace: ' ', text: ' ' },
        { position: 6, line: 1, column: 7, punctuator: '=', text: '=' },
        { position: 7, line: 1, column: 8, whitespace: ' ', text: ' ' },
        { position: 8, line: 1, column: 9, number: '1', text: '1' }
    ]);

    check('/a/', [
        { position: 0, line: 1, column: 1, re: '/a/', text: '/a/' }
    ]);

    // regexp after punctuators
    check('=/a/', [
        { position: 0, line: 1, column: 1, punctuator: '=', text: '=' },
        { position: 1, line: 1, column: 2, re: '/a/', text: '/a/' }
    ]);

    check('{/a/', [
        { position: 0, line: 1, column: 1, punctuator: '{', text: '{' },
        { position: 1, line: 1, column: 2, re: '/a/', text: '/a/' }
    ]);

    check('(/a/', [
        { position: 0, line: 1, column: 1, punctuator: '(', text: '(' },
        { position: 1, line: 1, column: 2, re: '/a/', text: '/a/' }
    ]);

    check(';/a/', [
        { position: 0, line: 1, column: 1, punctuator: ';', text: ';' },
        { position: 1, line: 1, column: 2, re: '/a/', text: '/a/' }
    ]);

    check('||/a/', [
        { position: 0, line: 1, column: 1, punctuator: '||', text: '||' },
        { position: 2, line: 1, column: 3, re: '/a/', text: '/a/' }
    ]);

    check('function(a,b){}', [
        {
            position: 0, line: 1, column: 1, text: "function",
            keyword: "function"
        },
        { position: 8, line: 1, column: 9, punctuator: "(", text: "(" },
        { position: 9, line: 1, column: 10, id: 'a', text: 'a' },
        { position: 10, line: 1, column: 11, punctuator: ',', text: ',' },
        { position: 11, line: 1, column: 12, id: 'b', text: 'b' },
        { position: 12, line: 1, column: 13, punctuator: ')', text: ')' },
        { position: 13, line: 1, column: 14, punctuator: '{', text: '{' },
        { position: 14, line: 1, column: 15, punctuator: '}', text: '}' }
    ]);

    // regression
    check('1/a=1/b', [
        { position: 0, line: 1, column: 1, number: '1', text: '1' },
        { position: 1, line: 1, column: 2, punctuator: '/', text: '/' },
        { position: 2, line: 1, column: 3, id: 'a', text: 'a' },
        { position: 3, line: 1, column: 4, punctuator: '=', text: '=' },
        { position: 4, line: 1, column: 5, number: '1', text: '1' },
        { position: 5, line: 1, column: 6, punctuator: '/', text: '/' },
        { position: 6, line: 1, column: 7, id: 'b', text: 'b' }
    ]);

    check('a/1=/b/', [
        { position: 0, line: 1, column: 1, id: 'a', text: 'a' },
        { position: 1, line: 1, column: 2, punctuator: '/', text: '/' },
        { position: 2, line: 1, column: 3, number: '1', text: '1' },
        { position: 3, line: 1, column: 4, punctuator: '=', text: '=' },
        { position: 4, line: 1, column: 5, re: '/b/', text: '/b/' }
    ]);

    check('this/b/a/c', [
        { position: 0, line: 1, column: 1, text: 'this', keyword: 'this' },
        { position: 4, line: 1, column: 5, punctuator: '/', text: '/' },
        { position: 5, line: 1, column: 6, id: 'b', text: 'b' },
        { position: 6, line: 1, column: 7, punctuator: '/', text: '/' },
        { position: 7, line: 1, column: 8, id: 'a', text: 'a' },
        { position: 8, line: 1, column: 9, punctuator: '/', text: '/' },
        { position: 9, line: 1, column: 10, id: 'c', text: 'c' }
    ]);

    // Not supported, will parsed as division.
    // Currently only known occurence is jade.min.js
    0 && check('if(1)/3/g', [
        { position: 0, line: 1, column: 1, text: 'if', keyword: 'if' },
        { position: 2, line: 1, column: 3, punctuator: '(', text: '(' },
        { position: 3, line: 1, column: 4, number: '1', text: '1' },
        { position: 4, line: 1, column: 5, punctuator: ')', text: ')' },
        { position: 5, line: 1, column: 6, re: '/3/g', text: '/3/g' }
    ]);

    check('(1)/3/g', [
        { position: 0, line: 1, column: 1, punctuator: '(', text: '(' },
        { position: 1, line: 1, column: 2, number: '1', text: '1' },
        { position: 2, line: 1, column: 3, punctuator: ')', text: ')' },
        { position: 3, line: 1, column: 4, punctuator: '/', text: '/' },
        { position: 4, line: 1, column: 5, number: '3', text: '3' },
        { position: 5, line: 1, column: 6, punctuator: '/', text: '/' },
        { position: 6, line: 1, column: 7, id: 'g', text: 'g' }
    ]);

    scan(require('fs').readFileSync('./scan2.js', 'utf8'));
}());