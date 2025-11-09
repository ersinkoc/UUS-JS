import type { Route, RouteMatch } from './types';

interface PathPattern {
  pattern: RegExp;
  keys: string[];
}

export class RouteMatcher {
  private routes: Route[];
  private patterns: Map<Route, PathPattern>;

  constructor(routes: Route[]) {
    this.routes = routes;
    this.patterns = new Map();
    this.compileRoutes(routes);
  }

  private compileRoutes(routes: Route[], parentPath = ''): void {
    routes.forEach((route) => {
      const fullPath = parentPath + route.path;
      const pattern = this.pathToRegex(fullPath);
      this.patterns.set(route, pattern);

      if (route.children) {
        this.compileRoutes(route.children, fullPath);
      }
    });
  }

  private pathToRegex(path: string): PathPattern {
    const keys: string[] = [];

    // Validate pattern complexity to prevent ReDoS attacks
    if (path.length > 1000) {
      throw new Error('Path pattern too long (max 1000 characters)');
    }

    // Count dynamic segments and wildcards
    const dynamicSegments = (path.match(/:\w+/g) || []).length;
    const wildcards = (path.match(/\*/g) || []).length;

    if (dynamicSegments > 20) {
      throw new Error('Too many dynamic segments (max 20)');
    }

    if (wildcards > 5) {
      throw new Error('Too many wildcards (max 5)');
    }

    // Escape regex special characters except our own markers (: and *)
    let pattern = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Escape forward slashes
    pattern = pattern.replace(/\//g, '\\/');

    // Handle dynamic segments with non-greedy match
    pattern = pattern.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^\\/]+)'; // Non-greedy match that stops at forward slash
    });

    // Handle wildcards with non-greedy match to prevent catastrophic backtracking
    pattern = pattern.replace(/\*/g, '(.*?)'); // Non-greedy wildcard!

    return {
      pattern: new RegExp(`^${pattern}$`),
      keys,
    };
  }

  match(path: string): RouteMatch | null {
    // Parse the path
    const [pathname, search, hash] = this.parsePath(path);

    // Try to match each route
    for (const [route, pattern] of this.patterns) {
      const match = pathname.match(pattern.pattern);
      if (match) {
        const params: Record<string, string> = {};
        pattern.keys.forEach((key, index) => {
          try {
            // Decode URL-encoded parameters to prevent XSS via encoded scripts
            params[key] = decodeURIComponent(match[index + 1] || '');
          } catch (e) {
            // Handle malformed URI components - use raw value as fallback
            params[key] = match[index + 1] || '';
          }
        });

        return {
          path: pathname,
          params,
          query: this.parseQuery(search),
          hash: hash || '',
          route,
        };
      }
    }

    return null;
  }

  private parsePath(path: string): [string, string, string] {
    const hashIndex = path.indexOf('#');
    const searchIndex = path.indexOf('?');

    let pathname = path;
    let search = '';
    let hash = '';

    if (hashIndex !== -1) {
      hash = path.slice(hashIndex);
      pathname = path.slice(0, hashIndex);
    }

    if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
      search = pathname.slice(searchIndex);
      pathname = pathname.slice(0, searchIndex);
    }

    return [pathname, search, hash];
  }

  private parseQuery(search: string): Record<string, string> {
    const query: Record<string, string> = {};
    if (!search || search === '?') return query;

    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return query;
  }
}
