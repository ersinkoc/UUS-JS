import type { ReactiveState, ExpressionString } from './types';
import { EvaluationError } from './errors';

// AST Node types for safe expression evaluation
type ASTNode =
  | { type: 'Literal'; value: any }
  | { type: 'Identifier'; name: string }
  | {
      type: 'MemberExpression';
      object: ASTNode;
      property: ASTNode;
      computed: boolean;
    }
  | { type: 'CallExpression'; callee: ASTNode; arguments: ASTNode[] }
  | { type: 'UnaryExpression'; operator: string; argument: ASTNode }
  | {
      type: 'BinaryExpression';
      operator: string;
      left: ASTNode;
      right: ASTNode;
    }
  | {
      type: 'LogicalExpression';
      operator: string;
      left: ASTNode;
      right: ASTNode;
    }
  | {
      type: 'ConditionalExpression';
      test: ASTNode;
      consequent: ASTNode;
      alternate: ASTNode;
    }
  | { type: 'ArrayExpression'; elements: ASTNode[] }
  | {
      type: 'ObjectExpression';
      properties: { key: ASTNode; value: ASTNode; kind?: string }[];
    }
  | {
      type: 'AssignmentExpression';
      operator: string;
      left: ASTNode;
      right: ASTNode;
    }
  | {
      type: 'UpdateExpression';
      operator: string;
      argument: ASTNode;
      prefix: boolean;
    }
  | { type: 'FunctionExpression'; params: string[]; body: ASTNode };

// Token types for lexical analysis
type Token =
  | { type: 'Number'; value: number }
  | { type: 'String'; value: string }
  | {
      type: 'TemplateLiteral';
      value: string;
      parts: Array<{ type: 'string' | 'expression'; value: string }>;
    }
  | { type: 'Boolean'; value: boolean }
  | { type: 'Null'; value: null }
  | { type: 'Undefined'; value: undefined }
  | { type: 'Identifier'; value: string }
  | { type: 'Operator'; value: string }
  | { type: 'Punctuation'; value: string }
  | { type: 'Keyword'; value: string };

// Safe tokenizer for expression parsing
export class SafeTokenizer {
  private expression: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(expression: string) {
    this.expression = expression;
  }

  tokenize(): Token[] {
    while (this.position < this.expression.length) {
      this.skipWhitespace();
      if (this.position >= this.expression.length) break;

      const char = this.expression[this.position];

      // Numbers
      const nextChar = this.expression[this.position + 1];
      if (
        char &&
        (/\d/.test(char) || (char === '.' && nextChar && /\d/.test(nextChar)))
      ) {
        this.tokens.push(this.readNumber());
      }
      // Strings
      else if (char === '"' || char === "'") {
        this.tokens.push(this.readString());
      }
      // Template literals
      else if (char === '`') {
        this.tokens.push(this.readTemplateLiteral());
      }
      // Identifiers and keywords
      else if (char && /[a-zA-Z_$]/.test(char)) {
        this.tokens.push(this.readIdentifier());
      }
      // Operators
      else if (char && '+-*/%<>=!&|'.includes(char)) {
        this.tokens.push(this.readOperator());
      }
      // Punctuation
      else if (char && '()[]{},.?:;'.includes(char)) {
        this.tokens.push({ type: 'Punctuation', value: char });
        this.position++;
      } else {
        throw new Error(`Unexpected character: ${char}`);
      }
    }

    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.expression.length) {
      const char = this.expression[this.position];
      if (char && /\s/.test(char)) {
        this.position++;
      } else {
        break;
      }
    }
  }

  private readNumber(): Token {
    let num = '';
    while (this.position < this.expression.length) {
      const char = this.expression[this.position];
      if (char && /[\d.]/.test(char)) {
        num += char;
        this.position++;
      } else {
        break;
      }
    }
    return { type: 'Number', value: parseFloat(num) };
  }

  private readString(): Token {
    const quote = this.expression[this.position++];
    let str = '';
    while (
      this.position < this.expression.length &&
      this.expression[this.position] !== quote
    ) {
      if (this.expression[this.position] === '\\') {
        this.position++;
        if (this.position < this.expression.length) {
          const escaped = this.expression[this.position++];
          switch (escaped) {
            case 'n':
              str += '\n';
              break;
            case 't':
              str += '\t';
              break;
            case 'r':
              str += '\r';
              break;
            case '\\':
              str += '\\';
              break;
            case '"':
              str += '"';
              break;
            case "'":
              str += "'";
              break;
            default:
              str += escaped;
          }
        }
      } else {
        str += this.expression[this.position++];
      }
    }
    this.position++; // Skip closing quote
    return { type: 'String', value: str };
  }

  private readTemplateLiteral(): Token {
    this.position++; // Skip opening backtick
    const parts: Array<{ type: 'string' | 'expression'; value: string }> = [];
    let currentString = '';

    while (
      this.position < this.expression.length &&
      this.expression[this.position] !== '`'
    ) {
      if (
        this.expression[this.position] === '$' &&
        this.expression[this.position + 1] === '{'
      ) {
        // Save current string part
        if (currentString) {
          parts.push({ type: 'string', value: currentString });
          currentString = '';
        }

        // Skip ${
        this.position += 2;

        // Read expression until }
        let braceCount = 1;
        let expr = '';
        while (this.position < this.expression.length && braceCount > 0) {
          const char = this.expression[this.position];
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;

          if (braceCount > 0) {
            expr += char;
          }
          this.position++;
        }

        parts.push({ type: 'expression', value: expr });
      } else if (this.expression[this.position] === '\\') {
        this.position++;
        if (this.position < this.expression.length) {
          const escaped = this.expression[this.position++];
          switch (escaped) {
            case 'n':
              currentString += '\n';
              break;
            case 't':
              currentString += '\t';
              break;
            case 'r':
              currentString += '\r';
              break;
            case '\\':
              currentString += '\\';
              break;
            case '`':
              currentString += '`';
              break;
            default:
              currentString += escaped;
          }
        }
      } else {
        currentString += this.expression[this.position++];
      }
    }

    // Add final string part
    if (currentString) {
      parts.push({ type: 'string', value: currentString });
    }

    if (this.position < this.expression.length) {
      this.position++; // Skip closing backtick
    }

    // If no interpolation, return simple string
    if (parts.length === 1 && parts[0]?.type === 'string') {
      return { type: 'String', value: parts[0].value };
    }

    return { type: 'TemplateLiteral', value: '', parts } as any;
  }

  private readIdentifier(): Token {
    let id = '';
    while (this.position < this.expression.length) {
      const char = this.expression[this.position];
      if (char && /[a-zA-Z0-9_$]/.test(char)) {
        id += char;
        this.position++;
      } else {
        break;
      }
    }

    // Check for keywords
    const keywords = ['true', 'false', 'null', 'undefined', 'typeof', 'new'];
    if (keywords.includes(id)) {
      if (id === 'true') return { type: 'Boolean', value: true };
      if (id === 'false') return { type: 'Boolean', value: false };
      if (id === 'null') return { type: 'Null', value: null };
      if (id === 'undefined') return { type: 'Undefined', value: undefined };
      return { type: 'Keyword', value: id };
    }

    return { type: 'Identifier', value: id };
  }

  private readOperator(): Token {
    const operators = [
      '===',
      '!==',
      '==',
      '!=',
      '<=',
      '>=',
      '=>',
      '&&',
      '||',
      '++',
      '--',
      '+=',
      '-=',
      '*=',
      '/=',
    ];

    for (const op of operators) {
      if (this.expression.substr(this.position, op.length) === op) {
        this.position += op.length;
        return { type: 'Operator', value: op };
      }
    }

    const char = this.expression[this.position++];
    return { type: 'Operator', value: char || '' };
  }
}

// Safe parser for building AST
export class SafeParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    return this.parseExpression();
  }

  private current(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(type?: string, value?: string): Token {
    const token = this.current();
    if (!token) throw new Error('Unexpected end of expression');
    if (type && token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    if (value && token.value !== value) {
      throw new Error(`Expected ${value}, got ${token.value}`);
    }
    this.position++;
    return token;
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const left = this.parseConditional();

    const current = this.current();
    if (
      current?.type === 'Operator' &&
      typeof current.value === 'string' &&
      ['=', '+=', '-=', '*=', '/='].includes(current.value)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseAssignment();
      return { type: 'AssignmentExpression', operator, left, right };
    }

    return left;
  }

  private parseConditional(): ASTNode {
    const test = this.parseLogical();

    if (this.current()?.value === '?') {
      this.consume('Punctuation', '?');
      const consequent = this.parseExpression();
      this.consume('Punctuation', ':');
      const alternate = this.parseExpression();
      return { type: 'ConditionalExpression', test, consequent, alternate };
    }

    return test;
  }

  private parseLogical(): ASTNode {
    let left = this.parseEquality();

    while (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['&&', '||'].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseEquality();
      left = { type: 'LogicalExpression', operator, left, right };
    }

    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();

    while (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['==', '!=', '===', '!=='].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseRelational();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parseAdditive();

    while (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['<', '>', '<=', '>='].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseAdditive();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['+', '-'].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();

    while (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['*', '/', '%'].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    const current = this.current();

    if (
      current?.type === 'Operator' &&
      typeof current.value === 'string' &&
      ['!', '-', '+', 'typeof'].includes(current.value)
    ) {
      const operator = this.consume()!.value as string;
      const argument = this.parseUnary();
      return { type: 'UnaryExpression', operator, argument };
    }

    // Prefix increment/decrement
    if (
      current?.type === 'Operator' &&
      typeof current.value === 'string' &&
      ['++', '--'].includes(current.value)
    ) {
      const operator = this.consume()!.value as string;
      const argument = this.parsePostfix();
      return { type: 'UpdateExpression', operator, argument, prefix: true };
    }

    return this.parseUpdate();
  }

  private parseUpdate(): ASTNode {
    const expr = this.parsePostfix();

    // Handle postfix ++ and --
    if (
      this.current()?.type === 'Operator' &&
      typeof this.current()!.value === 'string' &&
      ['++', '--'].includes(this.current()!.value as string)
    ) {
      const operator = this.consume('Operator')!.value as string;
      return {
        type: 'UpdateExpression',
        operator,
        argument: expr,
        prefix: false,
      };
    }

    return expr;
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    // Check for single-param arrow function (e.g., t => t.completed)
    if (expr.type === 'Identifier' && this.current()?.value === '=>') {
      this.consume('Operator', '=>');
      const body = this.parseExpression();
      return {
        type: 'FunctionExpression',
        params: [(expr as any).name],
        body,
      };
    }

    while (true) {
      const current = this.current();

      if (current?.value === '.') {
        this.consume('Punctuation', '.');
        const property = this.parsePrimary();
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: false,
        };
      } else if (current?.value === '[') {
        this.consume('Punctuation', '[');
        const property = this.parseExpression();
        this.consume('Punctuation', ']');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
        };
      } else if (current?.value === '(') {
        this.consume('Punctuation', '(');
        const args: ASTNode[] = [];

        while (this.current()?.value !== ')') {
          args.push(this.parseExpression());
          if (this.current()?.value === ',') {
            this.consume('Punctuation', ',');
          }
        }

        this.consume('Punctuation', ')');
        expr = { type: 'CallExpression', callee: expr, arguments: args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ASTNode {
    const current = this.current();
    if (!current) throw new Error('Unexpected end of expression');

    // Literals
    if (
      current.type === 'Number' ||
      current.type === 'String' ||
      current.type === 'Boolean' ||
      current.type === 'Null' ||
      current.type === 'Undefined'
    ) {
      this.consume();
      return { type: 'Literal', value: current.value };
    }

    // Template literals
    if (current.type === 'TemplateLiteral') {
      this.consume();
      return { type: 'Literal', value: current, isTemplate: true } as any;
    }

    // Identifiers
    if (current.type === 'Identifier') {
      this.consume();
      return { type: 'Identifier', name: current.value };
    }

    // Arrays
    if (current.value === '[') {
      this.consume('Punctuation', '[');
      const elements: ASTNode[] = [];

      while (this.current()?.value !== ']') {
        elements.push(this.parseExpression());
        if (this.current()?.value === ',') {
          this.consume('Punctuation', ',');
        }
      }

      this.consume('Punctuation', ']');
      return { type: 'ArrayExpression', elements };
    }

    // Objects
    if (current.value === '{') {
      this.consume('Punctuation', '{');
      const properties: { key: ASTNode; value: ASTNode; kind?: string }[] = [];

      while (this.current()?.value !== '}') {
        let kind = 'init';

        // Check for getter/setter
        if (
          this.current()?.type === 'Identifier' &&
          typeof this.current()?.value === 'string' &&
          (this.current()?.value === 'get' || this.current()?.value === 'set')
        ) {
          kind = this.current()!.value as string;
          this.consume();
        }

        // Parse key - can be identifier, string, or computed
        let key: ASTNode;
        if (this.current()?.type === 'Identifier') {
          key = { type: 'Identifier', name: this.current()!.value as string };
          this.consume();
        } else if (this.current()?.type === 'String') {
          key = { type: 'Literal', value: this.current()!.value };
          this.consume();
        } else if (this.current()?.value === '[') {
          this.consume('Punctuation', '[');
          key = this.parseExpression();
          this.consume('Punctuation', ']');
        } else {
          throw new Error(`Expected property key, got ${this.current()?.type}`);
        }

        // Check for method shorthand or getter/setter
        if (this.current()?.value === '(') {
          // Method or getter/setter
          const params: string[] = [];
          this.consume('Punctuation', '(');

          while (this.current()?.value !== ')') {
            if (this.current()?.type === 'Identifier') {
              params.push(this.current()!.value as string);
              this.consume();
            }
            if (this.current()?.value === ',') {
              this.consume('Punctuation', ',');
            }
          }

          this.consume('Punctuation', ')');
          this.consume('Punctuation', '{');

          // Skip function body for now - just create a placeholder
          let braceCount = 1;
          const bodyTokens: Token[] = [];

          while (braceCount > 0 && this.position < this.tokens.length) {
            const token = this.current();
            if (token?.value === '{') braceCount++;
            if (token?.value === '}') braceCount--;
            if (braceCount > 0) {
              bodyTokens.push(token!);
            }
            this.consume();
          }

          // Create function node
          const value: ASTNode = {
            type: 'FunctionExpression',
            params,
            body: { type: 'Literal', value: 'function' }, // Placeholder
          };

          properties.push({ key, value, kind });
        } else {
          // Regular property or shorthand
          if (this.current()?.value === ':') {
            this.consume('Punctuation', ':');
            const value = this.parseExpression();
            properties.push({ key, value, kind });
          } else {
            // Shorthand property (e.g., { count } -> { count: count })
            if (key.type === 'Identifier') {
              const value: ASTNode = {
                type: 'Identifier',
                name: (key as any).name,
              };
              properties.push({ key, value, kind });
            } else {
              throw new Error('Invalid shorthand property');
            }
          }
        }

        if (this.current()?.value === ',') {
          this.consume('Punctuation', ',');
        }
      }

      this.consume('Punctuation', '}');
      return { type: 'ObjectExpression', properties };
    }

    // Parenthesized expressions or arrow function parameters
    if (current.value === '(') {
      this.consume('Punctuation', '(');

      // Check if this could be arrow function parameters
      const savedPosition = this.position;
      const params: string[] = [];
      let isArrowFunction = false;

      // Try to parse as parameter list
      while (this.current()?.value !== ')') {
        if (this.current()?.type === 'Identifier') {
          params.push(this.current()!.value as string);
          this.consume();
          if (this.current()?.value === ',') {
            this.consume('Punctuation', ',');
          }
        } else {
          // Not a parameter list, reset and parse as expression
          this.position = savedPosition;
          break;
        }
      }

      if (params.length > 0 && this.current()?.value === ')') {
        this.consume('Punctuation', ')');
        // Check for arrow
        if (this.current()?.value === '=>') {
          this.consume('Operator', '=>');
          isArrowFunction = true;
          // For now, just return a placeholder function
          return {
            type: 'FunctionExpression',
            params,
            body: this.parseExpression(),
          };
        }
      }

      // Not an arrow function, parse as regular parenthesized expression
      if (!isArrowFunction) {
        this.position = savedPosition;
        const expr = this.parseExpression();
        this.consume('Punctuation', ')');
        return expr;
      }
    }

    throw new Error(`Unexpected token: ${current.type} (${current.value})`);
  }
}

// Safe evaluator for AST
export class SafeEvaluatorEngine {
  private state: ReactiveState;
  private allowedGlobals: Record<string, any>;

  constructor(state: ReactiveState) {
    this.state = state;
    this.allowedGlobals = {
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      JSON,
    };
  }

  evaluate(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        // Handle template literals
        if (
          (node as any).isTemplate &&
          typeof (node as any).value === 'object' &&
          (node as any).value.parts
        ) {
          const templateToken = (node as any).value;
          let result = '';
          for (const part of templateToken.parts) {
            if (part.type === 'string') {
              result += part.value;
            } else if (part.type === 'expression') {
              try {
                const ast = parseExpression(part.value);
                const value = this.evaluate(ast);
                result += String(value);
              } catch (error) {
                result += '${' + part.value + '}'; // Fallback to literal
              }
            }
          }
          return result;
        }
        return node.value;

      case 'Identifier':
        if (node.name in this.state) {
          return this.state[node.name];
        }
        if (node.name in this.allowedGlobals) {
          return this.allowedGlobals[node.name];
        }
        throw new Error(`Undefined variable: ${node.name}`);

      case 'MemberExpression': {
        const object = this.evaluate(node.object);
        const property = node.computed
          ? this.evaluate(node.property)
          : (node.property as any).name || (node.property as any).value;

        if (object == null) {
          throw new Error('Cannot read property of null or undefined');
        }

        return object[property];
      }

      case 'CallExpression': {
        const callee = this.evaluate(node.callee);
        if (typeof callee !== 'function') {
          throw new Error('Value is not a function');
        }

        const args = node.arguments.map((arg) => this.evaluate(arg));

        // Determine context for the function call
        if (node.callee.type === 'MemberExpression') {
          const context = this.evaluate(node.callee.object);
          return callee.apply(context, args);
        }

        return callee(...args);
      }

      case 'UnaryExpression': {
        const argument = this.evaluate(node.argument);
        switch (node.operator) {
          case '!':
            return !argument;
          case '-':
            return -argument;
          case '+':
            return +argument;
          case 'typeof':
            return typeof argument;
          default:
            throw new Error(`Unknown unary operator: ${node.operator}`);
        }
      }

      case 'BinaryExpression': {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);

        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '%':
            return left % right;
          case '<':
            return left < right;
          case '>':
            return left > right;
          case '<=':
            return left <= right;
          case '>=':
            return left >= right;
          case '==':
            return left == right;
          case '!=':
            return left != right;
          case '===':
            return left === right;
          case '!==':
            return left !== right;
          default:
            throw new Error(`Unknown binary operator: ${node.operator}`);
        }
      }

      case 'LogicalExpression': {
        const left = this.evaluate(node.left);

        switch (node.operator) {
          case '&&':
            return left && this.evaluate(node.right);
          case '||':
            return left || this.evaluate(node.right);
          default:
            throw new Error(`Unknown logical operator: ${node.operator}`);
        }
      }

      case 'ConditionalExpression': {
        const test = this.evaluate(node.test);
        return test
          ? this.evaluate(node.consequent)
          : this.evaluate(node.alternate);
      }

      case 'ArrayExpression': {
        return node.elements.map((el) => this.evaluate(el));
      }

      case 'ObjectExpression': {
        const obj: Record<string, any> = {};
        for (const prop of node.properties) {
          const key =
            prop.key.type === 'Identifier'
              ? (prop.key as any).name
              : this.evaluate(prop.key);

          if (prop.kind === 'get') {
            // Define getter
            Object.defineProperty(obj, key, {
              get: () => this.evaluate(prop.value),
              enumerable: true,
              configurable: true,
            });
          } else if (prop.value.type === 'FunctionExpression') {
            // Method - bind to the object context
            obj[key] = (...args: any[]) => {
              // For now, return a placeholder function
              // In a real implementation, we'd parse and execute the function body
              return obj;
            };
          } else {
            obj[key] = this.evaluate(prop.value);
          }
        }
        return obj;
      }

      case 'FunctionExpression': {
        // Handle arrow functions and regular functions
        const params = (node as any).params || [];
        const body = (node as any).body;

        return (...args: any[]) => {
          // Create a new scope with parameters
          const originalState = { ...this.state };

          // Bind parameters to arguments
          params.forEach((param: string, index: number) => {
            this.state[param] = args[index];
          });

          try {
            // Evaluate function body
            const result = this.evaluate(body);
            return result;
          } finally {
            // Restore original state
            this.state = originalState;
          }
        };
      }

      case 'UpdateExpression': {
        if (
          node.argument.type !== 'Identifier' &&
          node.argument.type !== 'MemberExpression'
        ) {
          throw new Error('Invalid update target');
        }

        if (node.argument.type === 'Identifier') {
          const name = node.argument.name;
          if (!(name in this.state)) {
            throw new Error(`Undefined variable: ${name}`);
          }

          const currentValue = this.state[name] as number;

          if (node.prefix) {
            // Prefix increment/decrement
            if (node.operator === '++') {
              this.state[name] = currentValue + 1;
              return this.state[name];
            } else if (node.operator === '--') {
              this.state[name] = currentValue - 1;
              return this.state[name];
            }
          } else {
            // Postfix increment/decrement
            if (node.operator === '++') {
              this.state[name] = currentValue + 1;
              return currentValue; // Return original value
            } else if (node.operator === '--') {
              this.state[name] = currentValue - 1;
              return currentValue; // Return original value
            }
          }
        } else {
          // MemberExpression update
          const object = this.evaluate(node.argument.object);
          const property = node.argument.computed
            ? this.evaluate(node.argument.property)
            : (node.argument.property as any).name ||
              (node.argument.property as any).value;

          const currentValue = object[property];

          if (node.prefix) {
            if (node.operator === '++') {
              object[property] = currentValue + 1;
              return object[property];
            } else if (node.operator === '--') {
              object[property] = currentValue - 1;
              return object[property];
            }
          } else {
            if (node.operator === '++') {
              object[property] = currentValue + 1;
              return currentValue;
            } else if (node.operator === '--') {
              object[property] = currentValue - 1;
              return currentValue;
            }
          }
        }

        throw new Error(`Unknown update operator: ${node.operator}`);
      }

      case 'AssignmentExpression': {
        if (
          node.left.type !== 'Identifier' &&
          node.left.type !== 'MemberExpression'
        ) {
          throw new Error('Invalid assignment target');
        }

        const value = this.evaluate(node.right);

        if (node.left.type === 'Identifier') {
          const name = node.left.name;
          if (!(name in this.state)) {
            throw new Error(`Cannot assign to undefined variable: ${name}`);
          }

          switch (node.operator) {
            case '=':
              this.state[name] = value;
              break;
            case '+=':
              this.state[name] = (this.state[name] as any) + value;
              break;
            case '-=':
              this.state[name] = (this.state[name] as any) - value;
              break;
            case '*=':
              this.state[name] = (this.state[name] as any) * value;
              break;
            case '/=':
              this.state[name] = (this.state[name] as any) / value;
              break;
            default:
              throw new Error(`Unknown assignment operator: ${node.operator}`);
          }

          return this.state[name];
        } else {
          // MemberExpression assignment
          const object = this.evaluate(node.left.object);
          const property = node.left.computed
            ? this.evaluate(node.left.property)
            : (node.left.property as any).name ||
              (node.left.property as any).value;

          switch (node.operator) {
            case '=':
              object[property] = value;
              break;
            case '+=':
              object[property] += value;
              break;
            case '-=':
              object[property] -= value;
              break;
            case '*=':
              object[property] *= value;
              break;
            case '/=':
              object[property] /= value;
              break;
            default:
              throw new Error(`Unknown assignment operator: ${node.operator}`);
          }

          return object[property];
        }
      }

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }
}

// Main API functions
export function parseExpression(expression: string): ASTNode {
  const tokenizer = new SafeTokenizer(expression);
  const tokens = tokenizer.tokenize();
  const parser = new SafeParser(tokens);
  return parser.parse();
}

export function evaluateAST(ast: ASTNode, state: ReactiveState): any {
  const evaluator = new SafeEvaluatorEngine(state);
  return evaluator.evaluate(ast);
}

export function safeEvaluateExpression(
  expression: ExpressionString,
  state: ReactiveState
): any {
  try {
    const ast = parseExpression(expression);
    return evaluateAST(ast, state);
  } catch (error) {
    throw new EvaluationError(
      expression,
      error instanceof Error ? error : new Error(String(error)),
      { phase: 'safe-evaluation' }
    );
  }
}
