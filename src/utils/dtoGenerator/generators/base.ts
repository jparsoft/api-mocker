import { GeneratorOptions, JsonSchema } from '../types';

export namespace BaseGenerator {
  export interface IGenerator {
    generate(schema: JsonSchema, className: string): string;
  }

  export function toPascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }

  export function toCamelCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toLowerCase());
  }

  export function toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  export function formatName(name: string, options: GeneratorOptions): string {
    const { namingConvention, prefix = '', suffix = '' } = options;
    let formatted = name;

    switch (namingConvention) {
      case 'PascalCase':
        formatted = toPascalCase(formatted);
        break;
      case 'camelCase':
        formatted = toCamelCase(formatted);
        break;
      case 'snake_case':
        formatted = toSnakeCase(formatted);
        break;
    }

    return `${prefix}${formatted}${suffix}`;
  }
}