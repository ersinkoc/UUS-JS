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
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return '([^\/]+)';
      })
      .replace(/\*/g, '(.*)');

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
          params[key] = match[index + 1] || '';
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
