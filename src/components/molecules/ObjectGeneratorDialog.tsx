import React, { useState, useEffect } from 'react';
import { Download, X, Eye, Settings, Database, Code, FileCode, Copy, Check } from 'lucide-react';
import { ApiEndpoint } from '../../types/api';
import { Button } from '../atoms/Button';
import { 
  Language, 
  LANGUAGE_CONFIGS,
  ObjectDefinition,
  GeneratorOptions,
  ObjectType
} from '../../utils/dtoGenerator/types';
import { SchemaExtractor } from '../../utils/dtoGenerator/extractors';
import { ObjectPreview } from './ObjectPreview';
import { toast } from 'sonner';
import { ZipGenerator } from '../../utils/dtoGenerator/zipGenerator';

interface ObjectGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  endpoints: ApiEndpoint[];
}

const OBJECT_TYPE_ICONS = {
  dto: FileCode,
  poco: Code,
  bo: Code,
  dao: Database
};

const OBJECT_TYPE_LABELS = {
  dto: 'Data Transfer Object',
  poco: 'Plain Old CLR Object',
  bo: 'Business Object',
  dao: 'Data Access Object'
};

export const ObjectGeneratorDialog: React.FC<ObjectGeneratorDialogProps> = ({
  isOpen,
  onClose,
  endpoints,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('typescript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [objects, setObjects] = useState<ObjectDefinition[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedObjectTypes, setSelectedObjectTypes] = useState<Set<ObjectType>>(new Set(['dto']));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedObjects, setCopiedObjects] = useState<Set<string>>(new Set());
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
      const extractedObjects = SchemaExtractor.extractObjects(endpoints, Array.from(selectedObjectTypes));
      setObjects(extractedObjects);
      setSelectedObjects(new Set(extractedObjects.map(obj => obj.id)));
    }
  }, [isOpen, endpoints, selectedObjectTypes]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    const config = LANGUAGE_CONFIGS[language];
    
    const supportedTypes = new Set(
      Array.from(selectedObjectTypes).filter(type => 
        config.options.supportedObjectTypes.includes(type)
      )
    );
    if (supportedTypes.size === 0 && config.options.supportedObjectTypes.length > 0) {
      supportedTypes.add(config.options.supportedObjectTypes[0]);
    }
    setSelectedObjectTypes(supportedTypes);

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
      objectTypes: Array.from(supportedTypes)
    }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      const zip = await ZipGenerator.generateZip(
        objects,
        selectedObjects,
        selectedLanguage,
        options
      );

      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `generated-objects-${selectedLanguage}-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Objects generated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to generate objects: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async (objectId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedObjects(prev => new Set([...prev, objectId]));
      setTimeout(() => {
        setCopiedObjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(objectId);
          return newSet;
        });
      }, 2000);
      toast.success('Code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const toggleObject = (objectId: string) => {
    const newSelected = new Set(selectedObjects);
    if (newSelected.has(objectId)) {
      newSelected.delete(objectId);
    } else {
      newSelected.add(objectId);
    }
    setSelectedObjects(newSelected);
  };

  const toggleObjectType = (type: ObjectType) => {
    const newSelected = new Set(selectedObjectTypes);
    if (newSelected.has(type)) {
      if (newSelected.size > 1) {
        newSelected.delete(type);
      }
    } else {
      newSelected.add(type);
    }
    setSelectedObjectTypes(newSelected);
    setOptions(prev => ({
      ...prev,
      objectTypes: Array.from(newSelected)
    }));
  };

  if (!isOpen) return null;

  const config = LANGUAGE_CONFIGS[selectedLanguage];

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-6xl sm:p-6 sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4 flex items-center space-x-4">
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:hover:bg-gray-700"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                Generate Objects
              </h3>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Naming Convention
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Object Types
                  </label>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {config.options.supportedObjectTypes.map(type => {
                      const Icon = OBJECT_TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => toggleObjectType(type)}
                          className={`flex items-center justify-center space-x-2 rounded-lg border p-4 text-sm transition-colors ${
                            selectedObjectTypes.has(type)
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{OBJECT_TYPE_LABELS[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-6">
                      {/* Framework Selection */}
                      {config.options.supportedOrmFrameworks && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            ORM Framework
                          </label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={options.ormFramework}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              ormFramework: e.target.value
                            }))}
                          >
                            <option value="">None</option>
                            {config.options.supportedOrmFrameworks.map(framework => (
                              <option key={framework} value={framework}>
                                {framework}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {config.options.supportedValidationFrameworks && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Validation Framework
                          </label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={options.validationFramework}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              validationFramework: e.target.value
                            }))}
                          >
                            <option value="">None</option>
                            {config.options.supportedValidationFrameworks.map(framework => (
                              <option key={framework} value={framework}>
                                {framework}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Feature Toggles */}
                      <div className="grid grid-cols-2 gap-4">
                        {config.options.annotations && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                              checked={options.useAnnotations}
                              onChange={(e) => setOptions(prev => ({
                                ...prev,
                                useAnnotations: e.target.checked
                              }))}
                            />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                              Include annotations
                            </span>
                          </label>
                        )}

                        {config.options.validation && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                              checked={options.generateValidation}
                              onChange={(e) => setOptions(prev => ({
                                ...prev,
                                generateValidation: e.target.checked
                              }))}
                            />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                              Generate validation
                            </span>
                          </label>
                        )}

                        {/* Add other feature toggles here */}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available Objects
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

                  <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600">
                    {objects.map((obj) => (
                      <div
                        key={obj.id}
                        className="flex items-center space-x-3 border-b border-gray-200 px-4 py-3 last:border-b-0 dark:border-gray-600"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          checked={selectedObjects.has(obj.id)}
                          onChange={() => toggleObject(obj.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {React.createElement(OBJECT_TYPE_ICONS[obj.type], {
                              className: "h-4 w-4 text-gray-500 dark:text-gray-400"
                            })}
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {obj.name}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {obj.source.method} {obj.source.path}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {showPreview && selectedObjects.size > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h4>
                    {Array.from(selectedObjects).map(objectId => {
                      const obj = objects.find(o => o.id === objectId);
                      if (!obj) return null;
                      return (
                        <div key={obj.id} className="relative">
                          <button
                            onClick={() => handleCopyCode(obj.id, obj.schema.toString())}
                            className="absolute right-2 top-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:hover:bg-gray-700"
                          >
                            {copiedObjects.has(obj.id) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <ObjectPreview
                            object={obj}
                            language={selectedLanguage}
                            options={options}
                            isDarkMode={isDarkMode}
                          />
                        </div>
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
                    disabled={isGenerating || selectedObjects.size === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Objects'}
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