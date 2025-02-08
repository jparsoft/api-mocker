import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class CSharpGenerator implements BaseGenerator.IGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generate(schema: JsonSchema, className: string): string {
    const { useAnnotations, useSystemTextJson } = this.options;
    const formattedClassName = BaseGenerator.formatName(className, this.options);

    const generateType = (schema: JsonSchema): string => {
      switch (schema.type) {
        case 'string':
          return 'string';
        case 'number':
          return 'double';
        case 'boolean':
          return 'bool';
        case 'array':
          return `List<${generateType(schema.items!)}>`;
        case 'object':
          if (!schema.properties) return 'Dictionary<string, object>';
          return formattedClassName;
        default:
          return 'object';
      }
    };

    const imports = [
      'using System;',
      'using System.Collections.Generic;',
      useSystemTextJson ? 'using System.Text.Json.Serialization;' : 'using Newtonsoft.Json;'
    ].join('\n');

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toPascalCase(key);
        const isRequired = schema.required?.includes(key);
        const type = isRequired ? generateType(prop) : `${generateType(prop)}?`;
        const attribute = useAnnotations
          ? useSystemTextJson
            ? `    [JsonPropertyName("${key}")]`
            : `    [JsonProperty("${key}")]`
          : '';
        return `${attribute}\n    public ${type} ${fieldName} { get; set; }`;
      })
      .join('\n\n');

    return `${imports}

public class ${formattedClassName}
{
${fields}
}`;
  }
}