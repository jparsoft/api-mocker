import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class SwiftGenerator implements BaseGenerator.IGenerator {
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
          return 'String';
        case 'number':
          return 'Double';
        case 'boolean':
          return 'Bool';
        case 'array':
          return `[${generateType(schema.items!)}]`;
        case 'object':
          if (!schema.properties) return '[String: Any]';
          return formattedClassName;
        default:
          return 'Any';
      }
    };

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toCamelCase(key);
        const isRequired = schema.required?.includes(key);
        const type = generateType(prop);
        const codingKey = useAnnotations && key !== fieldName ? `        case ${fieldName} = "${key}"` : '';
        return `    let ${fieldName}: ${type}${isRequired ? '' : '?'}${codingKey ? '\n' + codingKey : ''}`;
      })
      .join('\n\n');

    const codingKeys = useAnnotations
      ? `\n    enum CodingKeys: String, CodingKey {
${Object.keys(schema.properties || {})
  .map(key => {
    const fieldName = this.options.namingConvention === 'snake_case'
      ? BaseGenerator.toSnakeCase(key)
      : BaseGenerator.toCamelCase(key);
    return `        case ${fieldName}${key !== fieldName ? ` = "${key}"` : ''}`;
  })
  .join('\n')}
    }`
      : '';

    return `struct ${formattedClassName}: Codable {
${fields}${codingKeys}
}`;
  }
}