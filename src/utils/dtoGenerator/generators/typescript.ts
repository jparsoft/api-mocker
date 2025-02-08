import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class TypeScriptGenerator implements BaseGenerator.IGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generate(schema: JsonSchema, className: string): string {
    const { useAnnotations } = this.options;
    const formattedClassName = BaseGenerator.formatName(className, this.options);

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
            .map(([key, prop]) => {
              const fieldName = this.options.namingConvention === 'snake_case' 
                ? BaseGenerator.toSnakeCase(key) 
                : key;
              const decorator = useAnnotations 
                ? `  @JsonProperty('${key}')\n  ` 
                : '  ';
              return `${decorator}${fieldName}${schema.required?.includes(key) ? '' : '?'}: ${generateType(prop, indent + '  ')};`;
            })
            .join('\n')}\n${indent}}`;
        default:
          return 'any';
      }
    };

    const imports = useAnnotations 
      ? 'import { JsonProperty } from "json-typescript-mapper";\n\n'
      : '';

    return `${imports}export interface ${formattedClassName} ${generateType(schema, '')}`;
  }
}