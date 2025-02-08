import { PostmanCollection, PostmanItem, PostmanRequest, PostmanResponse } from './postmanConverter/types';

interface ApiResponseData {
  url: string;
  method: string;
  response: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
}

export class ApiResponseConverter {
  static async convertUrlToCollection(url: string): Promise<PostmanCollection> {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const responseData: ApiResponseData = {
        url,
        method: 'GET',
        response: {
          status: response.status,
          body: await response.text(),
          headers: Object.fromEntries(response.headers.entries())
        }
      };

      return this.createCollection(responseData);
    } catch (error) {
      throw new Error(`Failed to fetch API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static createCollection(data: ApiResponseData): PostmanCollection {
    const urlParts = new URL(data.url);
    const pathSegments = urlParts.pathname.split('/').filter(Boolean);
    const name = pathSegments[pathSegments.length - 1] || 'root';

    const request: PostmanRequest = {
      method: data.method,
      header: Object.entries(data.response.headers).map(([key, value]) => ({
        key,
        value,
        type: 'text',
        disabled: false
      })),
      url: {
        raw: data.url,
        protocol: urlParts.protocol.replace(':', ''),
        host: [urlParts.host],
        path: pathSegments
      }
    };

    const response: PostmanResponse = {
      name: 'Example Response',
      originalRequest: request,
      status: this.getStatusText(data.response.status),
      code: data.response.status,
      _postman_previewlanguage: this.getLanguageFromContentType(data.response.headers['content-type']),
      header: Object.entries(data.response.headers).map(([key, value]) => ({
        key,
        value,
        name: key
      })),
      body: data.response.body
    };

    const item: PostmanItem = {
      name: `${data.method} /${name}`,
      request,
      response: [response]
    };

    return {
      info: {
        name: 'Generated Collection',
        description: `Collection generated from ${data.url}`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [item]
    };
  }

  private static getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    };
    return `${status} ${statusTexts[status] || 'Unknown'}`;
  }

  private static getLanguageFromContentType(contentType: string = ''): string {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('javascript')) return 'javascript';
    return 'text';
  }
}