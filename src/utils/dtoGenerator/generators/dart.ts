import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class DartGenerator implements BaseGenerator.IGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generate(schema: JsonSchema, className: string): string {
    const { useAnnotations, useJsonSerializable } = this.options;
    const formattedClassName = BaseGenerator.formatName(className, this.options);

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
          return formattedClassName;
        default:
          return 'dynamic';
      }
    };

    const imports = [
      useJsonSerializable ? 'import \'package:json_annotation/json_annotation.dart\';' : null,
      useJsonSerializable ? `part '${BaseGenerator.toSnakeCase(className)}.g.dart\';` : null
    ].filter(Boolean).join('\n');

    const classAnnotations = [
      useJsonSerializable ? '@JsonSerializable()' : ''
    ].filter(Boolean).join('\n');

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toCamelCase(key);
        const annotations = useAnnotations ? `  @JsonKey(name: '${key}')` : '';
        return `${annotations}\n  final ${generateType(prop)} ${fieldName};`;
      })
      .join('\n\n');

    const constructor = `
  const ${formattedClassName}({
${Object.keys(schema.properties || {})
  .map(key => {
    const fieldName = this.options.namingConvention === 'snake_case'
      ? BaseGenerator.toSnakeCase(key)
      : BaseGenerator.toCamelCase(key);
    return `    required this.${fieldName},`;
  })
  .join('\n')}
  });`;

    const serialization = useJsonSerializable
      ? `
  factory ${formattedClassName}.fromJson(Map<String, dynamic> json) => 
      _$${formattedClassName}FromJson(json);

  Map<String, dynamic> toJson() => _$${formattedClassName}ToJson(this);`
      : '';

    return `${imports}

${classAnnotations}
class ${formattedClassName} {
${fields}
${constructor}
${serialization}
}`;
  }
}