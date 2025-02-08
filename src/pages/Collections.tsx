import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Upload, Pencil, Trash2, Search, SortAsc, SortDesc } from 'lucide-react';
import { useApiStore } from '../store/apiStore';
import { Button } from '../components/atoms/Button';
import { toast } from 'sonner';
import { ApiCollection } from '../types/api';
import { PostmanParser } from '../utils/postmanParser';
import { ApiDiscoveryDialog } from '../components/molecules/ApiDiscoveryDialog';
import { useLanguage } from '../contexts/LanguageContext';

interface CollectionFormData {
  name: string;
  description: string;
}

type SortField = 'name' | 'createdAt' | 'endpoints';
type SortDirection = 'asc' | 'desc';

export const Collections: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { collections = [], addCollection, importCollections, updateCollection, removeCollection } = useApiStore();
  const [editingCollection, setEditingCollection] = useState<{ id: string; data: CollectionFormData } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isImporting, setIsImporting] = useState(false);
  const [isApiDiscoveryOpen, setIsApiDiscoveryOpen] = useState(false);

  const filteredAndSortedCollections = useMemo(() => {
    if (!Array.isArray(collections)) return [];
    
    let result = [...collections];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        collection =>
          collection.name.toLowerCase().includes(query) ||
          collection.description.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'endpoints':
          comparison = (a.endpoints?.length || 0) - (b.endpoints?.length || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [collections, searchQuery, sortField, sortDirection]);

  const handleCreateCollection = () => {
    const collection = {
      name: t('collections.new'),
      description: '',
      endpoints: [],
    };
    addCollection(collection);
    toast.success(t('message.success'));
  };

  const handleExport = () => {
    const data = JSON.stringify(collections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-collections.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('message.success'));
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (PostmanParser.isPostmanEnvironment(data)) {
          PostmanParser.handleEnvironmentImport(data);
          toast.success(t('message.success'));
          setIsImporting(false);
          return;
        }

        if (PostmanParser.isPostmanCollection(data)) {
          const parsed = PostmanParser.parse(data);
          importCollections([{
            id: crypto.randomUUID(),
            name: parsed.name,
            description: parsed.description,
            endpoints: parsed.endpoints.map(endpoint => ({
              ...endpoint,
              id: crypto.randomUUID(),
              createdAt: Date.now()
            })),
            createdAt: Date.now(),
            lastModified: Date.now()
          }]);
          toast.success(t('message.success'));
        } else if (Array.isArray(data)) {
          const isValid = data.every(collection => 
            typeof collection === 'object' &&
            typeof collection.name === 'string' &&
            Array.isArray(collection.endpoints)
          );

          if (!isValid) {
            throw new Error(t('message.error'));
          }

          importCollections(data);
          toast.success(t('message.success'));
        } else {
          throw new Error(t('message.error'));
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error(t('message.error'));
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error(t('message.error'));
      setIsImporting(false);
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleEditCollection = (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditingCollection({
        id,
        data: { name: collection.name, description: collection.description }
      });
    }
  };

  const handleUpdateCollection = (id: string, data: CollectionFormData) => {
    updateCollection(id, data);
    setEditingCollection(null);
    toast.success(t('message.success'));
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm(t('collections.delete.confirm'))) {
      removeCollection(id);
      toast.success(t('message.success'));
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('collections.title')}</h1>
        <div className="flex space-x-4">
          <input
            type="file"
            id="import-file"
            className="hidden"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
          />
          <Button 
            variant="secondary" 
            onClick={() => setIsApiDiscoveryOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            {t('apiDiscovery.discover')}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => document.getElementById('import-file')?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? t('action.importing') : t('action.import')}
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('action.export')}
          </Button>
          <Button onClick={handleCreateCollection}>
            <Plus className="mr-2 h-4 w-4" />
            {t('collections.new')}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('collections.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('collections.sortBy')}:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort('name')}
              className={sortField === 'name' ? 'text-blue-600' : 'text-gray-500'}
            >
              {t('collections.sortName')} {sortField === 'name' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4 inline" /> : <SortDesc className="ml-1 h-4 w-4 inline" />)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort('createdAt')}
              className={sortField === 'createdAt' ? 'text-blue-600' : 'text-gray-500'}
            >
              {t('collections.sortDate')} {sortField === 'createdAt' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4 inline" /> : <SortDesc className="ml-1 h-4 w-4 inline" />)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort('endpoints')}
              className={sortField === 'endpoints' ? 'text-blue-600' : 'text-gray-500'}
            >
              {t('collections.sortEndpoints')} {sortField === 'endpoints' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4 inline" /> : <SortDesc className="ml-1 h-4 w-4 inline" />)}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedCollections.map((collection) => (
            <div
              key={collection.id}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {editingCollection?.id === collection.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateCollection(collection.id, editingCollection.data);
                  }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    value={editingCollection.data.name}
                    onChange={(e) => setEditingCollection({
                      ...editingCollection,
                      data: { ...editingCollection.data, name: e.target.value }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('collections.namePlaceholder')}
                    required
                  />
                  <textarea
                    value={editingCollection.data.description}
                    onChange={(e) => setEditingCollection({
                      ...editingCollection,
                      data: { ...editingCollection.data, description: e.target.value }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('collections.descriptionPlaceholder')}
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingCollection(null)}
                    >
                      {t('action.cancel')}
                    </Button>
                    <Button type="submit" size="sm">
                      {t('action.save')}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="absolute right-4 top-4 flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCollection(collection.id);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id);
                      }}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/collection/${collection.id}`)}
                  >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{collection.name}</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{collection.description}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>{t('collections.endpointCount', { count: collection.endpoints?.length || 0 })}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {t('collections.createdAt', { date: new Date(collection.createdAt).toLocaleDateString() })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {filteredAndSortedCollections.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('collections.noCollections')}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {searchQuery ? t('collections.noSearchResults') : t('collections.createFirstCollection')}
              </p>
            </div>
          )}
        </div>
      </div>

      <ApiDiscoveryDialog
        isOpen={isApiDiscoveryOpen}
        onClose={() => setIsApiDiscoveryOpen(false)}
        onImport={(endpoints) => {
          addCollection({
            name: 'Discovered API',
            description: `Automatically discovered API with ${endpoints.length} endpoints`,
            endpoints
          });
          toast.success(t('apiDiscovery.imported', { count: endpoints.length }));
          setIsApiDiscoveryOpen(false);
        }}
      />
    </div>
  );
};