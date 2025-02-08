import React, { useState } from 'react';
import { X, Search, Download, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, FileCode, Settings, FolderPlus } from 'lucide-react';
import { Button } from '../atoms/Button';
import { ApiDiscovery } from '../../utils/apiDiscovery';
import { ApiEndpoint } from '../../types/api';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { Language, LANGUAGE_CONFIGS, GeneratorOptions } from '../../utils/dtoGenerator/types';
import { createGenerator } from '../../utils/dtoGenerator/generators';

interface ApiDiscoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (endpoints: ApiEndpoint[]) => void;
}

export const ApiDiscoveryDialog: React.FC<ApiDiscoveryDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const { t } = useLanguage();
  const [baseUrl, setBaseUrl] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [showDtoOptions, setShowDtoOptions] = useState(false);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  
  // DTO Generation Options
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('typescript');
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

  const handleDiscover = async () => {
    if (!baseUrl) {
      toast.error(t('apiDiscovery.errors.noUrl'));
      return;
    }

    setIsDiscovering(true);
    setErrors([]);
    setDiscoveredEndpoints([]);
    setSelectedEndpoints(new Set());
    setExpandedEndpoints(new Set());

    try {
      const result = await ApiDiscovery.discoverApi({
        baseUrl,
        maxDepth: 5,
        includeHeaders: true,
        timeout: 10000
      });

      if (result.endpoints.length > 0) {
        setDiscoveredEndpoints(result.endpoints);
        setSelectedEndpoints(new Set(result.endpoints.map(e => e.id)));
        toast.success(t('apiDiscovery.success', { count: result.endpoints.length }));
      } else {
        toast.error(t('apiDiscovery.errors.noEndpoints'));
      }

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error(t('apiDiscovery.errors.failed'));
      setErrors([error instanceof Error ? error.message : t('message.unknownError')]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = () => {
    const selectedEndpointsList = discoveredEndpoints.filter(e => 
      selectedEndpoints.has(e.id)
    );
    onImport(selectedEndpointsList);
    onClose();
  };

  const handleCreateNewCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required');
      return;
    }

    const selectedEndpointsList = discoveredEndpoints.filter(e => 
      selectedEndpoints.has(e.id)
    );

    onImport(selectedEndpointsList);
    setShowNewCollectionDialog(false);
    onClose();
    toast.success('New collection created successfully');
  };

  const handleGenerateDTO = (endpoint: ApiEndpoint) => {
    try {
      const generator = createGenerator(selectedLanguage, options);
      const className = endpoint.path.split('/').pop() || 'Response';
      const responseBody = JSON.parse(endpoint.response.body);
      const code = generator.generate({ type: 'object', properties: responseBody }, className);
      
      // Create a blob and trigger download
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = endpoint.path.split('/').pop() || 'response';
      a.href = url;
      a.download = `${fileName}DTO${LANGUAGE_CONFIGS[selectedLanguage].extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('DTO generated successfully');
    } catch (error) {
      toast.error('Failed to generate DTO: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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

  const toggleEndpoint = (id: string) => {
    const newSelected = new Set(selectedEndpoints);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEndpoints(newSelected);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEndpoints(newExpanded);
  };

  const toggleAllEndpoints = () => {
    if (selectedEndpoints.size === discoveredEndpoints.length) {
      setSelectedEndpoints(new Set());
    } else {
      setSelectedEndpoints(new Set(discoveredEndpoints.map(e => e.id)));
    }
  };

  if (!isOpen) return null;

  const config = LANGUAGE_CONFIGS[selectedLanguage];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4">
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
                {t('apiDiscovery.title')}
              </h3>

              <div className="mt-6 space-y-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={t('apiDiscovery.urlPlaceholder')}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDtoOptions(!showDtoOptions)}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>DTO Options</span>
                  </Button>
                  <Button
                    onClick={handleDiscover}
                    disabled={isDiscovering || !baseUrl}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isDiscovering ? t('apiDiscovery.discovering') : t('apiDiscovery.discover')}
                  </Button>
                </div>

                {showDtoOptions && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Language
                        </label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={selectedLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        >
                          {Object.entries(LANGUAGE_CONFIGS).map(([value, config]) => (
                            <option 
                              key={value} 
                              value={value}
                              className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                            >
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
                          className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={options.namingConvention}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            namingConvention: e.target.value as 'PascalCase' | 'camelCase' | 'snake_case'
                          }))}
                        >
                          <option 
                            value="PascalCase"
                            className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                          >
                            PascalCase
                          </option>
                          <option 
                            value="camelCase"
                            className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                          >
                            camelCase
                          </option>
                          <option 
                            value="snake_case"
                            className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                          >
                            snake_case
                          </option>
                        </select>
                      </div>

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
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
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
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Generate validation
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          {t('apiDiscovery.errors.title')}
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <ul className="list-disc space-y-1 pl-5">
                            {errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {discoveredEndpoints.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('apiDiscovery.discoveredEndpoints', { count: discoveredEndpoints.length })}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllEndpoints}
                      >
                        {selectedEndpoints.size === discoveredEndpoints.length
                          ? t('apiDiscovery.deselectAll')
                          : t('apiDiscovery.selectAll')}
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600">
                      {discoveredEndpoints.map((endpoint) => (
                        <div
                          key={endpoint.id}
                          className="border-b border-gray-200 last:border-b-0 dark:border-gray-600"
                        >
                          <div
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <button
                              onClick={() => toggleExpanded(endpoint.id)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {expandedEndpoints.has(endpoint.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedEndpoints.has(endpoint.id)}
                              onChange={() => toggleEndpoint(endpoint.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`rounded px-2 py-1 text-xs font-medium ${
                                  endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                }`}>
                                  {endpoint.method}
                                </span>
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                  {endpoint.path}
                                </span>
                              </div>
                              {endpoint.description && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {endpoint.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateDTO(endpoint)}
                                title="Generate DTO"
                              >
                                <FileCode className="h-4 w-4" />
                              </Button>
                              <span className={`rounded px-2 py-1 text-xs font-medium ${
                                endpoint.response.status >= 200 && endpoint.response.status < 300
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {endpoint.response.status}
                              </span>
                              {endpoint.response.status >= 200 && endpoint.response.status < 300 && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </div>
                          {expandedEndpoints.has(endpoint.id) && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Response Headers
                                  </h5>
                                  <div className="mt-2 rounded-md bg-white p-3 text-sm dark:bg-gray-800">
                                    {endpoint.headers.map((header, index) => (
                                      <div key={index} className="text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">{header.key}:</span> {header.value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Response Body
                                  </h5>
                                  <div className="mt-2">
                                    <CodeMirror
                                      value={endpoint.response.body}
                                      height="200px"
                                      extensions={[json()]}
                                      editable={false}
                                      theme="light"
                                      className="rounded-md border border-gray-200 dark:border-gray-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button variant="secondary" onClick={onClose}>
                        {t('action.cancel')}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowNewCollectionDialog(true)}
                        disabled={selectedEndpoints.size === 0}
                      >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Create New Collection
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={selectedEndpoints.size === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('apiDiscovery.import', { count: selectedEndpoints.size })}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Collection Dialog */}
      {showNewCollectionDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Create New Collection
                  </h3>
                  <div className="mt-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700">
                          Collection Name
                        </label>
                        <input
                          type="text"
                          id="collection-name"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Enter collection name"
                        />
                      </div>
                      <div>
                        <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="collection-description"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={newCollectionDescription}
                          onChange={(e) => setNewCollectionDescription(e.target.value)}
                          placeholder="Enter collection description"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Button
                      onClick={handleCreateNewCollection}
                      className="w-full sm:ml-3 sm:w-auto"
                    >
                      Create Collection
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowNewCollectionDialog(false)}
                      className="mt-3 w-full sm:mt-0 sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};