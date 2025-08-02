/**
 * Complex Directives Chunk
 * Contains the largest directives that can be optionally loaded
 */

export { forDirective } from '../for';
export { ifDirective } from '../if';
export { componentDirective } from '../component';

// Lazy loader for complex directives
export function loadComplexDirectives() {
  return Promise.resolve({
    forDirective: () => import('../for').then(m => m.forDirective),
    ifDirective: () => import('../if').then(m => m.ifDirective),
    componentDirective: () => import('../component').then(m => m.componentDirective),
  });
}