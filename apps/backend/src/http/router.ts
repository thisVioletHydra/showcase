import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: IncomingMessage['headers'];
}

export type RouteHandler = (req: ApiRequest, res: ServerResponse) => void | Promise<void>;

export interface RouteDefinition {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

export function parseQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

export function compileRoute(pathPattern: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regex = pathPattern.replace(/\:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name: string) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  return {
    pattern: new RegExp(`^${regex}$`),
    paramNames,
  };
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

export class Router {
  private routes: RouteDefinition[] = [];

  add(method: string, pathPattern: string, handler: RouteHandler): void {
    const compiled = compileRoute(pathPattern);
    this.routes.push({
      method: method.toUpperCase(),
      pattern: compiled.pattern,
      paramNames: compiled.paramNames,
      handler,
    });
  }

  get(pathPattern: string, handler: RouteHandler): void {
    this.add('GET', pathPattern, handler);
  }

  post(pathPattern: string, handler: RouteHandler): void {
    this.add('POST', pathPattern, handler);
  }

  match(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) {
        continue;
      }

      const match = pathname.match(route.pattern);
      if (!match) {
        continue;
      }

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1] ?? '');
      });

      return { handler: route.handler, params };
    }

    return null;
  }
}

export function getBearerToken(headers: IncomingMessage['headers']): string | null {
  const auth = headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice('Bearer '.length).trim();
}
