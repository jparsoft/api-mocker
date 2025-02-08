export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Header {
  key: string;
  value: string;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: HttpMethod;
  description: string;
  headers: Header[];
  response: {
    status: number;
    body: string;
    contentType: string;
  };
  createdAt: number;
  lastModified?: number;
  isPublished?: boolean;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: number;
  type: 'collection' | 'endpoint';
  action: 'create' | 'update' | 'delete' | 'duplicate' | 'import';
  itemId: string;
  collectionId: string;
  changes: {
    before?: any;
    after?: any;
  };
}

export interface ApiCollection {
  id: string;
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
  createdAt: number;
  lastModified?: number;
}