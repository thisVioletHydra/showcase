export function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => {
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
            }
            catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
export function parseQuery(url) {
    const query = {};
    for (const [key, value] of url.searchParams.entries()) {
        query[key] = value;
    }
    return query;
}
export function compileRoute(pathPattern) {
    const paramNames = [];
    const regex = pathPattern.replace(/\:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    return {
        pattern: new RegExp(`^${regex}$`),
        paramNames,
    };
}
export function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}
export function sendError(res, status, message) {
    sendJson(res, status, { error: message });
}
export class Router {
    routes = [];
    add(method, pathPattern, handler) {
        const compiled = compileRoute(pathPattern);
        this.routes.push({
            method: method.toUpperCase(),
            pattern: compiled.pattern,
            paramNames: compiled.paramNames,
            handler,
        });
    }
    get(pathPattern, handler) {
        this.add('GET', pathPattern, handler);
    }
    post(pathPattern, handler) {
        this.add('POST', pathPattern, handler);
    }
    match(method, pathname) {
        for (const route of this.routes) {
            if (route.method !== method.toUpperCase()) {
                continue;
            }
            const match = pathname.match(route.pattern);
            if (!match) {
                continue;
            }
            const params = {};
            route.paramNames.forEach((name, index) => {
                params[name] = decodeURIComponent(match[index + 1] ?? '');
            });
            return { handler: route.handler, params };
        }
        return null;
    }
}
export function getBearerToken(headers) {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return null;
    }
    return auth.slice('Bearer '.length).trim();
}
