import { BaseGenerator } from './base';
import { TypeScriptGenerator } from './typescript';
import { JavaGenerator } from './java';
import { DartGenerator } from './dart';
import { GoGenerator } from './go';
import { PythonGenerator } from './python';
import { CSharpGenerator } from './csharp';
import { SwiftGenerator } from './swift';
import { KotlinGenerator } from './kotlin';
import { Language, GeneratorOptions } from '../types';

export function createGenerator(language: Language, options: GeneratorOptions): BaseGenerator {
  switch (language) {
    case 'typescript':
      return new TypeScriptGenerator(options);
    case 'java':
      return new JavaGenerator(options);
    case 'dart':
      return new DartGenerator(options);
    case 'go':
      return new GoGenerator(options);
    case 'python':
      return new PythonGenerator(options);
    case 'csharp':
      return new CSharpGenerator(options);
    case 'swift':
      return new SwiftGenerator(options);
    case 'kotlin':
      return new KotlinGenerator(options);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}