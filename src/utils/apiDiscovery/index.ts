import { ApiDiscoveryOptions, ApiDiscoveryResult } from './types';
import { EndpointDiscovery } from './endpointDiscovery';
import { OpenApiParser } from './openApiParser';
import { ApiEndpoint } from '../../types/api';

export class ApiDiscovery {
  static async discoverApi(options: ApiDiscoveryOptions): Promise<ApiDiscoveryResult> {
    const result: ApiDiscoveryResult = {
      endpoints: [],
      errors: []
    };

    try {
      // Validate base URL
      if (!options.baseUrl) {
        throw new Error('Base URL is required');
      }

      let baseUrl = options.baseUrl;
      
      // Add protocol if missing
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      // Remove trailing slash
      baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

      // Try to fetch the API directly first
      try {
        const response = await fetch(baseUrl, {
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          mode: 'cors'
        });

        const contentType = response.headers.get('content-type') || '';
        const body = await response.text();
        let parsedBody;

        try {
          parsedBody = contentType.includes('json') ? JSON.stringify(JSON.parse(body), null, 2) : body;
        } catch (e) {
          parsedBody = body;
        }

        // Add the root endpoint if we got a valid response
        if (response.ok || (response.status >= 400 && response.status < 600)) {
          result.endpoints.push({
            id: crypto.randomUUID(),
            path: '/',
            method: 'GET',
            description: 'Root endpoint',
            headers: [],
            response: {
              status: response.status,
              body: parsedBody,
              contentType: contentType || 'application/json'
            },
            createdAt: Date.now()
          });
        }
      } catch (error) {
        console.warn('Failed to fetch root endpoint:', error);
        // Don't throw here, continue with discovery
      }

      // Common API paths to try
      const commonPaths = [
        '/api',
        '/v1',
        '/v2',
        '/api/v1',
        '/api/v2',
        '/data',
        '/facts',
        '/random',
        '/breeds',
        '/images',
        '/search',
        '/users',
        '/posts',
        '/comments'
      ];

      // Try common paths with different methods
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const pathResults = await Promise.allSettled(
        commonPaths.flatMap(path => 
          methods.map(async method => {
            try {
              const response = await fetch(`${baseUrl}${path}`, {
                method,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Origin': window.location.origin
                },
                mode: 'cors',
                ...(method !== 'GET' && {
                  body: JSON.stringify({ test: true })
                })
              });

              const contentType = response.headers.get('content-type') || '';
              const body = await response.text();
              let parsedBody;

              try {
                parsedBody = contentType.includes('json') ? JSON.stringify(JSON.parse(body), null, 2) : body;
              } catch (e) {
                parsedBody = body;
              }

              // Include endpoints that return valid responses, including 4xx errors
              if (response.ok || (response.status >= 400 && response.status < 600)) {
                return {
                  path,
                  method,
                  description: `Discovered endpoint: ${method} ${path}`,
                  headers: [],
                  response: {
                    status: response.status,
                    body: parsedBody,
                    contentType: contentType || 'application/json'
                  }
                };
              }
            } catch (error) {
              console.warn(`Failed to test ${method} ${path}:`, error);
            }
            return null;
          })
        )
      );

      // Process results and filter out failed promises
      const validEndpoints = pathResults
        .filter((result): result is PromiseFulfilledResult<NonNullable<any>> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => ({
          id: crypto.randomUUID(),
          ...result.value,
          createdAt: Date.now()
        }));

      result.endpoints.push(...validEndpoints);

      // Remove duplicates
      const seen = new Set<string>();
      result.endpoints = result.endpoints.filter(endpoint => {
        const key = `${endpoint.method}:${endpoint.path}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // If no endpoints were found, add an error
      if (result.endpoints.length === 0) {
        result.errors.push('No endpoints were discovered. This might be due to CORS restrictions or the API might not be accessible.');
      }

    } catch (error) {
      console.error('API discovery error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during API discovery');
    }

    return result;
  }
}