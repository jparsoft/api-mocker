import { ApiDiscoveryOptions, EndpointDiscoveryResult } from './types';

export class EndpointDiscovery {
  private static readonly COMMON_PATHS = [
    '/api',
    '/v1',
    '/v2',
    '/users',
    '/auth',
    '/products',
    '/orders',
    '/categories',
    '/items',
    '/posts',
    '/comments',
    '/profile',
    '/settings'
  ];

  private static readonly COMMON_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  static async discoverEndpoints(options: ApiDiscoveryOptions): Promise<EndpointDiscoveryResult[]> {
    const results: EndpointDiscoveryResult[] = [];
    const visitedPaths = new Set<string>();
    const baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;

    // Try common API paths first
    for (const path of this.COMMON_PATHS) {
      if (options.maxDepth && visitedPaths.size >= options.maxDepth) break;
      
      const fullPath = `${baseUrl}${path}`;
      if (visitedPaths.has(fullPath)) continue;

      const methods = options.includeMethods || this.COMMON_METHODS;
      for (const method of methods) {
        try {
          const result = await this.testEndpoint(fullPath, method, options);
          if (result) {
            results.push(result);
            visitedPaths.add(fullPath);

            // Also try sub-paths if it's a successful endpoint
            if (result.response.status === 200) {
              const subPaths = this.generateSubPaths(path);
              for (const subPath of subPaths) {
                if (visitedPaths.size >= (options.maxDepth || 10)) break;
                
                const fullSubPath = `${baseUrl}${subPath}`;
                if (visitedPaths.has(fullSubPath)) continue;

                const subResult = await this.testEndpoint(fullSubPath, method, options);
                if (subResult) {
                  results.push(subResult);
                  visitedPaths.add(fullSubPath);
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to test ${method} ${fullPath}:`, error);
        }
      }
    }

    return results;
  }

  private static generateSubPaths(basePath: string): string[] {
    const subPaths = [];
    const commonSubPaths = [
      '/list',
      '/all',
      '/search',
      '/details',
      '/create',
      '/update',
      '/delete',
      '/status',
      '/count'
    ];

    for (const subPath of commonSubPaths) {
      subPaths.push(`${basePath}${subPath}`);
    }

    // Add ID parameter paths
    subPaths.push(`${basePath}/{id}`);
    subPaths.push(`${basePath}/1`);
    subPaths.push(`${basePath}/test`);

    return subPaths;
  }

  private static async testEndpoint(
    url: string,
    method: string,
    options: ApiDiscoveryOptions
  ): Promise<EndpointDiscoveryResult | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 5000);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (options.authentication) {
        switch (options.authentication.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${options.authentication.token}`;
            break;
          case 'basic':
            const auth = btoa(`${options.authentication.username}:${options.authentication.password}`);
            headers['Authorization'] = `Basic ${auth}`;
            break;
          case 'apiKey':
            headers[options.authentication.headerName || 'X-API-Key'] = options.authentication.token || '';
            break;
        }
      }

      const fetchUrl = options.useProxy ? `${options.proxyUrl}${url}` : url;
      const response = await fetch(fetchUrl, {
        method,
        headers,
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeout);

      // Only process successful responses or 4xx errors (they indicate valid endpoints)
      if (response.status < 200 || response.status >= 500) return null;

      let body: any;
      const contentType = response.headers.get('content-type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          body = await response.json();
        } else {
          const text = await response.text();
          body = { message: text };
        }
      } catch (error) {
        console.warn(`Failed to parse response body for ${method} ${url}:`, error);
        body = { message: 'Failed to parse response body' };
      }

      const headersList = options.includeHeaders
        ? Array.from(response.headers.entries()).map(([key, value]) => ({
            key,
            value
          }))
        : [];

      return {
        path: new URL(url).pathname,
        method,
        response: {
          status: response.status,
          body,
          contentType: contentType.split(';')[0] || 'application/json'
        },
        headers: headersList
      };
    } catch (error) {
      clearTimeout(timeout);
      return null;
    }
  }
}