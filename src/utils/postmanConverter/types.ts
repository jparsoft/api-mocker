import { ApiEndpoint } from '../../types/api';

export interface PostmanInfo {
  name: string;
  description?: string;
  schema: string;
}

export interface PostmanVariable {
  key: string;
  value: string;
  type: string;
  enabled: boolean;
}

export interface PostmanRequest {
  method: string;
  header: Array<{
    key: string;
    value: string;
    type: string;
    disabled?: boolean;
  }>;
  url: {
    raw: string;
    protocol: string;
    host: string[];
    path: string[];
    query?: Array<{
      key: string;
      value: string;
      disabled?: boolean;
    }>;
  };
  body?: {
    mode: string;
    raw?: string;
    options?: {
      raw?: {
        language: string;
      };
    };
  };
  description?: string;
}

export interface PostmanResponse {
  name: string;
  originalRequest: PostmanRequest;
  status: string;
  code: number;
  _postman_previewlanguage: string;
  header: Array<{
    key: string;
    value: string;
    name: string;
    description?: string;
  }>;
  body: string;
}

export interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response: PostmanResponse[];
}

export interface PostmanItemGroup {
  name: string;
  description?: string;
  item: (PostmanItem | PostmanItemGroup)[];
}

export interface PostmanCollection {
  info: PostmanInfo;
  item: (PostmanItem | PostmanItemGroup)[];
  variable?: PostmanVariable[];
}

export interface ConversionOptions {
  name: string;
  description?: string;
  groupByPath?: boolean;
  includeExamples?: boolean;
  cleanVariables?: boolean;
  baseUrl?: string;
}