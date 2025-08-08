import { describe, it, expect } from 'vitest';
import {
  SafeTokenizer,
  SafeEvaluatorEngine,
  parseExpression,
  safeEvaluateExpression,
} from '../safe-evaluator';

describe('Safe Evaluator', () => {
  describe('SafeTokenizer', () => {
    it('should tokenize numbers', () => {
      const tokenizer = new SafeTokenizer('42 3.14 .5');
      const tokens = tokenizer.tokenize();

      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ type: 'Number', value: 42 });
      expect(tokens[1]).toEqual({ type: 'Number', value: 3.14 });
      expect(tokens[2]).toEqual({ type: 'Number', value: 0.5 });
    });

    it('should tokenize strings', () => {
      const tokenizer = new SafeTokenizer('"hello" \'world\'');
      const tokens = tokenizer.tokenize();

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ type: 'String', value: 'hello' });
      expect(tokens[1]).toEqual({ type: 'String', value: 'world' });
    });

    it('should handle escape sequences in strings', () => {
      const tokenizer = new SafeTokenizer('"hello\\nworld\\t!"');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toEqual({ type: 'String', value: 'hello\nworld\t!' });
    });

    it('should tokenize identifiers and keywords', () => {
      const tokenizer = new SafeTokenizer('myVar true false null undefined');
      const tokens = tokenizer.tokenize();

      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toEqual({ type: 'Identifier', value: 'myVar' });
      expect(tokens[1]).toEqual({ type: 'Boolean', value: true });
      expect(tokens[2]).toEqual({ type: 'Boolean', value: false });
      expect(tokens[3]).toEqual({ type: 'Null', value: null });
      expect(tokens[4]).toEqual({ type: 'Undefined', value: undefined });
    });

    it('should tokenize operators', () => {
      const tokenizer = new SafeTokenizer('+ - * / === !== && ||');
      const tokens = tokenizer.tokenize();

      expect(tokens.every((t) => t.type === 'Operator')).toBe(true);
      expect(tokens[4].value).toBe('===');
      expect(tokens[5].value).toBe('!==');
      expect(tokens[6].value).toBe('&&');
      expect(tokens[7].value).toBe('||');
    });

    it('should tokenize punctuation', () => {
      const tokenizer = new SafeTokenizer('()[]{},.?:;');
      const tokens = tokenizer.tokenize();

      expect(tokens).toHaveLength(11);
      expect(tokens.every((t) => t.type === 'Punctuation')).toBe(true);
    });

    it('should handle complex expressions', () => {
      const tokenizer = new SafeTokenizer('count > 0 ? "positive" : "zero"');
      const tokens = tokenizer.tokenize();

      expect(tokens).toContainEqual({ type: 'Identifier', value: 'count' });
      expect(tokens).toContainEqual({ type: 'Operator', value: '>' });
      expect(tokens).toContainEqual({ type: 'Number', value: 0 });
      expect(tokens).toContainEqual({ type: 'Punctuation', value: '?' });
      expect(tokens).toContainEqual({ type: 'String', value: 'positive' });
      expect(tokens).toContainEqual({ type: 'Punctuation', value: ':' });
      expect(tokens).toContainEqual({ type: 'String', value: 'zero' });
    });
  });

  describe('SafeParser', () => {
    it('should parse literals', () => {
      expect(parseExpression('42')).toEqual({ type: 'Literal', value: 42 });
      expect(parseExpression('"hello"')).toEqual({
        type: 'Literal',
        value: 'hello',
      });
      expect(parseExpression('true')).toEqual({ type: 'Literal', value: true });
      expect(parseExpression('null')).toEqual({ type: 'Literal', value: null });
    });

    it('should parse identifiers', () => {
      expect(parseExpression('myVar')).toEqual({
        type: 'Identifier',
        name: 'myVar',
      });
    });

    it('should parse binary expressions', () => {
      const ast = parseExpression('1 + 2');
      expect(ast).toEqual({
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Literal', value: 1 },
        right: { type: 'Literal', value: 2 },
      });
    });

    it('should parse comparison expressions', () => {
      const ast = parseExpression('x > 5');
      expect(ast).toEqual({
        type: 'BinaryExpression',
        operator: '>',
        left: { type: 'Identifier', name: 'x' },
        right: { type: 'Literal', value: 5 },
      });
    });

    it('should parse logical expressions', () => {
      const ast = parseExpression('a && b');
      expect(ast).toEqual({
        type: 'LogicalExpression',
        operator: '&&',
        left: { type: 'Identifier', name: 'a' },
        right: { type: 'Identifier', name: 'b' },
      });
    });

    it('should parse conditional expressions', () => {
      const ast = parseExpression('x ? y : z');
      expect(ast).toEqual({
        type: 'ConditionalExpression',
        test: { type: 'Identifier', name: 'x' },
        consequent: { type: 'Identifier', name: 'y' },
        alternate: { type: 'Identifier', name: 'z' },
      });
    });

    it('should parse member expressions', () => {
      const ast = parseExpression('obj.prop');
      expect(ast).toEqual({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'obj' },
        property: { type: 'Identifier', name: 'prop' },
        computed: false,
      });
    });

    it('should parse computed member expressions', () => {
      const ast = parseExpression('arr[0]');
      expect(ast).toEqual({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'arr' },
        property: { type: 'Literal', value: 0 },
        computed: true,
      });
    });

    it('should parse call expressions', () => {
      const ast = parseExpression('func(1, 2)');
      expect(ast).toEqual({
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'func' },
        arguments: [
          { type: 'Literal', value: 1 },
          { type: 'Literal', value: 2 },
        ],
      });
    });

    it('should parse array expressions', () => {
      const ast = parseExpression('[1, 2, 3]');
      expect(ast).toEqual({
        type: 'ArrayExpression',
        elements: [
          { type: 'Literal', value: 1 },
          { type: 'Literal', value: 2 },
          { type: 'Literal', value: 3 },
        ],
      });
    });

    it('should parse object expressions', () => {
      const ast = parseExpression('{ x: 1, y: 2 }');
      expect(ast.type).toBe('ObjectExpression');
      expect(ast.properties).toHaveLength(2);
    });

    it('should parse assignment expressions', () => {
      const ast = parseExpression('x = 5');
      expect(ast).toEqual({
        type: 'AssignmentExpression',
        operator: '=',
        left: { type: 'Identifier', name: 'x' },
        right: { type: 'Literal', value: 5 },
      });
    });

    it('should parse update expressions', () => {
      const ast = parseExpression('x++');
      expect(ast).toEqual({
        type: 'UpdateExpression',
        operator: '++',
        argument: { type: 'Identifier', name: 'x' },
        prefix: false,
      });
    });

    it('should parse unary expressions', () => {
      const ast = parseExpression('!x');
      expect(ast).toEqual({
        type: 'UnaryExpression',
        operator: '!',
        argument: { type: 'Identifier', name: 'x' },
      });
    });

    it('should handle operator precedence', () => {
      const ast = parseExpression('1 + 2 * 3');
      expect(ast).toEqual({
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Literal', value: 1 },
        right: {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'Literal', value: 2 },
          right: { type: 'Literal', value: 3 },
        },
      });
    });

    it('should handle parentheses', () => {
      const ast = parseExpression('(1 + 2) * 3');
      expect(ast).toEqual({
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Literal', value: 1 },
          right: { type: 'Literal', value: 2 },
        },
        right: { type: 'Literal', value: 3 },
      });
    });
  });

  describe('SafeEvaluatorEngine', () => {
    it('should evaluate literals', () => {
      const engine = new SafeEvaluatorEngine({});

      expect(engine.evaluate({ type: 'Literal', value: 42 })).toBe(42);
      expect(engine.evaluate({ type: 'Literal', value: 'hello' })).toBe(
        'hello'
      );
      expect(engine.evaluate({ type: 'Literal', value: true })).toBe(true);
      expect(engine.evaluate({ type: 'Literal', value: null })).toBe(null);
    });

    it('should evaluate identifiers from state', () => {
      const engine = new SafeEvaluatorEngine({ count: 10, name: 'test' });

      expect(engine.evaluate({ type: 'Identifier', name: 'count' })).toBe(10);
      expect(engine.evaluate({ type: 'Identifier', name: 'name' })).toBe(
        'test'
      );
    });

    it('should evaluate binary expressions', () => {
      const engine = new SafeEvaluatorEngine({});

      const add = {
        type: 'BinaryExpression' as const,
        operator: '+',
        left: { type: 'Literal' as const, value: 2 },
        right: { type: 'Literal' as const, value: 3 },
      };
      expect(engine.evaluate(add)).toBe(5);

      const multiply = {
        type: 'BinaryExpression' as const,
        operator: '*',
        left: { type: 'Literal' as const, value: 4 },
        right: { type: 'Literal' as const, value: 5 },
      };
      expect(engine.evaluate(multiply)).toBe(20);
    });

    it('should evaluate logical expressions', () => {
      const engine = new SafeEvaluatorEngine({ a: true, b: false });

      const and = {
        type: 'LogicalExpression' as const,
        operator: '&&',
        left: { type: 'Identifier' as const, name: 'a' },
        right: { type: 'Identifier' as const, name: 'b' },
      };
      expect(engine.evaluate(and)).toBe(false);

      const or = {
        type: 'LogicalExpression' as const,
        operator: '||',
        left: { type: 'Identifier' as const, name: 'a' },
        right: { type: 'Identifier' as const, name: 'b' },
      };
      expect(engine.evaluate(or)).toBe(true);
    });

    it('should evaluate conditional expressions', () => {
      const engine = new SafeEvaluatorEngine({ x: 5 });

      const conditional = {
        type: 'ConditionalExpression' as const,
        test: {
          type: 'BinaryExpression' as const,
          operator: '>',
          left: { type: 'Identifier' as const, name: 'x' },
          right: { type: 'Literal' as const, value: 3 },
        },
        consequent: { type: 'Literal' as const, value: 'greater' },
        alternate: { type: 'Literal' as const, value: 'less' },
      };
      expect(engine.evaluate(conditional)).toBe('greater');
    });

    it('should evaluate member expressions', () => {
      const engine = new SafeEvaluatorEngine({
        user: { name: 'John', age: 30 },
        arr: [1, 2, 3],
      });

      const memberAccess = {
        type: 'MemberExpression' as const,
        object: { type: 'Identifier' as const, name: 'user' },
        property: { type: 'Identifier' as const, name: 'name' },
        computed: false,
      };
      expect(engine.evaluate(memberAccess)).toBe('John');

      const arrayAccess = {
        type: 'MemberExpression' as const,
        object: { type: 'Identifier' as const, name: 'arr' },
        property: { type: 'Literal' as const, value: 1 },
        computed: true,
      };
      expect(engine.evaluate(arrayAccess)).toBe(2);
    });

    it('should evaluate call expressions', () => {
      const engine = new SafeEvaluatorEngine({
        add: (a: number, b: number) => a + b,
        greet: (name: string) => `Hello, ${name}!`,
      });

      const addCall = {
        type: 'CallExpression' as const,
        callee: { type: 'Identifier' as const, name: 'add' },
        arguments: [
          { type: 'Literal' as const, value: 2 },
          { type: 'Literal' as const, value: 3 },
        ],
      };
      expect(engine.evaluate(addCall)).toBe(5);

      const greetCall = {
        type: 'CallExpression' as const,
        callee: { type: 'Identifier' as const, name: 'greet' },
        arguments: [{ type: 'Literal' as const, value: 'World' }],
      };
      expect(engine.evaluate(greetCall)).toBe('Hello, World!');
    });

    it('should evaluate array expressions', () => {
      const engine = new SafeEvaluatorEngine({ x: 5 });

      const array = {
        type: 'ArrayExpression' as const,
        elements: [
          { type: 'Literal' as const, value: 1 },
          { type: 'Identifier' as const, name: 'x' },
          { type: 'Literal' as const, value: 10 },
        ],
      };
      expect(engine.evaluate(array)).toEqual([1, 5, 10]);
    });

    it('should evaluate object expressions', () => {
      const engine = new SafeEvaluatorEngine({ y: 20 });

      const object = {
        type: 'ObjectExpression' as const,
        properties: [
          {
            key: { type: 'Identifier' as const, name: 'x' },
            value: { type: 'Literal' as const, value: 10 },
          },
          {
            key: { type: 'Identifier' as const, name: 'y' },
            value: { type: 'Identifier' as const, name: 'y' },
          },
        ],
      };
      const result = engine.evaluate(object);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should evaluate assignment expressions', () => {
      const state = { x: 0 };
      const engine = new SafeEvaluatorEngine(state);

      const assignment = {
        type: 'AssignmentExpression' as const,
        operator: '=',
        left: { type: 'Identifier' as const, name: 'x' },
        right: { type: 'Literal' as const, value: 42 },
      };

      expect(engine.evaluate(assignment)).toBe(42);
      expect(state.x).toBe(42);
    });

    it('should evaluate update expressions', () => {
      const state = { count: 5 };
      const engine = new SafeEvaluatorEngine(state);

      const postIncrement = {
        type: 'UpdateExpression' as const,
        operator: '++',
        argument: { type: 'Identifier' as const, name: 'count' },
        prefix: false,
      };

      expect(engine.evaluate(postIncrement)).toBe(5); // Returns old value
      expect(state.count).toBe(6);

      const preDecrement = {
        type: 'UpdateExpression' as const,
        operator: '--',
        argument: { type: 'Identifier' as const, name: 'count' },
        prefix: true,
      };

      expect(engine.evaluate(preDecrement)).toBe(5); // Returns new value
      expect(state.count).toBe(5);
    });

    it('should evaluate unary expressions', () => {
      const engine = new SafeEvaluatorEngine({ x: true, y: 5 });

      const not = {
        type: 'UnaryExpression' as const,
        operator: '!',
        argument: { type: 'Identifier' as const, name: 'x' },
      };
      expect(engine.evaluate(not)).toBe(false);

      const negative = {
        type: 'UnaryExpression' as const,
        operator: '-',
        argument: { type: 'Identifier' as const, name: 'y' },
      };
      expect(engine.evaluate(negative)).toBe(-5);

      const typeofOp = {
        type: 'UnaryExpression' as const,
        operator: 'typeof',
        argument: { type: 'Identifier' as const, name: 'y' },
      };
      expect(engine.evaluate(typeofOp)).toBe('number');
    });

    it('should have access to allowed globals', () => {
      const engine = new SafeEvaluatorEngine({});

      const mathCall = {
        type: 'CallExpression' as const,
        callee: {
          type: 'MemberExpression' as const,
          object: { type: 'Identifier' as const, name: 'Math' },
          property: { type: 'Identifier' as const, name: 'max' },
          computed: false,
        },
        arguments: [
          { type: 'Literal' as const, value: 1 },
          { type: 'Literal' as const, value: 2 },
        ],
      };
      expect(engine.evaluate(mathCall)).toBe(2);
    });

    it('should throw for undefined variables', () => {
      const engine = new SafeEvaluatorEngine({});

      expect(() => {
        engine.evaluate({ type: 'Identifier', name: 'undefinedVar' });
      }).toThrow('Undefined variable: undefinedVar');
    });

    it('should throw for invalid operations', () => {
      const engine = new SafeEvaluatorEngine({});

      expect(() => {
        engine.evaluate({
          type: 'UnaryExpression',
          operator: 'invalid',
          argument: { type: 'Literal', value: 1 },
        });
      }).toThrow('Unknown unary operator: invalid');
    });
  });

  describe('Integration Tests', () => {
    it('should evaluate complex expressions', () => {
      const state = {
        count: 10,
        multiplier: 2,
        items: [1, 2, 3],
        user: { name: 'Alice', age: 25 },
      };

      expect(safeEvaluateExpression('count * multiplier', state)).toBe(20);
      expect(safeEvaluateExpression('count > 5 ? "high" : "low"', state)).toBe(
        'high'
      );
      expect(safeEvaluateExpression('items[1] + count', state)).toBe(12);
      expect(safeEvaluateExpression('user.age >= 18', state)).toBe(true);
    });

    it('should handle state mutations', () => {
      const state = { value: 0 };

      safeEvaluateExpression('value = 10', state);
      expect(state.value).toBe(10);

      safeEvaluateExpression('value += 5', state);
      expect(state.value).toBe(15);

      safeEvaluateExpression('value++', state);
      expect(state.value).toBe(16);
    });

    it('should handle errors gracefully', () => {
      const state = {};

      expect(() => {
        safeEvaluateExpression('unknownVar + 1', state);
      }).toThrow();

      expect(() => {
        safeEvaluateExpression('null.property', state);
      }).toThrow();
    });

    it('should work with method calls', () => {
      const state = {
        items: [1, 2, 3, 4, 5],
        getText: () => 'Hello',
        add: (a: number, b: number) => a + b,
      };

      expect(safeEvaluateExpression('items.length', state)).toBe(5);
      expect(safeEvaluateExpression('getText()', state)).toBe('Hello');
      expect(safeEvaluateExpression('add(3, 4)', state)).toBe(7);
    });

    it('should handle edge cases', () => {
      const state = { a: null, b: undefined, c: 0, d: '', e: false };

      expect(safeEvaluateExpression('a', state)).toBe(null);
      expect(safeEvaluateExpression('b', state)).toBe(undefined);
      expect(safeEvaluateExpression('c || 10', state)).toBe(10);
      expect(safeEvaluateExpression('d || "default"', state)).toBe('default');
      expect(safeEvaluateExpression('e || true', state)).toBe(true);
    });
  });
});
