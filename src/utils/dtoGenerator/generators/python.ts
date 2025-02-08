import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class PythonGenerator implements BaseGenerator.IGenerator {
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
          return 'str';
        case 'number':
          return 'float';
        case 'boolean':
          return 'bool';
        case 'array':
          return `List[${generateType(schema.items!)}]`;
        case 'object':
          if (!schema.properties) return 'Dict[str, Any]';
          return formattedClassName;
        default:
          return 'Any';
      }
    };

    const imports = [
      'from typing import List, Dict, Optional, Any',
      'from pydantic import BaseModel, Field'
    ].join('\n');

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : key;
        const isRequired = schema.required?.includes(key);
        const type = isRequired ? generateType(prop) : `Optional[${generateType(prop)}]`;
        const field = useAnnotations ? `Field(alias="${key}")` : 'Field()';
        return `    ${fieldName}: ${type} = ${field}`;
      })
      .join('\n');

    return `${imports}

class ${formattedClassName}(BaseModel):
${fields}

    class Config:
        allow_population_by_field_name = True`;
  }
}