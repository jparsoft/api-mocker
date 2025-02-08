import JSZip from 'jszip/dist/jszip.min.js';
import { DTODefinition, Language, GeneratorOptions, LANGUAGE_CONFIGS } from './types';
import { createGenerator } from './generators';

export class ZipGenerator {
  static async generateZip(
    dtos: DTODefinition[],
    selectedDtoIds: Set<string>,
    language: Language,
    options: GeneratorOptions
  ): Promise<Blob> {
    const generator = createGenerator(language, options);
    const extension = LANGUAGE_CONFIGS[language].extension;
    const zip = new JSZip();
    
    // Generate all DTOs first to ensure dependencies are handled
    const generatedDtos = new Map<string, string>();
    const orderedDtos = this.orderDtosByDependency(dtos);
    
    for (const dto of orderedDtos) {
      if (selectedDtoIds.has(dto.id)) {
        const code = generator.generate(dto.schema, dto.name);
        generatedDtos.set(dto.id, code);
      }
    }

    // Add files to the ZIP
    for (const dto of orderedDtos) {
      if (selectedDtoIds.has(dto.id)) {
        const code = generatedDtos.get(dto.id)!;
        const fileName = `${dto.name}${extension}`;
        zip.file(fileName, code);
      }
    }

    // Generate the ZIP file
    return await zip.generateAsync({ type: "blob" });
  }

  private static orderDtosByDependency(dtos: DTODefinition[]): DTODefinition[] {
    const visited = new Set<string>();
    const ordered: DTODefinition[] = [];

    const visit = (dto: DTODefinition) => {
      if (visited.has(dto.id)) return;
      visited.add(dto.id);

      // Visit dependencies first
      for (const depId of dto.dependencies) {
        const dep = dtos.find(d => d.id === depId);
        if (dep) visit(dep);
      }

      ordered.push(dto);
    };

    // Visit all DTOs
    for (const dto of dtos) {
      visit(dto);
    }

    return ordered;
  }
}