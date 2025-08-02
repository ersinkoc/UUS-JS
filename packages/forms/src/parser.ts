import type { Validator } from './types';
import * as validators from './validators';

export function parseValidators(validatorString: string): Validator[] {
  const parts = validatorString.split('|').map(s => s.trim());
  const result: Validator[] = [];

  for (const part of parts) {
    const [name, ...args] = part.split(':');
    const validatorName = name.trim();
    
    // Get validator function
    const validatorFn = (validators as any)[validatorName];
    if (!validatorFn) {
      console.warn(`Unknown validator: ${validatorName}`);
      continue;
    }

    // Handle validators with arguments
    if (args.length > 0) {
      const arg = args.join(':').trim();
      if (typeof validatorFn === 'function' && validatorFn.length > 0) {
        // Validator factory (like minLength, max, etc.)
        result.push(validatorFn(parseArg(arg)));
      } else {
        result.push(validatorFn);
      }
    } else {
      result.push(validatorFn);
    }
  }

  return result;
}

function parseArg(arg: string): any {
  // Try to parse as number
  const num = Number(arg);
  if (!isNaN(num)) return num;
  
  // Try to parse as boolean
  if (arg === 'true') return true;
  if (arg === 'false') return false;
  
  // Try to parse as regex
  if (arg.startsWith('/') && arg.endsWith('/')) {
    try {
      return new RegExp(arg.slice(1, -1));
    } catch {
      // Invalid regex, return as string
    }
  }
  
  // Return as string
  return arg;
}