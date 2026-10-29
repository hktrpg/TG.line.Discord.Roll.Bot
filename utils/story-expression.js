'use strict';

// Small expression interpreter: only primitives from own scope properties are visible.
// No property access, calls, assignments or JavaScript evaluation.
function evaluateStoryExpression(input, scope = {}) {
    if (typeof input !== 'string' || input.length > 2048) throw new Error('Invalid expression');
    const tokens = [];
    const pattern = /\s*(===|!==|==|!=|<=|>=|&&|\|\||[()+\-*/%<>!]|\d+|[A-Za-z_][A-Za-z0-9_]*)/y;
    let pos = 0;
    while (pos < input.length) {
        if (!input.slice(pos).trim()) break;
        pattern.lastIndex = pos;
        const match = pattern.exec(input);
        if (!match) throw new Error('Invalid expression token');
        tokens.push(match[1]);
        pos = pattern.lastIndex;
        if (tokens.length > 512) throw new Error('Expression too long');
    }
    let index = 0;
    let depth = 0;
    const precedence = { '||': 1, '&&': 2, '==': 3, '!=': 3, '===': 3, '!==': 3,
        '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
    function primary(execute) {
        if (++depth > 64) throw new Error('Expression nesting limit');
        const token = tokens[index++];
        let result;
        if (token === '(') {
            result = expression(1, execute);
            if (tokens[index++] !== ')') throw new Error('Missing closing parenthesis');
        } else if (token === '!' || token === '+' || token === '-') {
            const value = primary(execute);
            result = token === '!' ? !value : token === '+' ? +value : -value;
        } else if (/^\d+$/.test(token || '')) result = Number(token);
        else if (token === 'true' || token === 'false') result = token === 'true';
        else if (!execute && /^[A-Za-z_][A-Za-z0-9_]*$/.test(token || '')) result = undefined;
        else if (token && Object.hasOwn(scope, token)) {
            result = scope[token];
            if (!['string', 'number', 'boolean'].includes(typeof result) && result !== null) throw new Error('Invalid scope value');
        } else throw new Error('Unknown identifier');
        depth--;
        return result;
    }
    function expression(min, execute = true) {
        let left = primary(execute);
        while (Object.hasOwn(precedence, tokens[index]) && precedence[tokens[index]] >= min) {
            const op = tokens[index++];
            const evaluateRight = execute && (op !== '&&' || Boolean(left)) && (op !== '||' || !left);
            const right = expression(precedence[op] + 1, evaluateRight);
            if (!execute) { left = undefined; continue; }
            switch (op) {
                case '||': left = left || right; break;
                case '&&': left = left && right; break;
                // Preserve existing story comparison semantics.
                case '==': left = left == right; break;
                case '!=': left = left != right; break;
                case '===': left = left === right; break;
                case '!==': left = left !== right; break;
                case '<': left = left < right; break;
                case '<=': left = left <= right; break;
                case '>': left = left > right; break;
                case '>=': left = left >= right; break;
                case '+': left += right; break;
                case '-': left -= right; break;
                case '*': left *= right; break;
                case '/': left /= right; break;
                case '%': left %= right; break;
                default: throw new Error('Invalid operator');
            }
        }
        return left;
    }
    const value = expression(1);
    if (index !== tokens.length) throw new Error('Unexpected token');
    return value;
}

module.exports = { evaluateStoryExpression };
