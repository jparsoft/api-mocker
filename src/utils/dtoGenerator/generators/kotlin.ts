import { BaseGenerator } from './base';
import { JsonSchema, GeneratorOptions } from '../types';

export class KotlinGenerator implements BaseGenerator.IGenerator {
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
          return 'Boolean';
        case 'array':
          return `List<${generateType(schema.items!)}>`;
        case 'object':
          if (!schema.properties) return 'Map<String, Any>';
          return formattedClassName;
        default:
          return 'Any';
      }
    };

    const imports = useAnnotations
      ? 'import com.google.gson.annotations.SerializedName\n'
      : '';

    const fields = Object.entries(schema.properties || {})
      .map(([key, prop]) => {
        const fieldName = this.options.namingConvention === 'snake_case'
          ? BaseGenerator.toSnakeCase(key)
          : BaseGenerator.toCamelCase(key);
        const isRequired = schema.required?.includes(key);
        const type = generateType(prop);
        const annotation = useAnnotations && key !== fieldName
          ? `    @SerializedName("${key}")\n`
          : '';
        return `${annotation}    val ${fieldName}: ${type}${isRequired ? '' : '?'}`;
      })
      .join(',\n\n');

    return `${imports}
data class ${formattedClassName}(
${fields}
)`;
  }
}