import { OpenApiInfo, EndpointDiscoveryResult } from './types';
import { ApiEndpoint } from '../../types/api';

export class OpenApiParser {
  static async parseOpenApiSpec(spec: any): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods as Record<string, any>)) {
        if (method === 'parameters' || method === '$ref') continue;

        try {
          const response = details.responses?.['200'] || details.responses?.['201'] || Object.values(details.responses || {})[0];
          const responseSchema = response?.content?.['application/json']?.schema;
          const example = this.generateExampleFromSchema(responseSchema);
          
          // Get response status code
          const statusCode = parseInt(Object.keys(details.responses || {})[0]) || 200;

          // Extract description from summary, description, or operationId
          const description = details.summary || details.description || details.operationId || '';

          // Extract headers
          const headers = this.extractHeaders(details);

          // Create endpoint
          endpoints.push({
            id: crypto.randomUUID(),
            path: path.replace(/\{([^}]+)\}/g, ':$1'), // Convert {param} to :param
            method: method.toUpperCase(),
            description,
            headers,
            response: {
              status: statusCode,
              body: JSON.stringify(example, null, 2),
              contentType: 'application/json'
            },
            createdAt: Date.now()
          });
        } catch (error) {
          console.warn(`Failed to parse endpoint ${method} ${path}:`, error);
          continue;
        }
      }
    }

    return endpoints;
  }

  private static extractHeaders(details: any): Array<{ key: string; value: string }> {
    const headers: Array<{ key: string; value: string }> = [];

    // Add content-type header by default
    headers.push({ key: 'Content-Type', value: 'application/json' });

    // Extract headers from parameters
    const parameters = details.parameters || [];
    parameters.forEach((param: any) => {
      if (param.in === 'header') {
        headers.push({
          key: param.name,
          value: this.generateExampleValue(param)
        });
      }
    });

    // Add security headers if present
    if (details.security?.length > 0) {
      const security = details.security[0];
      if (security.bearerAuth) {
        headers.push({ key: 'Authorization', value: 'Bearer YOUR_TOKEN' });
      } else if (security.apiKeyAuth) {
        headers.push({ key: 'X-API-Key', value: 'YOUR_API_KEY' });
      }
    }

    return headers;
  }

  private static generateExampleValue(param: any): string {
    if (param.example) return String(param.example);
    if (param.default) return String(param.default);
    
    switch (param.schema?.type) {
      case 'string':
        if (param.schema.format === 'date-time') return new Date().toISOString();
        if (param.schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (param.schema.enum?.length > 0) return param.schema.enum[0];
        return 'string';
      case 'number':
      case 'integer':
        return '0';
      case 'boolean':
        return 'true';
      default:
        return '';
    }
  }

  private static generateExampleFromSchema(schema: any): any {
    if (!schema) return { message: "Success" };

    const seen = new Set<string>();
    const generate = (schema: any, depth = 0): any => {
      if (depth > 3) return null; // Prevent infinite recursion
      if (!schema) return null;

      // Handle $ref
      if (schema.$ref) {
        const ref = schema.$ref.split('/').pop();
        if (seen.has(ref)) return {}; // Prevent circular references
        seen.add(ref);
      }

      switch (schema.type) {
        case 'object':
          const obj: Record<string, any> = {};
          if (schema.properties) {
            for (const [key, prop] of Object.entries<any>(schema.properties)) {
              obj[key] = generate(prop, depth + 1);
            }
          }
          return obj;

        case 'array':
          if (depth > 2) return []; // Limit array depth
          return [generate(schema.items, depth + 1)];

        case 'string':
          if (schema.format === 'date-time') return new Date().toISOString();
          if (schema.format === 'date') return new Date().toISOString().split('T')[0];
          if (schema.format === 'email') return 'user@example.com';
          if (schema.format === 'uuid') return crypto.randomUUID();
          if (schema.enum) return schema.enum[0];
          return schema.example || schema.default || 'string';

        case 'number':
        case 'integer':
          return schema.example || schema.default || 0;

        case 'boolean':
          return schema.example || schema.default || true;

        case 'null':
          return null;

        default:
          return schema.example || schema.default || null;
      }
    };

    return generate(schema);
  }
}