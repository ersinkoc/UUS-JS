import { describe, it, expect, beforeEach } from 'vitest';
import { createSafeEvaluator, parseEventExpression } from '../src/evaluator';

describe('Safe Evaluator', () => {
  let state: any;
  let evaluate: (expression: string) => any;

  beforeEach(() => {
    state = {
      count: 0,
      name: 'test',
      items: [1, 2, 3],
      user: { id: 1, name: 'John' },
      isActive: true,
      price: 10.5,
      nullValue: null,
      undefinedValue: undefined,
    };
    evaluate = createSafeEvaluator(state);
  });

  describe('Basic Expressions', () => {
    it('should evaluate simple state access', () => {
      expect(evaluate('count')).toBe(0);
      expect(evaluate('name')).toBe('test');
      expect(evaluate('isActive')).toBe(true);
    });

    it('should evaluate arithmetic expressions', () => {
      expect(evaluate('count + 5')).toBe(5);
      expect(evaluate('price * 2')).toBe(21);
      expect(evaluate('10 - count')).toBe(10);
      expect(evaluate('100 / 10')).toBe(10);
    });

    it('should evaluate comparison expressions', () => {
      expect(evaluate('count === 0')).toBe(true);
      expect(evaluate('count !== 1')).toBe(true);
      expect(evaluate('price > 10')).toBe(true);
      expect(evaluate('price >= 10.5')).toBe(true);
      expect(evaluate('count < 1')).toBe(true);
      expect(evaluate('count <= 0')).toBe(true);
    });

    it('should evaluate logical expressions', () => {
      expect(evaluate('isActive && count === 0')).toBe(true);
      expect(evaluate('isActive || count === 1')).toBe(true);
      expect(evaluate('!isActive')).toBe(false);
    });

    it('should handle empty or invalid expressions', () => {
      expect(evaluate('')).toBe(undefined);
      expect(evaluate('   ')).toBe(undefined);
    });
  });

  describe('Complex Expressions', () => {
    it('should evaluate object property access', () => {
      expect(evaluate('user.name')).toBe('John');
      expect(evaluate('user.id')).toBe(1);
      expect(evaluate('user["name"]')).toBe('John');
    });

    it('should evaluate array access', () => {
      expect(evaluate('items[0]')).toBe(1);
      expect(evaluate('items[1]')).toBe(2);
      expect(evaluate('items.length')).toBe(3);
    });

    it('should evaluate ternary expressions', () => {
      expect(evaluate('isActive ? "yes" : "no"')).toBe('yes');
      expect(evaluate('count > 0 ? count : 10')).toBe(10);
    });

    it('should evaluate template literals', () => {
      expect(evaluate('`Hello ${name}`')).toBe('Hello test');
      expect(evaluate('`Count: ${count}, Active: ${isActive}`')).toBe(
        'Count: 0, Active: true'
      );
    });

    it('should evaluate object literal expressions', () => {
      const result = evaluate('{ a: 1, b: "test", c: isActive }');
      expect(result).toEqual({ a: 1, b: 'test', c: true });
    });

    it('should handle object literals starting with {', () => {
      const result = evaluate('{x: count, y: price}');
      expect(result).toEqual({ x: 0, y: 10.5 });
    });
  });

  describe('Assignment Expressions', () => {
    it('should handle simple assignments', () => {
      expect(evaluate('count = 5')).toBe(5);
      expect(state.count).toBe(5);
    });

    it('should handle compound assignments', () => {
      state.count = 10;
      expect(evaluate('count += 5')).toBe(15);
      expect(state.count).toBe(15);

      expect(evaluate('count -= 3')).toBe(12);
      expect(state.count).toBe(12);

      expect(evaluate('count *= 2')).toBe(24);
      expect(state.count).toBe(24);

      expect(evaluate('count /= 4')).toBe(6);
      expect(state.count).toBe(6);
    });

    it('should handle increment/decrement', () => {
      state.count = 5;
      expect(evaluate('count++')).toBe(5);
      expect(state.count).toBe(6);

      expect(evaluate('++count')).toBe(7);
      expect(state.count).toBe(7);

      expect(evaluate('count--')).toBe(7);
      expect(state.count).toBe(6);

      expect(evaluate('--count')).toBe(5);
      expect(state.count).toBe(5);
    });
  });

  describe('Built-in Globals', () => {
    it('should have access to Math functions', () => {
      expect(evaluate('Math.max(1, 2, 3)')).toBe(3);
      expect(evaluate('Math.min(1, 2, 3)')).toBe(1);
      expect(evaluate('Math.floor(3.7)')).toBe(3);
      expect(evaluate('Math.ceil(3.2)')).toBe(4);
    });

    it('should have access to Array methods', () => {
      expect(evaluate('Array.isArray(items)')).toBe(true);
      expect(evaluate('Array.from([1,2,3])')).toEqual([1, 2, 3]);
    });

    it('should have access to Object methods', () => {
      expect(evaluate('Object.keys(user)')).toEqual(['id', 'name']);
      expect(evaluate('Object.values(user)')).toEqual([1, 'John']);
    });

    it('should have access to String methods', () => {
      expect(evaluate('String(count)')).toBe('0');
      expect(evaluate('name.toUpperCase()')).toBe('TEST');
    });

    it('should have access to Number methods', () => {
      expect(evaluate('Number("42")')).toBe(42);
      expect(evaluate('Number.isInteger(price)')).toBe(false);
    });

    it('should have access to parsing functions', () => {
      expect(evaluate('parseInt("10")')).toBe(10);
      expect(evaluate('parseFloat("10.5")')).toBe(10.5);
      expect(evaluate('isNaN("hello")')).toBe(true);
      expect(evaluate('isFinite(100)')).toBe(true);
    });

    it('should have access to JSON', () => {
      expect(evaluate('JSON.stringify(user)')).toBe('{"id":1,"name":"John"}');
      expect(evaluate('JSON.parse("{\\"a\\":1}")')).toEqual({ a: 1 });
    });

    it('should have access to null and undefined', () => {
      expect(evaluate('null')).toBe(null);
      expect(evaluate('undefined')).toBe(undefined);
      expect(evaluate('nullValue === null')).toBe(true);
      expect(evaluate('undefinedValue === undefined')).toBe(true);
    });

    it('should have access to boolean values', () => {
      expect(evaluate('true')).toBe(true);
      expect(evaluate('false')).toBe(false);
    });
  });

  describe('Security', () => {
    it('should reject forbidden keywords', () => {
      const evaluateStrict = createSafeEvaluator(state, { throwOnError: true });
      expect(() => evaluateStrict('eval("alert(1)")')).toThrow(
        'Security violation: forbidden keyword "eval"'
      );
      expect(() => evaluateStrict('Function("alert(1)")')).toThrow(
        'Security violation: forbidden keyword "Function"'
      );
      expect(() => evaluateStrict('constructor')).toThrow(
        'Security violation: forbidden keyword "constructor"'
      );
      expect(() => evaluateStrict('__proto__')).toThrow(
        'Security violation: forbidden keyword "__proto__"'
      );
      expect(() => evaluateStrict('prototype')).toThrow(
        'Security violation: forbidden keyword "prototype"'
      );
    });

    it('should handle errors gracefully', () => {
      expect(evaluate('nonExistent.property')).toBe(undefined);
      expect(evaluate('items.nonExistentMethod()')).toBe(undefined);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in state keys', () => {
      const specialState = {
        'special-key': 'value',
        '123': 'numeric',
        $var: 'dollar',
        _private: 'underscore',
      };
      const specialEvaluate = createSafeEvaluator(specialState);

      // Valid JavaScript identifiers work
      expect(specialEvaluate('$var')).toBe('dollar');
      expect(specialEvaluate('_private')).toBe('underscore');
    });

    it('should clear cache when it grows too large', () => {
      // Create evaluator with small state
      const smallState = { x: 1 };
      const smallEvaluator = createSafeEvaluator(smallState);

      // Generate more than 1000 unique expressions
      for (let i = 0; i < 1005; i++) {
        smallEvaluator(`x + ${i}`);
      }

      // Cache should have been cleared and still work
      expect(smallEvaluator('x + 1')).toBe(2);
    });

    it('should handle complex nested expressions', () => {
      state.nested = {
        level1: {
          level2: {
            value: 42,
          },
        },
      };

      expect(evaluate('nested.level1.level2.value')).toBe(42);
    });

    it('should handle expressions with mixed operators', () => {
      expect(evaluate('count === 0 && price > 5 || isActive')).toBe(true);
      expect(evaluate('(count + 1) * (price - 0.5)')).toBe(10);
    });

    it('should handle expressions with function calls', () => {
      state.getValue = () => 100;
      expect(evaluate('getValue()')).toBe(100);

      state.add = (a: number, b: number) => a + b;
      expect(evaluate('add(5, 3)')).toBe(8);
    });

    it('should handle array methods', () => {
      expect(evaluate('items.map(x => x * 2)')).toEqual([2, 4, 6]);
      expect(evaluate('items.filter(x => x > 1)')).toEqual([2, 3]);
      expect(evaluate('items.reduce((a, b) => a + b, 0)')).toBe(6);
    });

    it('should handle assignments with special patterns', () => {
      // Assignment with spaces
      expect(evaluate('count   =   10')).toBe(10);
      expect(state.count).toBe(10);

      // Assignment in expression
      expect(evaluate('(count = 5) + 10')).toBe(15);
      expect(state.count).toBe(5);
    });

    it('should not mistake comparison operators for assignment', () => {
      // Reset count to initial value
      state.count = 0;
      expect(evaluate('count == 0')).toBe(true);
      expect(evaluate('count != 0')).toBe(false);
      expect(evaluate('price <= 20')).toBe(true);
      expect(evaluate('price >= 10')).toBe(true);
    });
  });
});

describe('parseEventExpression', () => {
  it('should parse function call with no arguments', () => {
    const result = parseEventExpression('handleClick()');
    expect(result).toEqual({
      handler: 'handleClick',
      args: [],
    });
  });

  it('should parse function call with single argument', () => {
    const result = parseEventExpression('handleClick(event)');
    expect(result).toEqual({
      handler: 'handleClick',
      args: ['event'],
    });
  });

  it('should parse function call with multiple arguments', () => {
    const result = parseEventExpression('handleClick(event, index, item)');
    expect(result).toEqual({
      handler: 'handleClick',
      args: ['event', 'index', 'item'],
    });
  });

  it('should parse function call with spaces', () => {
    const result = parseEventExpression('handleClick( event , index )');
    expect(result).toEqual({
      handler: 'handleClick',
      args: ['event', 'index'],
    });
  });

  it('should handle expressions without parentheses', () => {
    const result = parseEventExpression('handleClick');
    expect(result).toEqual({
      handler: 'handleClick',
      args: [],
    });
  });

  it('should handle empty arguments', () => {
    const result = parseEventExpression('handleClick(,)');
    expect(result).toEqual({
      handler: 'handleClick',
      args: [],
    });
  });

  it('should handle complex expressions as non-function calls', () => {
    const result = parseEventExpression('count++');
    expect(result).toEqual({
      handler: 'count++',
      args: [],
    });
  });

  it('should handle expressions with dots as non-function calls', () => {
    const result = parseEventExpression('user.save()');
    expect(result).toEqual({
      handler: 'user.save()',
      args: [],
    });
  });
});
