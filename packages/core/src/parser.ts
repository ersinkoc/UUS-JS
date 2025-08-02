import type { DirectiveBinding } from './types';

const DIRECTIVE_PREFIX = 'uus-';
const EVENT_PREFIX = 'on:';
const BIND_PREFIX = 'bind:';

export interface ParsedDirective {
  name: string;
  value: string;
  arg?: string;
  modifiers: Record<string, boolean>;
}

export function parseDirective(attr: Attr): ParsedDirective | null {
  const name = attr.name;
  
  if (!name.startsWith(DIRECTIVE_PREFIX)) {
    return null;
  }

  const directivePart = name.slice(DIRECTIVE_PREFIX.length);
  let directiveName: string;
  let arg: string | undefined;
  let modifiers: Record<string, boolean> = {};

  // Handle special directives with arguments
  if (directivePart.startsWith(EVENT_PREFIX)) {
    directiveName = 'on';
    const eventPart = directivePart.slice(EVENT_PREFIX.length);
    const [eventName, ...modifierParts] = eventPart.split('.');
    arg = eventName;
    modifiers = modifierParts.reduce((acc, mod) => {
      acc[mod] = true;
      return acc;
    }, {} as Record<string, boolean>);
  } else if (directivePart.startsWith(BIND_PREFIX)) {
    directiveName = 'bind';
    arg = directivePart.slice(BIND_PREFIX.length);
  } else {
    // Regular directive, might have modifiers
    const [name, ...modifierParts] = directivePart.split('.');
    directiveName = name || directivePart;
    modifiers = modifierParts.reduce((acc, mod) => {
      acc[mod] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  return {
    name: directiveName,
    value: attr.value,
    arg,
    modifiers,
  };
}

export function createBinding(parsed: ParsedDirective): DirectiveBinding {
  return {
    value: parsed.value,
    arg: parsed.arg,
    modifiers: parsed.modifiers,
    expression: parsed.value,
  };
}

export function walkElement(
  el: HTMLElement,
  callback: (el: HTMLElement, directive: ParsedDirective) => void,
  options?: { skipChildren?: boolean }
): void {
  // Process attributes
  const attributes = Array.from(el.attributes);
  let skipChildren = options?.skipChildren || false;
  
  for (const attr of attributes) {
    const parsed = parseDirective(attr);
    if (parsed) {
      callback(el, parsed);
      
      // Don't walk children of elements with structural directives
      if (parsed.name === 'for' || parsed.name === 'if') {
        skipChildren = true;
      }
    }
  }

  // Process children unless skipped
  if (!skipChildren) {
    const children = Array.from(el.children);
    for (const child of children) {
      if (child instanceof HTMLElement) {
        walkElement(child, callback);
      }
    }
  }
}

export function removeDirectiveAttribute(el: HTMLElement, directiveName: string): void {
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const parsed = parseDirective(attr);
    if (parsed && parsed.name === directiveName) {
      el.removeAttribute(attr.name);
      break;
    }
  }
}

export function getElementState(el: HTMLElement): any {
  let current = el;
  while (current) {
    if ((current as any).__uusState) {
      return (current as any).__uusState;
    }
    current = current.parentElement as HTMLElement;
  }
  return null;
}