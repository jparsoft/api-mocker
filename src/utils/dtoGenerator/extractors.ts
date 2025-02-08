import { JsonSchema, DTODefinition, ObjectType } from './types';
import { ApiEndpoint } from '../../types/api';

export class SchemaExtractor {
  private static seenSchemas = new Map<string, DTODefinition>();
  private static counter = 0;

  static reset(): void {
    this.seenSchemas.clear();
    this.counter = 0;
  }

  private static generateSchemaId(schema: JsonSchema, endpoint: ApiEndpoint, type: 'request' | 'response'): string {
    const schemaHash = JSON.stringify(schema);
    return `${endpoint.id}_${type}_${schemaHash}_${this.counter++}`;
  }

  private static extractJsonSchema(json: any): JsonSchema {
    if (Array.isArray(json)) {
      return {
        type: 'array',
        items: this.extractJsonSchema(json[0] || {})
      };
    }

    if (typeof json === 'object' && json !== null) {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(json)) {
        properties[key] = this.extractJsonSchema(value);
        if (value !== null && value !== undefined) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required
      };
    }

    return { type: typeof json };
  }

  static extractObjects(endpoints: ApiEndpoint[], objectTypes: ObjectType[]): DTODefinition[] {
    this.reset();
    const dtos: DTODefinition[] = [];

    endpoints.forEach(endpoint => {
      try {
        // Extract from response body
        const responseBody = JSON.parse(endpoint.response.body);
        const responseSchema = this.extractJsonSchema(responseBody);
        const responseDto = this.processSchema(responseSchema, endpoint, 'response');
        if (responseDto) {
          dtos.push(responseDto);
        }

        // Extract from request body if available
        try {
          const requestBody = JSON.parse(endpoint.request?.body || '{}');
          const requestSchema = this.extractJsonSchema(requestBody);
          const requestDto = this.processSchema(requestSchema, endpoint, 'request');
          if (requestDto) {
            dtos.push(requestDto);
          }
        } catch (error) {
          console.warn(`Failed to parse request body for endpoint ${endpoint.path}`);
        }
      } catch (error) {
        console.warn(`Failed to extract DTOs from endpoint ${endpoint.path}:`, error);
      }
    });

    return dtos;
  }

  private static processSchema(
    schema: JsonSchema,
    endpoint: ApiEndpoint,
    type: 'request' | 'response'
  ): DTODefinition | null {
    if (schema.type !== 'object' || !schema.properties) {
      return null;
    }

    const schemaId = this.generateSchemaId(schema, endpoint, type);
    if (this.seenSchemas.has(schemaId)) {
      return this.seenSchemas.get(schemaId)!;
    }

    const name = this.generateDTOName(endpoint.path, type);
    const dependencies: string[] = [];

    // Process nested objects
    Object.entries(schema.properties).forEach(([_, prop]) => {
      if (prop.type === 'object' && prop.properties) {
        const nestedDto = this.processSchema(prop, endpoint, type);
        if (nestedDto) {
          dependencies.push(nestedDto.id);
        }
      } else if (prop.type === 'array' && prop.items?.type === 'object' && prop.items.properties) {
        const nestedDto = this.processSchema(prop.items, endpoint, type);
        if (nestedDto) {
          dependencies.push(nestedDto.id);
        }
      }
    });

    const dto: DTODefinition = {
      id: schemaId,
      name,
      schema,
      source: {
        endpointId: endpoint.id,
        path: endpoint.path,
        method: endpoint.method,
        type
      },
      dependencies
    };

    this.seenSchemas.set(schemaId, dto);
    return dto;
  }

  private static generateDTOName(path: string, type: 'request' | 'response'): string {
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'root';
    const suffix = type === 'request' ? 'Request' : 'Response';
    return this.toPascalCase(lastPart) + suffix;
  }

  private static toPascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }
}