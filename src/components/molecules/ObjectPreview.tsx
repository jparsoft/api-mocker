import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ObjectDefinition, Language, GeneratorOptions } from '../../utils/dtoGenerator/types';
import { createGenerator } from '../../utils/dtoGenerator/generators';

interface ObjectPreviewProps {
  object: ObjectDefinition;
  language: Language;
  options: GeneratorOptions;
  isDarkMode?: boolean;
}

export const ObjectPreview: React.FC<ObjectPreviewProps> = ({ 
  object, 
  language, 
  options,
  isDarkMode = false 
}) => {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    try {
      const generator = createGenerator(language, options);
      const generatedCode = generator.generate(object.schema, object.name);
      setCode(generatedCode);
    } catch (error) {
      setCode(`// Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [object, language, options]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{object.name}</h3>
      </div>
      <CodeMirror
        value={code}
        height="200px"
        theme={isDarkMode ? 'dark' : 'light'}
        editable={false}
        className="text-sm"
      />
    </div>
  );
};