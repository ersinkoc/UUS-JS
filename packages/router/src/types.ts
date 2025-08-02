export interface Route {
  path: string;
  component?: any;
  redirect?: string;
  meta?: Record<string, any>;
  beforeEnter?: RouteGuard;
  children?: Route[];
}

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  route: Route;
}

export interface RouterOptions {
  mode?: 'hash' | 'history';
  base?: string;
  routes: Route[];
  scrollBehavior?: ScrollBehavior;
}

export type RouteGuard = (
  to: RouteMatch,
  from: RouteMatch | null,
  next: (to?: string | false) => void
) => void;

export type ScrollBehavior = (
  to: RouteMatch,
  from: RouteMatch | null,
  savedPosition?: { x: number; y: number }
) => { x: number; y: number } | void;

export interface Router {
  currentRoute: RouteMatch | null;
  push(path: string): void;
  replace(path: string): void;
  go(n: number): void;
  back(): void;
  forward(): void;
  beforeEach(guard: RouteGuard): void;
  afterEach(hook: (to: RouteMatch, from: RouteMatch | null) => void): void;
  resolve(path: string): RouteMatch | null;
  install(uus: any): void;
}
