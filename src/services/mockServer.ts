import { ApiEndpoint } from '../types/api';

interface MockRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
}

interface MockResponse {
  status: number;
  statusText: string;
  body: any;
  headers: Record<string, string>;
}

interface EndpointMetrics {
  requests: number;
  lastAccessed: number;
}

export class MockServer {
  private static instance: MockServer;
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private publishedEndpoints: Set<string> = new Set();
  private metrics: Map<string, EndpointMetrics> = new Map();
  private apiKeys: Set<string> = new Set();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT = 100; // requests per minute
  private readonly RATE_WINDOW = 60000; // 1 minute in milliseconds

  private requestHistory: Array<{
    timestamp: number;
    request: MockRequest;
    response: MockResponse;
    endpointId: string;
  }> = [];

  private constructor() {
    // Initialize with a default API key
    this.apiKeys.add(crypto.randomUUID());
  }

  static getInstance(): MockServer {
    if (!MockServer.instance) {
      MockServer.instance = new MockServer();
    }
    return MockServer.instance;
  }

  getPublicUrl(endpointId: string): string {
    if (!this.publishedEndpoints.has(endpointId)) return '';
    const endpoint = Array.from(this.endpoints.values()).find(e => e.id === endpointId);
    if (!endpoint) return '';
    return `${window.location.origin}/api/mock/${endpoint.path}`;
  }

  isPublished(endpointId: string): boolean {
    return this.publishedEndpoints.has(endpointId);
  }

  getMetrics(endpointId: string): EndpointMetrics {
    return this.metrics.get(endpointId) || { requests: 0, lastAccessed: 0 };
  }

  publishEndpoint(endpointId: string): void {
    this.publishedEndpoints.add(endpointId);
  }

  unpublishEndpoint(endpointId: string): void {
    this.publishedEndpoints.delete(endpointId);
  }

  generateApiKey(): string {
    const apiKey = crypto.randomUUID();
    this.apiKeys.add(apiKey);
    return apiKey;
  }

  private checkRateLimit(apiKey: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(apiKey);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(apiKey, {
        count: 1,
        resetTime: now + this.RATE_WINDOW
      });
      return true;
    }

    if (limit.count >= this.RATE_LIMIT) {
      return false;
    }

    limit.count++;
    return true;
  }

  updateEndpoints(endpoints: ApiEndpoint[]): void {
    this.endpoints.clear();
    endpoints.forEach(endpoint => {
      this.endpoints.set(this.getEndpointKey(endpoint.method, endpoint.path), endpoint);
      
      // Initialize metrics for new endpoints
      if (!this.metrics.has(endpoint.id)) {
        this.metrics.set(endpoint.id, { requests: 0, lastAccessed: 0 });
      }
    });
  }

  private getEndpointKey(method: string, path: string): string {
    return `${method}:${path}`;
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || 'Unknown Status';
  }

  private updateMetrics(endpointId: string): void {
    const metrics = this.metrics.get(endpointId) || { requests: 0, lastAccessed: 0 };
    this.metrics.set(endpointId, {
      requests: metrics.requests + 1,
      lastAccessed: Date.now()
    });
  }

  async handleRequest(request: MockRequest, apiKey?: string): Promise<MockResponse> {
    // Check API key if provided
    if (apiKey && !this.apiKeys.has(apiKey)) {
      return {
        status: 401,
        statusText: 'Unauthorized',
        body: { error: 'Invalid API key' },
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Check rate limit
    if (apiKey && !this.checkRateLimit(apiKey)) {
      return {
        status: 429,
        statusText: 'Too Many Requests',
        body: { error: 'Rate limit exceeded' },
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const endpoint = this.endpoints.get(this.getEndpointKey(request.method, request.path));

    if (!endpoint) {
      const response = {
        status: 404,
        statusText: 'Not Found',
        body: { error: 'Endpoint not found' },
        headers: { 'Content-Type': 'application/json' },
      };

      this.logRequest(request, response, '');
      return response;
    }

    // Check if endpoint is published
    if (!this.publishedEndpoints.has(endpoint.id)) {
      return {
        status: 404,
        statusText: 'Not Found',
        body: { error: 'Endpoint not published' },
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Update metrics
    this.updateMetrics(endpoint.id);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    const response = {
      status: endpoint.response.status,
      statusText: this.getStatusText(endpoint.response.status),
      body: JSON.parse(endpoint.response.body),
      headers: {
        'Content-Type': endpoint.response.contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        ...Object.fromEntries(endpoint.headers.map(h => [h.key, h.value])),
      },
    };

    this.logRequest(request, response, endpoint.id);
    return response;
  }

  private logRequest(request: MockRequest, response: MockResponse, endpointId: string): void {
    this.requestHistory.unshift({
      timestamp: Date.now(),
      request,
      response,
      endpointId,
    });

    // Keep only the last 100 requests
    if (this.requestHistory.length > 100) {
      this.requestHistory.pop();
    }
  }

  getRequestHistory() {
    return this.requestHistory;
  }

  clearHistory(): void {
    this.requestHistory = [];
  }
}