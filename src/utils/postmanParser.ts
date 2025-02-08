import { ApiEndpoint, Header, HttpMethod } from '../types/api';

interface PostmanEnvironmentVariable {
  key: string;
  value: string;
  type: string;
  enabled: boolean;
}

interface PostmanEnvironment {
  id: string;
  name: string;
  values: PostmanEnvironmentVariable[];
  _postman_variable_scope: string;
  _postman_exported_at?: string;
  _postman_exported_using?: string;
}

interface PostmanRequest {
  method: string;
  header: Array<{
    key: string;
    value: string;
    type?: string;
    disabled?: boolean;
  }>;
  url: {
    raw: string;
    protocol?: string;
    host?: string[];
    path?: string[];
    query?: Array<{
      key: string;
      value: string;
      disabled?: boolean;
    }>;
  };
  body?: {
    mode: string;
    raw?: string;
    formdata?: Array<{
      key: string;
      value: string;
      type: string;
    }>;
  };
}

interface PostmanResponse {
  name?: string;
  originalRequest?: PostmanRequest;
  status?: string;
  code: number;
  _postman_previewlanguage?: string;
  header?: Array<{
    key: string;
    value: string;
  }>;
  body?: string;
}

interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response?: PostmanResponse[];
  item?: PostmanItem[];
}

interface PostmanCollection {
  info: {
    _postman_id?: string;
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanItem[];
}

export class PostmanParser {
  static isPostmanEnvironment(data: any): data is PostmanEnvironment {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.values) &&
      data._postman_variable_scope === 'environment' &&
      data.values.every((v: any) => 
        typeof v.key === 'string' &&
        typeof v.value === 'string' &&
        typeof v.type === 'string' &&
        typeof v.enabled === 'boolean'
      )
    );
  }

  static handleEnvironmentImport(data: PostmanEnvironment): void {
    const variables = data.values
      .filter(v => v.enabled)
      .reduce((acc, v) => {
        acc[v.key] = v.value;
        return acc;
      }, {} as Record<string, string>);

    localStorage.setItem('postman_environment', JSON.stringify(variables));
  }

  static isPostmanCollection(data: any): data is PostmanCollection {
    return (
      data &&
      typeof data === 'object' &&
      data.info &&
      typeof data.info.name === 'string' &&
      typeof data.info.schema === 'string' &&
      data.info.schema.includes('schema.getpostman.com') &&
      Array.isArray(data.item)
    );
  }

  static replaceEnvironmentVariables(value: string): string {
    const storedEnv = localStorage.getItem('postman_environment');
    const envVariables = storedEnv ? JSON.parse(storedEnv) : {};

    return value.replace(/{{([^}]+)}}/g, (match, variable) => {
      if (variable.includes('id') || variable.includes('Id')) {
        return `:${variable.toLowerCase()}`;
      }

      if (envVariables[variable]) {
        return envVariables[variable];
      }

      const defaultValues: Record<string, string> = {
        'apiKey': 'demo-api-key',
        'accessToken': 'demo-access-token',
        'authToken': 'demo-auth-token',
        'bearerToken': 'demo-bearer-token',
        'env': 'demo',
        'environment': 'demo',
        'stage': 'demo',
        'version': 'v1',
        'apiVersion': 'v1',
        'baseUrl': '',
        'apiUrl': '',
        'host': '',
        'appCtx': '',
        'appPort': '8080',
        '*': 'demo-value'
      };

      const normalizedVar = variable.toLowerCase();
      for (const [key, value] of Object.entries(defaultValues)) {
        if (normalizedVar.includes(key.toLowerCase())) {
          return value;
        }
      }

      return defaultValues['*'];
    });
  }

  static parse(collection: PostmanCollection): {
    name: string;
    description: string;
    endpoints: Omit<ApiEndpoint, 'id' | 'createdAt'>[];
  } {
    const endpoints: Omit<ApiEndpoint, 'id' | 'createdAt'>[] = [];

    const processItem = (item: PostmanItem) => {
      if (item.item) {
        item.item.forEach(processItem);
        return;
      }

      if (!item.request) return;

      const path = item.request.url.path?.join('/') || '';
      const method = item.request.method.toUpperCase() as HttpMethod;

      // Get the first successful response or create a default one
      const successResponse = item.response?.find(r => r.code >= 200 && r.code < 300);
      const response = {
        status: successResponse?.code || 200,
        body: successResponse?.body || '{"message": "OK"}',
        contentType: successResponse?.header?.find(h => 
          h.key.toLowerCase() === 'content-type'
        )?.value || 'application/json'
      };

      // Convert headers
      const headers: Header[] = (item.request.header || [])
        .filter(h => !h.disabled)
        .map(h => ({
          key: h.key,
          value: this.replaceEnvironmentVariables(h.value)
        }));

      endpoints.push({
        path: this.replaceEnvironmentVariables(path),
        method,
        description: item.name,
        headers,
        response
      });
    };

    collection.item.forEach(processItem);

    return {
      name: collection.info.name,
      description: collection.info.description || '',
      endpoints
    };
  }
}