import { SchemaExtractor } from '../../utils/dtoGenerator/extractors';
import { createGenerator } from '../../utils/dtoGenerator/generators';
import { ZipGenerator } from '../../utils/dtoGenerator/zipGenerator';
import { ApiEndpoint } from '../../types/api';
import { GeneratorOptions } from '../../utils/dtoGenerator/types';

describe('DTO Generator', () => {
  const mockEndpoint: ApiEndpoint = {
    id: '1',
    path: '/users',
    method: 'GET',
    description: 'Get user details',
    headers: [],
    response: {
      status: 200,
      body: JSON.stringify({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        isActive: true,
        addresses: [
          {
            street: '123 Main St',
            city: 'New York',
            country: 'USA'
          }
        ]
      }),
      contentType: 'application/json'
    },
    createdAt: Date.now()
  };

  const defaultOptions: GeneratorOptions = {
    useAnnotations: true,
    namingConvention: 'PascalCase',
    generateValidation: true,
    generateBuilders: false,
    generateFactoryMethods: true,
    generateEqualsAndHash: true,
    generateToString: true,
    generateComments: true,
    generateNullChecks: true,
    objectTypes: ['dto']
  };

  describe('SchemaExtractor', () => {
    it('should extract DTOs from endpoints', () => {
      const dtos = SchemaExtractor.extractObjects([mockEndpoint], ['dto']);
      expect(dtos).toHaveLength(2); // User and Address DTOs
      expect(dtos[0].name).toBe('UsersResponse');
      expect(dtos[1].name).toBe('AddressDto');
    });

    it('should handle nested objects', () => {
      const dtos = SchemaExtractor.extractObjects([mockEndpoint], ['dto']);
      const userDto = dtos.find(dto => dto.name === 'UsersResponse');
      expect(userDto?.schema.properties?.addresses?.type).toBe('array');
      expect(userDto?.schema.properties?.addresses?.items?.type).toBe('object');
    });
  });

  describe('TypeScript Generator', () => {
    it('should generate TypeScript interfaces', () => {
      const dtos = SchemaExtractor.extractObjects([mockEndpoint], ['dto']);
      const generator = createGenerator('typescript', defaultOptions);
      const code = generator.generate(dtos[0].schema, dtos[0].name);

      expect(code).toContain('export interface UsersResponse');
      expect(code).toContain('id: number');
      expect(code).toContain('name: string');
      expect(code).toContain('addresses: AddressDto[]');
    });
  });

  describe('Java Generator', () => {
    it('should generate Java classes', () => {
      const dtos = SchemaExtractor.extractObjects([mockEndpoint], ['dto']);
      const generator = createGenerator('java', defaultOptions);
      const code = generator.generate(dtos[0].schema, dtos[0].name);

      expect(code).toContain('public class UsersResponse');
      expect(code).toContain('private Double id');
      expect(code).toContain('private String name');
      expect(code).toContain('private List<AddressDto> addresses');
    });
  });

  describe('ZipGenerator', () => {
    it('should generate a ZIP file with DTOs', async () => {
      const dtos = SchemaExtractor.extractObjects([mockEndpoint], ['dto']);
      const selectedDtos = new Set(dtos.map(dto => dto.id));
      
      const zip = await ZipGenerator.generateZip(
        dtos,
        selectedDtos,
        'typescript',
        defaultOptions
      );

      expect(zip).toBeInstanceOf(Blob);
      expect(zip.type).toBe('application/zip');
    });
  });
});