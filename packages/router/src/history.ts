export interface History {
  current: string;
  push(path: string): void;
  replace(path: string): void;
  go(n: number): void;
  listen(callback: (path: string) => void): () => void;
}

export class HashHistory implements History {
  private listeners: Set<(path: string) => void> = new Set();

  get current(): string {
    return window.location.hash.slice(1) || '/';
  }

  push(path: string): void {
    window.location.hash = path;
  }

  replace(path: string): void {
    const url = window.location.href.replace(/#.*/, '') + '#' + path;
    window.history.replaceState(null, '', url);
    this.notifyListeners();
  }

  go(n: number): void {
    window.history.go(n);
  }

  listen(callback: (path: string) => void): () => void {
    this.listeners.add(callback);

    const handleHashChange = () => {
      callback(this.current);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      this.listeners.delete(callback);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }

  private notifyListeners(): void {
    const current = this.current;
    this.listeners.forEach((listener) => listener(current));
  }
}

export class HTML5History implements History {
  private listeners: Set<(path: string) => void> = new Set();
  private base: string;

  constructor(base = '') {
    this.base = base;
  }

  get current(): string {
    const path = window.location.pathname;
    if (this.base && path.startsWith(this.base)) {
      return path.slice(this.base.length) || '/';
    }
    return path;
  }

  push(path: string): void {
    const fullPath = this.base + path;
    window.history.pushState(null, '', fullPath);
    this.notifyListeners();
  }

  replace(path: string): void {
    const fullPath = this.base + path;
    window.history.replaceState(null, '', fullPath);
    this.notifyListeners();
  }

  go(n: number): void {
    window.history.go(n);
  }

  listen(callback: (path: string) => void): () => void {
    this.listeners.add(callback);

    const handlePopState = () => {
      callback(this.current);
    };

    window.addEventListener('popstate', handlePopState);

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (
        link &&
        link.href &&
        link.target !== '_blank' &&
        link.hostname === window.location.hostname
      ) {
        e.preventDefault();
        const path = link.pathname + link.search + link.hash;
        this.push(path);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      this.listeners.delete(callback);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }

  private notifyListeners(): void {
    const current = this.current;
    this.listeners.forEach((listener) => listener(current));
  }
}
