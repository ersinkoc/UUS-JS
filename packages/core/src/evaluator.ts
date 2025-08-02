import type { ReactiveState } from './types';

const FORBIDDEN_GLOBALS = new Set([
  'eval',
  'Function',
  'constructor',
  '__proto__',
  'prototype',
]);

const expressionCache = new Map<string, Function>();

export function createSafeEvaluator(state: ReactiveState): (expression: string) => any {
  const allowedGlobals = {
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
    console,
    JSON,
    undefined: undefined,
    null: null,
    true: true,
    false: false,
  };

  return (expression: string): any => {
    // Check for forbidden keywords
    for (const forbidden of FORBIDDEN_GLOBALS) {
      if (expression.includes(forbidden)) {
        throw new Error(`Forbidden keyword: ${forbidden}`);
      }
    }

    if (!expression || expression.trim() === '') {
      return undefined;
    }

    try {
      // Check cache first
      const cacheKey = expression + Object.keys(state).join(',');
      let func = expressionCache.get(cacheKey);
      
      if (!func) {
        // Handle special cases
        let processedExpression = expression.trim();
        
        // Support template literals (convert to string concatenation)
        processedExpression = processedExpression.replace(
          /`([^`]*)`/g, 
          (match, content) => {
            return '"' + content.replace(/\${([^}]+)}/g, '" + ($1) + "') + '"';
          }
        );
        
        // Handle object literal expressions by wrapping in parentheses if needed
        if (processedExpression.startsWith('{') && processedExpression.endsWith('}')) {
          processedExpression = `(${processedExpression})`;
        }
        
        // Create a safer function using 'with' statement alternative
        // Build the context manually
        let contextBuilder = '';
        const allContext = { ...state, ...allowedGlobals };
        
        // Transform assignment and increment/decrement expressions to use state object
        const hasAssignment = processedExpression.includes('=') && !processedExpression.includes('==') && !processedExpression.includes('!=') && !processedExpression.includes('<=') && !processedExpression.includes('>=');
        const hasIncrement = processedExpression.includes('++') || processedExpression.includes('--');
        
        if (hasAssignment || hasIncrement) {
          // This is likely an assignment, transform it to use the state object
          const stateKeys = Object.keys(state);
          const originalExpression = processedExpression;
          
          for (const key of stateKeys) {
            if (key && typeof key === 'string' && key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
              // Transform assignments like "clicked = true" to "arguments[0]._state.clicked = true"
              const assignmentRegex = new RegExp(`\\b${key}\\s*([+\\-*\\/]?=)`, 'g');
              processedExpression = processedExpression.replace(assignmentRegex, `arguments[0]._state.${key} $1`);
              
              // Transform increment/decrement like "count++" to "(arguments[0]._state.count++)"
              const incrementRegex = new RegExp(`\\b${key}\\s*(\\+\\+|\\-\\-)`, 'g');
              processedExpression = processedExpression.replace(incrementRegex, `(arguments[0]._state.${key}$1)`);
              
              // Transform pre-increment/decrement like "++count"
              const preIncrementRegex = new RegExp(`(\\+\\+|\\-\\-)\\s*\\b${key}\\b`, 'g');
              processedExpression = processedExpression.replace(preIncrementRegex, `$1arguments[0]._state.${key}`);
            }
          }
          
        }
        
        // Build context with variable declarations
        for (const [key, value] of Object.entries(allContext)) {
          if (key && typeof key === 'string' && key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
            const reserved = ['null', 'undefined', 'true', 'false', 'this', 'arguments', 'eval', 'Function', '_state'];
            if (!reserved.includes(key)) {
              contextBuilder += `const ${key} = arguments[0]["${key}"];`;
            }
          }
        }
        
        const functionBody = `
          "use strict"; 
          ${contextBuilder}
          try { 
            return ${processedExpression}; 
          } catch(e) { 
            throw new Error('Expression evaluation failed: ' + e.message); 
          }
        `;
        
        func = new Function(functionBody);
        
        // Cache for performance
        if (expressionCache.size > 1000) {
          // Clear cache if it gets too large
          expressionCache.clear();
        }
        expressionCache.set(cacheKey, func);
      }

      const allContext = { ...state, ...allowedGlobals, _state: state };
      return func(allContext);
    } catch (error) {
      console.error(`Error evaluating expression: ${expression}`, error);
      return undefined;
    }
  };
}

export function parseEventExpression(expression: string): {
  handler: string;
  args: string[];
} {
  const match = expression.match(/^(\w+)\((.*)\)$/);
  if (match) {
    const [, handler, argsStr] = match;
    const args = argsStr
      ? argsStr
          .split(',')
          .map((arg) => arg.trim())
          .filter(Boolean)
      : [];
    return { handler: handler || '', args };
  }
  return { handler: expression, args: [] };
}