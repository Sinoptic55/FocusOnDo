/**
 * Lightweight Router based on History API
 */

export type RouteHandler = (params: Record<string, string>) => void | Promise<void>;
export type RouteGuard = () => boolean | Promise<boolean> | string | Promise<string>;

interface Route {
  path: string;
  regex: RegExp;
  keys: string[];
  handler: RouteHandler;
  guard?: RouteGuard;
}

export class Router {
  private static instance: Router;
  private routes: Route[] = [];
  private currentParams: Record<string, string> = {};

  private constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Intercept all link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        this.navigate(link.pathname + link.search + link.hash);
      }
    });
  }

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  /**
   * Register a route
   * @param path Path pattern (e.g. '/tasks/:id')
   * @param handler Function to call when route matches
   * @param guard Optional function to check if route can be accessed
   */
  public on(path: string, handler: RouteHandler, guard?: RouteGuard): void {
    const keys: string[] = [];
    const pattern = path
      .replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');
    
    this.routes.push({
      path,
      regex: new RegExp(`^${pattern}$`),
      keys,
      handler,
      guard
    });
  }

  /**
   * Navigate to a path
   */
  public navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  /**
   * Start the router
   */
  public start(): void {
    this.handleRoute();
  }

  /**
   * Handle the current route
   */
  private async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        // Check guard
        if (route.guard) {
          const guardResult = await route.guard();
          if (guardResult === false) {
            return; // Guard blocked and didn't redirect
          }
          if (typeof guardResult === 'string') {
            this.navigate(guardResult);
            return;
          }
        }

        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });
        
        this.currentParams = params;
        await route.handler(params);
        return;
      }
    }
    
    // Fallback if no route matches (e.g. 404 or redirect to /)
    console.warn(`No route matches path: ${path}`);
    if (path !== '/') {
      this.navigate('/');
    }
  }

  /**
   * Get current route parameters
   */
  public getParams(): Record<string, string> {
    return this.currentParams;
  }
}

export const router = Router.getInstance();
