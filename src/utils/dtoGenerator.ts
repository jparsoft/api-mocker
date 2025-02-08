import { ApiEndpoint } from '../types/api';

type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
};

export type Language = 'typescript' | 'java' | 'dart' | 'go';

export class DTOGenerator {
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

  private static toPascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }

  private static toCamelCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toLowerCase());
  }

  private static generateTypeScript(schema: JsonSchema, className: string): string {
    const generateType = (schema: JsonSchema, indent = ''): string => {
      switch (schema.type) {
        case 'string':
          return 'string';
        case 'number':
          return 'number';
        case 'boolean':
          return 'boolean';
        case 'array':
          return `${generateType(schema.items!, indent)}[]`;
        case 'object':
          if (!schema.properties) return 'Record<string, any>';
          return `{\n${Object.entries(schema.properties)
            .map(([key, prop]) => `${indent}  ${key}${schema.required?.includes(key) ? '' : '?'}: ${generateType(prop, indent + '  ')};`)
            .join('\n')}\n${indent}}`;
        default:
          return 'any';
      }
    };

    return `export interface ${className} ${generateType(schema, '')}`;
  }

  private static generateJava(schema: JsonSchema, className: string): string {
    const imports = new Set<string>();
    
    const generateType = (schema: JsonSchema): string => {
      switch (schema.type) {
        case 'string':
          return 'String';
        case 'number':
          return 'Double';
        case 'boolean':
          return 'Boolean';
        case 'array':
          imports.add('java.util.List');
          return `List<${generateType(schema.items!)}>`;
        case 'object':
          if (!schema.properties) return 'Map<String, Object>';
          return this.toPascalCase(className);
        default:
          return 'Object';
      }
    };

    const generateClass = (schema: JsonSchema, className: string): string => {
      if (schema.type !== 'object' || !schema.properties) return '';

      const fields = Object.entries(schema.properties).map(([key, prop]) => {
        const type = generateType(prop);
        const fieldName = this.toCamelCase(key);
        return `    private ${type} ${fieldName};`;
      }).join('\n');

      const gettersSetters = Object.entries(schema.properties).map(([key, prop]) => {
        const type = generateType(prop);
        const fieldName = this.toCamelCase(key);
        const pascalKey = this.toPascalCase(key);
        return `
    public ${type} get${pascalKey}() {
        return ${fieldName};
    }

    public void set${pascalKey}(${type} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
      }).join('\n');

      return `
public class ${className} {
${fields}
${gettersSetters}
}`;
    };

    const importStatements = Array.from(imports).map(imp => `import ${imp};`).join('\n');
    return `${importStatements}\n${generateClass(schema, className)}`;
  }

  private static generateDart(schema: JsonSchema, className: string): string {
    const generateType = (schema: JsonSchema): string => {
      switch (schema.type) {
        case 'string':
          return 'String';
        case 'number':
          return 'double';
        case 'boolean':
          return 'bool';
        case 'array':
          return `List<${generateType(schema.items!)}>`;
        case 'object':
          if (!schema.properties) return 'Map<String, dynamic>';
          return this.toPascalCase(className);
        default:
          return 'dynamic';
      }
    };

    const generateClass = (schema: JsonSchema, className: string): string => {
      if (schema.type !== 'object' || !schema.properties) return '';

      const fields = Object.entries(schema.properties)
        .map(([key, prop]) => `  final ${generateType(prop)} ${this.toCamelCase(key)};`)
        .join('\n');

      const constructorParams = Object.entries(schema.properties)
        .map(([key]) => `    required this.${this.toCamelCase(key)},`)
        .join('\n');

      const fromJson = Object.entries(schema.properties)
        .map(([key]) => `      ${this.toCamelCase(key)}: json['${key}'],`)
        .join('\n');

      const toJson = Object.entries(schema.properties)
        .map(([key]) => `      '${key}': ${this.toCamelCase(key)},`)
        .join('\n');

      return `
class ${className} {
${fields}

  const ${className}({
${constructorParams}
  });

  factory ${className}.fromJson(Map<String, dynamic> json) => ${className}(
${fromJson}
  );

  Map<String, dynamic> toJson() => {
${toJson}
  };
}`;
    };

    return generateClass(schema, className);
  }

  private static generateGo(schema: JsonSchema, className: string): string {
    const generateType = (schema: JsonSchema): string => {
      switch (schema.type) {
        case 'string':
          return 'string';
        case 'number':
          return 'float64';
        case 'boolean':
          return 'bool';
        case 'array':
          return `[]${generateType(schema.items!)}`;
        case 'object':
          if (!schema.properties) return 'map[string]interface{}';
          return this.toPascalCase(className);
        default:
          return 'interface{}';
      }
    };

    const generateStruct = (schema: JsonSchema, className: string): string => {
      if (schema.type !== 'object' || !schema.properties) return '';

      const fields = Object.entries(schema.properties)
        .map(([key, prop]) => `    ${this.toPascalCase(key)} ${generateType(prop)} \`json:"${key}"\``)
        .join('\n');

      return `
type ${className} struct {
${fields}
}`;
    };

    return generateStruct(schema, className);
  }

  static generateDTOs(endpoint: ApiEndpoint, language: Language): string {
    try {
      const responseBody = JSON.parse(endpoint.response.body);
      const schema = this.extractJsonSchema(responseBody);
      const className = this.toPascalCase(endpoint.path.split('/').pop() || 'Response');

      switch (language) {
        case 'typescript':
          return this.generateTypeScript(schema, className);
        case 'java':
          return this.generateJava(schema, className);
        case 'dart':
          return this.generateDart(schema, className);
        case 'go':
          return this.generateGo(schema, className);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      console.error('Failed to generate DTO:', error);
      throw new Error('Failed to generate DTO: Invalid JSON response body');
    }
  }

  static generateZip(endpoints: ApiEndpoint[], language: Language): Blob {
    const files: { name: string; content: string }[] = [];
    const fileExtensions: Record<Language, string> = {
      typescript: '.ts',
      java: '.java',
      dart: '.dart',
      go: '.go'
    };

    endpoints.forEach(endpoint => {
      try {
        const className = this.toPascalCase(endpoint.path.split('/').pop() || 'Response');
        const content = this.generateDTOs(endpoint, language);
        files.push({
          name: `${className}${fileExtensions[language]}`,
          content
        });
      } catch (error) {
        console.warn(`Skipping DTO generation for ${endpoint.path}:`, error);
      }
    });

    // Create a simple ZIP file
    const zip = new Blob(
      [files.map(f => `// ${f.name}\n${f.content}\n`).join('\n\n')],
      { type: 'application/zip' }
    );

    return zip;
  }
}