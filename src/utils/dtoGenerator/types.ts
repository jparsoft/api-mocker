export type Language = 
  | 'typescript'
  | 'java'
  | 'dart'
  | 'go'
  | 'python'
  | 'csharp'
  | 'swift'
  | 'kotlin';

export type ObjectType = 'dto' | 'poco' | 'bo' | 'dao';

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  format?: string;
  ref?: string;
  additionalProperties?: boolean | JsonSchema;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validations?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
  value?: any;
  message?: string;
  customValidator?: string;
}

export interface ObjectDefinition {
  id: string;
  name: string;
  schema: JsonSchema;
  type: ObjectType;
  source: {
    endpointId: string;
    path: string;
    method: string;
    type: 'request' | 'response';
  };
  dependencies: string[];
  validations?: ValidationRule[];
  businessRules?: BusinessRule[];
  daoOperations?: DaoOperation[];
}

export interface BusinessRule {
  name: string;
  description: string;
  code: string;
  async: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
  }[];
  returnType?: string;
}

export interface DaoOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'list' | 'custom';
  name: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
  }[];
  returnType?: string;
  query?: string;
  customImplementation?: string;
}

export interface GeneratorOptions {
  useAnnotations: boolean;
  useLombok?: boolean;
  useJsonSerializable?: boolean;
  useSystemTextJson?: boolean;
  namingConvention: 'PascalCase' | 'camelCase' | 'snake_case';
  prefix?: string;
  suffix?: string;
  generateValidation?: boolean;
  generateBuilders?: boolean;
  generateFactoryMethods?: boolean;
  generateEqualsAndHash?: boolean;
  generateToString?: boolean;
  generateComments?: boolean;
  generateNullChecks?: boolean;
  objectTypes: ObjectType[];
  ormFramework?: string;
  validationFramework?: string;
  businessLogicLayer?: {
    baseClass?: string;
    interfaces?: string[];
    dependencyInjection?: boolean;
  };
  dataAccessLayer?: {
    baseRepository?: string;
    connectionString?: string;
    transactionSupport?: boolean;
  };
}

export interface LanguageConfig {
  name: string;
  extension: string;
  options: {
    annotations: boolean;
    lombok?: boolean;
    jsonSerializable?: boolean;
    systemTextJson?: boolean;
    validation?: boolean;
    builders?: boolean;
    factoryMethods?: boolean;
    equalsAndHash?: boolean;
    toString?: boolean;
    comments?: boolean;
    nullChecks?: boolean;
    supportedObjectTypes: ObjectType[];
    supportedOrmFrameworks?: string[];
    supportedValidationFrameworks?: string[];
  };
}

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  typescript: {
    name: 'TypeScript',
    extension: '.ts',
    options: {
      annotations: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: false,
      toString: false,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['typeorm', 'prisma', 'sequelize'],
      supportedValidationFrameworks: ['class-validator', 'zod', 'yup']
    }
  },
  java: {
    name: 'Java',
    extension: '.java',
    options: {
      annotations: true,
      lombok: true,
      validation: true,
      builders: true,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['hibernate', 'jpa', 'spring-data'],
      supportedValidationFrameworks: ['javax.validation', 'hibernate-validator']
    }
  },
  dart: {
    name: 'Dart',
    extension: '.dart',
    options: {
      annotations: true,
      jsonSerializable: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['floor', 'drift', 'moor'],
      supportedValidationFrameworks: ['form_validator']
    }
  },
  go: {
    name: 'Go',
    extension: '.go',
    options: {
      annotations: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: false,
      toString: false,
      comments: true,
      nullChecks: false,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['gorm', 'ent'],
      supportedValidationFrameworks: ['validator']
    }
  },
  python: {
    name: 'Python',
    extension: '.py',
    options: {
      annotations: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['sqlalchemy', 'django-orm', 'peewee'],
      supportedValidationFrameworks: ['pydantic', 'marshmallow']
    }
  },
  csharp: {
    name: 'C#',
    extension: '.cs',
    options: {
      annotations: true,
      systemTextJson: true,
      validation: true,
      builders: true,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['entity-framework', 'dapper', 'nhibernate'],
      supportedValidationFrameworks: ['data-annotations', 'fluent-validation']
    }
  },
  swift: {
    name: 'Swift',
    extension: '.swift',
    options: {
      annotations: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['core-data', 'realm'],
      supportedValidationFrameworks: ['swift-validations']
    }
  },
  kotlin: {
    name: 'Kotlin',
    extension: '.kt',
    options: {
      annotations: true,
      validation: true,
      builders: false,
      factoryMethods: true,
      equalsAndHash: true,
      toString: true,
      comments: true,
      nullChecks: true,
      supportedObjectTypes: ['dto', 'poco', 'bo', 'dao'],
      supportedOrmFrameworks: ['room', 'exposed', 'ktorm'],
      supportedValidationFrameworks: ['kotlin-validation']
    }
  }
};