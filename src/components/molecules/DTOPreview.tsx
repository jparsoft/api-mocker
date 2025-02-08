import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { DTODefinition, Language, GeneratorOptions } from '../../utils/dtoGenerator/types';
import { createGenerator } from '../../utils/dtoGenerator/generators';

interface DTOPreviewProps {
  dto: DTODefinition;
  language: Language;
  options: GeneratorOptions;
}

export const DTOPreview: React.FC<DTOPreviewProps> = ({ dto, language, options }) => {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    try {
      const generator = createGenerator(language, options);
      const generatedCode = generator.generate(dto.schema, dto.name);
      setCode(generatedCode);
    } catch (error) {
      setCode(`// Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dto, language, options]);

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">{dto.name}</h3>
      </div>
      <CodeMirror
        value={code}
        height="200px"
        theme="light"
        editable={false}
        className="text-sm"
      />
    </div>
  );
};