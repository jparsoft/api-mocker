import { ApiEndpoint } from '../../types/api';
import {
  PostmanCollection,
  PostmanItem,
  PostmanItemGroup,
  ConversionOptions,
  PostmanRequest,
  PostmanResponse
} from './types';

export class PostmanConverter {
  static toCollection(endpoints: ApiEndpoint[], options: ConversionOptions): PostmanCollection {
    const collection: PostmanCollection = {
      info: {
        name: options.name,
        description: options.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: []
    };

    if (options.groupByPath) {
      collection.item = this.groupEndpoints(endpoints, options);
    } else {
      collection.item = endpoints.map(endpoint => this.createPostmanItem(endpoint, options));
    }

    if (options.baseUrl) {
      collection.variable = [{
        key: 'baseUrl',
        value: options.baseUrl,
        type: 'string',
        enabled: true
      }];
    }

    return collection;
  }

  private static groupEndpoints(
    endpoints: ApiEndpoint[],
    options: ConversionOptions
  ): (PostmanItem | PostmanItemGroup)[] {
    const groups = new Map<string, ApiEndpoint[]>();

    // Group endpoints by their base path
    endpoints.forEach(endpoint => {
      const parts = endpoint.path.split('/').filter(Boolean);
      const basePath = parts[0] || 'root';
      
      if (!groups.has(basePath)) {
        groups.set(basePath, []);
      }
      groups.get(basePath)!.push(endpoint);
    });

    // Convert groups to Postman item groups
    return Array.from(groups.entries()).map(([name, groupEndpoints]) => ({
      name: this.formatGroupName(name),
      item: groupEndpoints.map(endpoint => this.createPostmanItem(endpoint, options))
    }));
  }

  private static formatGroupName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static createPostmanItem(endpoint: ApiEndpoint, options: ConversionOptions): PostmanItem {
    const item: PostmanItem = {
      name: this.generateItemName(endpoint),
      request: this.createRequest(endpoint, options),
      response: []
    };

    if (options.includeExamples) {
      item.response = [this.createResponse(endpoint, item.request)];
    }

    return item;
  }

  private static generateItemName(endpoint: ApiEndpoint): string {
    const parts = endpoint.path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'root';
    
    return `${endpoint.method} ${lastPart}`
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static createRequest(endpoint: ApiEndpoint, options: ConversionOptions): PostmanRequest {
    const request: PostmanRequest = {
      method: endpoint.method,
      header: endpoint.headers.map(h => ({
        key: h.key,
        value: this.cleanVariableValue(h.value, options.cleanVariables),
        type: 'text',
        disabled: false
      })),
      url: this.parseUrl(endpoint.path, options),
      description: endpoint.description
    };

    // Add request body for methods that typically include one
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      request.body = {
        mode: 'raw',
        raw: '{\n  "key": "value"\n}',
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    }

    return request;
  }

  private static parseUrl(path: string, options: ConversionOptions) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const pathSegments = cleanPath.split('/').filter(Boolean);

    const url = {
      raw: options.baseUrl ? `{{baseUrl}}${cleanPath}` : cleanPath,
      protocol: 'http',
      host: options.baseUrl ? ['{{baseUrl}}'] : ['localhost:3000'],
      path: pathSegments
    };

    return url;
  }

  private static createResponse(endpoint: ApiEndpoint, request: PostmanRequest): PostmanResponse {
    return {
      name: 'Example Response',
      originalRequest: request,
      status: 'OK',
      code: endpoint.response.status,
      _postman_previewlanguage: this.getLanguageFromContentType(endpoint.response.contentType),
      header: [
        {
          key: 'Content-Type',
          value: endpoint.response.contentType,
          name: 'Content-Type'
        },
        ...endpoint.headers.map(h => ({
          key: h.key,
          value: h.value,
          name: h.key
        }))
      ],
      body: endpoint.response.body
    };
  }

  private static getLanguageFromContentType(contentType: string): string {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('javascript')) return 'javascript';
    return 'text';
  }

  private static cleanVariableValue(value: string, clean = true): string {
    if (!clean) return value;

    // Replace common sensitive values with variables
    const replacements: [RegExp, string][] = [
      [/Bearer\s+[\w\-\.]+/i, 'Bearer {{accessToken}}'],
      [/Basic\s+[\w\-\.]+/i, 'Basic {{basicAuth}}'],
      [/ApiKey\s+[\w\-\.]+/i, '{{apiKey}}'],
      [/([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})/i, '{{apiKey}}'],
      [/[\w\-\.]+@[\w\-\.]+/i, '{{email}}'],
      [/\b\d{10,16}\b/g, '{{id}}']
    ];

    let cleaned = value;
    replacements.forEach(([pattern, replacement]) => {
      cleaned = cleaned.replace(pattern, replacement);
    });

    return cleaned;
  }
}