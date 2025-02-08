import React, { useState, useEffect } from 'react';
import { Download, X, Eye, Settings } from 'lucide-react';
import { ApiEndpoint } from '../../types/api';
import { Button } from '../atoms/Button';
import { 
  Language, 
  LANGUAGE_CONFIGS, 
  DTODefinition, 
  GeneratorOptions 
} from '../../utils/dtoGenerator/types';
import { SchemaExtractor } from '../../utils/dtoGenerator/extractors';
import { DTOPreview } from './DTOPreview';
import { toast } from 'sonner';
import { ZipGenerator } from '../../utils/dtoGenerator/zipGenerator';

interface DTOGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  endpoints: ApiEndpoint[];
}

export const DTOGeneratorDialog: React.FC<DTOGeneratorDialogProps> = ({
  isOpen,
  onClose,
  endpoints,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('typescript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dtos, setDtos] = useState<DTODefinition[]>([]);
  const [selectedDtos, setSelectedDtos] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>({
    useAnnotations: true,
    namingConvention: 'PascalCase',
    generateValidation: true,
    generateBuilders: false,
    generateFactoryMethods: true,
    generateEqualsAndHash: true,
    generateToString: true,
    generateComments: true,
    generateNullChecks: true,
    objectTypes: ['dto']
  });

  useEffect(() => {
    if (isOpen) {
      const extractedDtos = SchemaExtractor.extractObjects(endpoints, ['dto']);
      setDtos(extractedDtos);
      setSelectedDtos(new Set(extractedDtos.map(dto => dto.id)));
    }
  }, [isOpen, endpoints]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    const config = LANGUAGE_CONFIGS[language];
    setOptions(prev => ({
      ...prev,
      useAnnotations: config.options.annotations,
      useLombok: config.options.lombok,
      useJsonSerializable: config.options.jsonSerializable,
      useSystemTextJson: config.options.systemTextJson,
      generateValidation: config.options.validation,
      generateBuilders: config.options.builders || false,
      generateFactoryMethods: config.options.factoryMethods || false,
      generateEqualsAndHash: config.options.equalsAndHash || false,
      generateToString: config.options.toString || false,
      generateComments: config.options.comments || true,
      generateNullChecks: config.options.nullChecks || false,
    }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      const zip = await ZipGenerator.generateZip(
        dtos,
        selectedDtos,
        selectedLanguage,
        options
      );

      // Create and trigger download
      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `dtos-${selectedLanguage}-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('DTOs generated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to generate DTOs: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDto = (dtoId: string) => {
    const newSelected = new Set(selectedDtos);
    if (newSelected.has(dtoId)) {
      newSelected.delete(dtoId);
    } else {
      newSelected.add(dtoId);
    }
    setSelectedDtos(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Generate DTOs
              </h3>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    >
                      {Object.entries(LANGUAGE_CONFIGS).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Naming Convention
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={options.namingConvention}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        namingConvention: e.target.value as 'PascalCase' | 'camelCase' | 'snake_case'
                      }))}
                    >
                      <option value="PascalCase">PascalCase</option>
                      <option value="camelCase">camelCase</option>
                      <option value="snake_case">snake_case</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {LANGUAGE_CONFIGS[selectedLanguage].options.annotations && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.useAnnotations}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              useAnnotations: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Include serialization annotations
                          </span>
                        </label>
                      )}

                      {LANGUAGE_CONFIGS[selectedLanguage].options.validation && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateValidation}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateValidation: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate validation
                          </span>
                        </label>
                      )}

                      {LANGUAGE_CONFIGS[selectedLanguage].options.builders && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateBuilders}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateBuilders: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate builders
                          </span>
                        </label>
                      )}

                      {LANGUAGE_CONFIGS[selectedLanguage].options.factoryMethods && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateFactoryMethods}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateFactoryMethods: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate factory methods
                          </span>
                        </label>
                      )}

                      {LANGUAGE_CONFIGS[selectedLanguage].options.equalsAndHash && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateEqualsAndHash}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateEqualsAndHash: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate equals and hash
                          </span>
                        </label>
                      )}

                      {LANGUAGE_CONFIGS[selectedLanguage].options.toString && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateToString}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateToString: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate toString
                          </span>
                        </label>
                      )}

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={options.generateComments}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            generateComments: e.target.checked
                          }))}
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Generate comments
                        </span>
                      </label>

                      {LANGUAGE_CONFIGS[selectedLanguage].options.nullChecks && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={options.generateNullChecks}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              generateNullChecks: e.target.checked
                            }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Generate null checks
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                      Available DTOs
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>

                  <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200">
                    {dtos.map((dto) => (
                      <div
                        key={dto.id}
                        className="flex items-center space-x-3 border-b border-gray-200 px-4 py-3 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedDtos.has(dto.id)}
                          onChange={() => toggleDto(dto.id)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dto.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dto.source.method} {dto.source.path}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {showPreview && selectedDtos.size > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                    {Array.from(selectedDtos).map(dtoId => {
                      const dto = dtos.find(d => d.id === dtoId);
                      if (!dto) return null;
                      return (
                        <DTOPreview
                          key={dto.id}
                          dto={dto}
                          language={selectedLanguage}
                          options={options}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedDtos.size === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate DTOs'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};