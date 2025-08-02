import { describe, it, expect } from 'vitest';
import { renderToString } from '../src/render';

describe('SSR Render', () => {
  it('should export renderToString function', () => {
    expect(renderToString).toBeDefined();
    expect(typeof renderToString).toBe('function');
  });
});
