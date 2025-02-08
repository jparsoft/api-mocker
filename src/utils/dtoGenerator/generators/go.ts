import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class GoGenerator implements BaseGenerator.IGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generate(schema: JsonSchema, className: string): string {
    const { useAnnotations } = this.options;
    const formattedClassName = BaseGenerator.formatName(className, this.options);

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
          return formattedClassName;
        default:
          return 'interface{}';
      }
    };

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toPascalCase(key);
        const tag = useAnnotations ? ` \`json:"${key}"\`` : '';
        return `    ${fieldName} ${generateType(prop)}${tag}`;
      })
      .join('\n');

    return `package models

type ${formattedClassName} struct {
${fields}
}`;
  }
}