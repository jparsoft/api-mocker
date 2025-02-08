import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class JavaGenerator implements BaseGenerator.IGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generate(schema: JsonSchema, className: string): string {
    const { useAnnotations, useLombok } = this.options;
    const formattedClassName = BaseGenerator.formatName(className, this.options);

    const generateType = (schema: JsonSchema): string => {
      switch (schema.type) {
        case 'string':
          return 'String';
        case 'number':
          return 'Double';
        case 'boolean':
          return 'Boolean';
        case 'array':
          return `List<${generateType(schema.items!)}>`;
        case 'object':
          if (!schema.properties) return 'Map<String, Object>';
          return formattedClassName;
        default:
          return 'Object';
      }
    };

    const imports = [
      'import java.util.*;',
      useAnnotations ? 'import com.fasterxml.jackson.annotation.*;' : null,
      useLombok ? 'import lombok.*;' : null
    ].filter(Boolean).join('\n');

    const classAnnotations = [
      useLombok ? '@Data' : '',
      useLombok ? '@Builder' : '',
      useLombok ? '@NoArgsConstructor' : '',
      useLombok ? '@AllArgsConstructor' : '',
      useAnnotations ? '@JsonIgnoreProperties(ignoreUnknown = true)' : ''
    ].filter(Boolean).join('\n');

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toCamelCase(key);
        const annotations = useAnnotations ? `    @JsonProperty("${key}")` : '';
        return `${annotations}\n    private ${generateType(prop)} ${fieldName};`;
      })
      .join('\n\n');

    const gettersSetters = !useLombok
      ? Object.entries(schema.properties || {})
          .map(([key, prop]) => {
            const fieldName = this.options.namingConvention === 'snake_case'
              ? BaseGenerator.toSnakeCase(key)
              : BaseGenerator.toCamelCase(key);
            const pascalKey = BaseGenerator.toPascalCase(key);
            const type = generateType(prop);
            return `
    public ${type} get${pascalKey}() {
        return ${fieldName};
    }

    public void set${pascalKey}(${type} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join('\n\n')
      : '';

    return `${imports}

${classAnnotations}
public class ${formattedClassName} {
${fields}
${gettersSetters}
}`; // Fixed: Removed extra backtick and added proper closing brace
  }
}