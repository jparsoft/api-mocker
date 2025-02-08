import React, { useState } from 'react';
import { X, Download, Settings } from 'lucide-react';
import { Button } from '../atoms/Button';
import { ApiEndpoint } from '../../types/api';
import { PostmanConverter } from '../../utils/postmanConverter';
import { ConversionOptions } from '../../utils/postmanConverter/types';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface PostmanExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  endpoints: ApiEndpoint[];
}

export const PostmanExportDialog: React.FC<PostmanExportDialogProps> = ({
  isOpen,
  onClose,
  endpoints
}) => {
  const { t } = useLanguage();
  const [options, setOptions] = useState<ConversionOptions>({
    name: 'API Collection',
    description: '',
    groupByPath: true,
    includeExamples: true,
    cleanVariables: true,
    baseUrl: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = () => {
    try {
      const collection = PostmanConverter.toCollection(endpoints, options);
      const json = JSON.stringify(collection, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `postman-collection-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('postman.exportSuccess'));
      onClose();
    } catch (error) {
      toast.error(t('postman.exportError'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
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
                {t('postman.exportTitle')}
              </h3>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('postman.collectionName')}
                    </label>
                    <input
                      type="text"
                      value={options.name}
                      onChange={(e) => setOptions(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('postman.description')}
                    </label>
                    <textarea
                      value={options.description}
                      onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('postman.baseUrl')}
                    </label>
                    <input
                      type="url"
                      value={options.baseUrl}
                      onChange={(e) => setOptions(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.example.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {showAdvanced ? t('action.hideAdvanced') : t('action.showAdvanced')}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700/50">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.groupByPath}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            groupByPath: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {t('postman.groupByPath')}
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.includeExamples}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            includeExamples: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {t('postman.includeExamples')}
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.cleanVariables}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            cleanVariables: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {t('postman.cleanVariables')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="secondary" onClick={onClose}>
                    {t('action.cancel')}
                  </Button>
                  <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('postman.export')}
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