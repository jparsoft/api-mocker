import { ApiEndpoint } from '../../types/api';

export interface ApiDiscoveryOptions {
  baseUrl: string;
  useProxy?: boolean;
  proxyUrl?: string;
  timeout?: number;
  maxDepth?: number;
  includeHeaders?: boolean;
  includeMethods?: string[];
  excludePaths?: string[];
  authentication?: {
    type: 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
  };
}

export interface ApiDiscoveryResult {
  openApiSpec?: any;
  endpoints: ApiEndpoint[];
  errors: string[];
}

export interface EndpointDiscoveryResult {
  path: string;
  method: string;
  response: {
    status: number;
    body: any;
    contentType: string;
  };
  headers: Array<{ key: string; value: string }>;
  error?: string;
}

export interface OpenApiInfo {
  title: string;
  description?: string;
  version: string;
  paths: Record<string, Record<string, any>>;
}