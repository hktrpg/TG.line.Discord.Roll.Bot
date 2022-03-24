/**
 * Scans source code and returns a stream of tokens.
 *
 * The scanner understands ECMA-262, edition 5.1 (June 2011).
 *
 * Token-specific properties: comment, id - identifier, lt - line terminator,
 * punctuator, re - regexp, str - string, whitespace, keyword.
 */

(function () {
    'use strict';

    var chr, punctuators, divPunctuators, keywords, State;

    /**
     * There are two approaches on checking the character:
     *
     * * By following the specification and quering Unicode Character Database
     *   (UCD). This approach requires additional dependency on eigher plain
     *   text data or some module that encapsulate it (The "unicode" module
     *   seems to be the good one).
     * * By querying the engine with the `'var ...'` statements. This approach
     *   is extremely slow on the complete range of characters, but the complete
     *   range is almost never necessary.
     */
    chr = (function () {
        function chars(list) {
            var pattern = '[\\u' + list.replace(/(?:(-)| )/g, '$1\\u') + ']',
                regexp = new RegExp(pattern),
                method = function (ch) { return regexp.test(ch); };
            method.not = function (ch) { return !method(ch); };
            return method;
        }
        function cache(storage, key, create) {
            var result = storage[key];
            return undefined === result ? storage[key] = create() : result;
        }
        var idStartCache = {}, idContinueCache = {};
        return {
            whitespace: chars('0009 000B 000C 0020 00A0 FEFF'),
            lineTerminator: chars('000A 000D 2028 2029'),
            idStart: function (ch) {
                return cache(idStartCache, ch, function () {
                    try {
                        return 'a' === eval('var _q={},' + ch + '_=\'a\';' +
                            '_q[' + ch + '_]=7;(' + ch + '_)');
                    } catch (e) { }
                    return false;
                });
            },
            idContinue: function (ch) {
                return cache(idContinueCache, ch, function () {
                    try {
                        return 'a' === eval('var q={},_' + ch + '1=\'a\';' +
                            'q[_' + ch + '1]=7;(_' + ch + '1)');
                    } catch (e) { }
                    return false;
                });
            }
        };
    }());
    punctuators = new RegExp(['>>>=', '<<=', '>>=', '>>>', '<<', '>>',
        '[=!]==', '\\|\\|', '[<>=!+\\-*%&|^]=', '&&', '\\+\\+', '--',
        '[{}()\\[\\]\\.;,<>+\\-*%&|^!~?:=]'].join('|'), 'g');
    divPunctuators = /\/=?/g;
    keywords = ('break case catch class const continue debugger default ' +
        'delete do else enum export extends finally for function if import ' +
        'in instanceof new return super switch this throw try typeof var ' +
        'void while with').split(' ');

    State = (function () {
        function State(input) {
            this.index = 0;
            this.column = this.line = 1;
            this.input = input;
        }

        State.prototype.end = function () {
            return this.input.length <= this.index;
        };

        State.prototype.character = function () {
            return this.input[this.index];
        };

        State.prototype.test = function (criteria) {
            if (this.end()) {
                return false;
            }
            switch (typeof criteria) {
                case 'string':
                    return criteria === this.input.substr(this.index,
                        criteria.length);
                case 'function':
                    return criteria(this.input[this.index], this.input, this.index);
            }
        };

        State.prototype.indexOf = function (substring, delta) {
            delta = delta || 0;
            var pos = this.input.indexOf(substring, this.index + delta);
            return -1 === pos ? -1 : (pos + delta - this.index);
        };

        State.prototype.move = function () {
            var ch = this.input[this.index],
                prev = this.input[this.index - 1];
            if ('\u000D' === prev) {
                if ('\u000A' === ch || '\u000D' === ch ||
                    !chr.lineTerminator(ch)) {
                    this.column = 1;
                    this.line += 1;
                } else {
                    this.column = 1;
                    this.line += 2;
                }
            } else {
                if ('\u000D' === ch) {
                    this.column += 1;
                } else if (chr.lineTerminator(ch)) {
                    this.column = 1;
                    this.line += 1;
                } else {
                    this.column += 1;
                }
            }
            this.index += 1;
        };

        function readByCriteria(state, criteria) {
            var buffer = '';
            while (state.test(criteria)) {
                buffer += state.read();
            }
            return buffer || null;
        }

        function readByLength(state, length) {
            var len = Math.min(length, state.input.length - state.index),
                content = state.input.substr(state.index, len) || null;
            while (len--) {
                state.move();
            }
            return content;
        }

        function readByRegExp(state, regexp) {
            var match, len;
            regexp.lastIndex = state.index;
            match = regexp.exec(state.input);
            if (match === null || state.index !== match.index) {
                return null;
            }
            len = match[0].length;
            while (len--) {
                state.move();
            }
            return match[0];
        }

        State.prototype.read = function (criteria) {
            switch (typeof criteria) {
                case 'number':
                    return readByLength(this, criteria);
                case 'function':
                    return readByCriteria(this, criteria);
                case 'object':
                    return (criteria instanceof RegExp) ?
                        readByRegExp(this, criteria) : null;
                case 'undefined':
                    return readByLength(this, 1);
                default:
                    return null;
            }
        };

        State.prototype.readToken = function (property, criteria) {
            var token = this.tokenBase();
            token.text = token[property] = this.read(criteria);
            return token.text ? token : null;
        };

        State.prototype.tokenBase = function () {
            return {
                position: this.index, line: this.line,
                column: this.column
            };
        };

        State.prototype.copy = function () {
            return new State(this.input).apply(this);
        };

        State.prototype.apply = function (state) {
            this.column = state.column;
            this.line = state.line;
            this.index = state.index;
            return this;
        };

        State.prototype.error = function (text) {
            var context = this.input.substr(this.index - 5, 10),
                error = new Error(text + ' (context: ' +
                    JSON.stringify(context) + ', character: ' +
                    JSON.stringify(this.input[this.index]) + ', line: ' +
                    this.line + ', column: ' + this.column + ')');
            error.text = text;
            error.line = this.line;
            error.column = this.column;
            error.context = context;
            throw error;
        };

        return State;
    }());

    function lineTerminator(state) {
        return state.test(chr.lineTerminator) &&
            state.readToken('lineTerminator', 1 + state.test('\r\n')) ||
            null;
    }

    function comment(state) {
        var pos, token;
        if (state.test('/*')) {
            if (-1 === (pos = state.indexOf('*/', 2))) {
                state.error('Unclosed multiline comment');
            }
            token = state.readToken('comment', pos);
            token.multiline = true;
            token.terminator = chr.lineTerminator(token.comment);
            return token;
        }
        return state.test('//') ? state.readToken('comment',
            chr.lineTerminator.not) : null;
    }

    function identifierName(state) {
        var token;
        if (state.test(chr.idStart)) {
            token = state.tokenBase();
            token.text = token.id = state.read() +
                (state.read(chr.idContinue) || '');
            return token;
        }
        return null;
    }

    function identifier(state) {
        var token = identifierName(state);
        if (null !== token && -1 !== keywords.indexOf(token.id)) {
            token.keyword = token.id;
            delete token.id;
        }
        return token;
    }

    function numericLiteral(state) {
        return state.readToken('number',
            /(0x[\da-f]+|(0|[1-9]+(\.\d+)?|\.\d+)(e[+\-]?\d+)?)/ig);
    }

    function stringLiteral(state) {
        var quote, buffer, tmp, token,
            esc = /\\(u[\dA-Fa-f]{4}|x[\dA-Fa-f]{2}|\r(?!\n)|\r\n|\n|[^ux])/g;
        if (!state.test('"') && !state.test('\'')) {
            return null;
        }
        token = state.tokenBase();
        quote = buffer = state.read();
        do {
            if (state.end() || state.test(chr.lineTerminator)) {
                state.error('Unterminated string');
            }
            tmp = state.character();
            if ('\\' === tmp) {
                tmp = state.read(esc);
                if (null === tmp) {
                    state.error('Invalid escape sequence');
                }
                buffer += tmp;
                continue;
            }
            buffer += tmp;
            state.move();
            if (quote === tmp) {
                token.text = token.str = buffer;
                return token;
            }
        } while (true);
    }

    function regexpLiteral(state) {
        function untilLineTerminator(state, excludedChars) {
            var ch = state.character();
            return (chr.lineTerminator(ch) ||
                -1 !== excludedChars.indexOf(ch)) ? null : state.read();
        }

        function backslash(state) {
            var local, ch;
            if (state.test('\\')) {
                local = state.copy();
                local.move();
                ch = untilLineTerminator(local, '');
                if (null === ch) {
                    return null;
                }
                state.apply(local);
                return '\\' + ch;
            }
            return null;
        }

        function regexpClassChars(state) {
            var buffer = '', ch;
            do {
                ch = untilLineTerminator(state, ']\\') ||
                    backslash(state) || '';
                buffer += ch;
            } while ('' !== ch);
            return buffer;
        }

        function regexpClass(state) {
            var local, ch, body;

            if (state.test('[')) {
                local = state.copy();
                local.move();
                body = regexpClassChars(local);
                ch = local.read();
                if (']' === ch) {
                    state.apply(local);
                    return '[' + body + ']';
                }
                local.error('Incomplete regexp group.');
            }
            return null;
        }

        function chars(state) {
            var result = '', ch;
            do {
                ch = untilLineTerminator(state, '\\/[') || backslash(state) ||
                    regexpClass(state) || '';
                result += ch;
            } while ('' !== ch);
            return result;
        }

        function body(state) {
            var firstChar = untilLineTerminator(state, '*\\/[') ||
                backslash(state) || regexpClass(state);
            return null === firstChar ? null : firstChar + chars(state);
        }

        var local, reBody, reFlags, token;
        if (state.test('/')) {
            local = state.copy();
            token = local.tokenBase();
            local.move();
            reBody = body(local);
            if (state.test('/')) {
                local.move();
                reFlags = local.read(chr.idContinue) || '';
                token.text = token.re = '/' + reBody + '/' + reFlags;
                state.apply(local);
                return token;
            }
        }
        return null;
    }

    function scan(input) {
        var state, tokens, token, context;

        state = new State(input);
        context = 'regexp';
        tokens = [];
        while (!state.end()) {
            token = state.readToken('whitespace', chr.whitespace) ||
                lineTerminator(state) ||
                comment(state) ||
                identifier(state) ||
                state.readToken('punctuator', punctuators) ||
                numericLiteral(state) ||
                stringLiteral(state);
            if (null === token) {
                switch (context) {
                    case 'div':
                        token = state.readToken('punctuator', divPunctuators);
                        break;
                    case 'regexp':
                        token = regexpLiteral(state);
                        break;
                }
            }
            if (null === token) {
                state.error('Unexpected character');
            }
            if (token.number || token.string || token.id ||
                'this' === token.keyword) {
                context = 'div';
            } else if (token.punctuator) {
                context = -1 !== [']', ')'].indexOf(token.punctuator) ?
                    'div' : 'regexp';
            }
            tokens.push(token);
        }

        return tokens;
    }

    (function () {
        /*global module, window */
        if ('undefined' !== typeof module) {
            module.exports = scan;
        } else if ('undefined' !== typeof window) {
            (window.spelljs || (window.spelljs = {})).scan = scan;
        }
    }());
}());