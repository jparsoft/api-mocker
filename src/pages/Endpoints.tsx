import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Copy, History, Download } from 'lucide-react';
import { useApiStore } from '../store/apiStore';
import { Button } from '../components/atoms/Button';
import { EndpointCard } from '../components/molecules/EndpointCard';
import { EndpointDialog } from '../components/organisms/EndpointDialog';
import { RequestHistory } from '../components/organisms/RequestHistory';
import { ApiEndpoint, ChangeHistoryEntry } from '../types/api';
import { toast } from 'sonner';
import { MockServer } from '../services/mockServer';
import { DTOGeneratorDialog } from '../components/molecules/DTOGeneratorDialog';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChangeHistoryEntry[];
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Change History</h3>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-center text-gray-500">No changes recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.type === 'endpoint' ? 'Endpoint' : 'Collection'} {entry.action}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          {entry.changes.before && (
                            <div className="mb-2">
                              <div className="text-xs font-medium text-gray-500">Before:</div>
                              <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">
                                {JSON.stringify(entry.changes.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {entry.changes.after && (
                            <div>
                              <div className="text-xs font-medium text-gray-500">After:</div>
                              <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs">
                                {JSON.stringify(entry.changes.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Endpoints: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const {
    collections,
    setActiveCollection,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    duplicateEndpoint,
    changeHistory,
  } = useApiStore();
  const collection = collections.find((c) => c.id === id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDTODialogOpen, setIsDTODialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | undefined>();

  useEffect(() => {
    if (id) {
      setActiveCollection(id);
    }
  }, [id, setActiveCollection]);

  useEffect(() => {
    if (collection) {
      MockServer.getInstance().updateEndpoints(collection.endpoints);
    }
  }, [collection?.endpoints]);

  const handleCreateEndpoint = (data: Omit<ApiEndpoint, 'id' | 'createdAt'>) => {
    if (id) {
      addEndpoint(id, data);
      toast.success('Endpoint created successfully');
      setIsDialogOpen(false);
    }
  };

  const handleUpdateEndpoint = (data: Omit<ApiEndpoint, 'id' | 'createdAt'>) => {
    if (id && editingEndpoint) {
      updateEndpoint(id, editingEndpoint.id, data);
      toast.success('Endpoint updated successfully');
      setIsDialogOpen(false);
      setEditingEndpoint(undefined);
    }
  };

  const handleEditEndpoint = (endpoint: ApiEndpoint) => {
    setEditingEndpoint(endpoint);
    setIsDialogOpen(true);
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    if (id) {
      removeEndpoint(id, endpointId);
      toast.success('Endpoint deleted successfully');
    }
  };

  const handleDuplicateEndpoint = (endpointId: string) => {
    if (id) {
      duplicateEndpoint(id, endpointId);
      toast.success('Endpoint duplicated successfully');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEndpoint(undefined);
  };

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Collection not found</h2>
        <p className="mt-2 text-gray-600">The collection you're looking for doesn't exist.</p>
      </div>
    );
  }

  const filteredHistory = changeHistory.filter(
    (entry) => entry.collectionId === id
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{collection.description}</p>
          </div>
          <div className="flex space-x-4">
            <Button variant="secondary" onClick={() => setIsDTODialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              {t('action.generate')}
            </Button>
            <Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              {t('action.history')}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('endpoints.new')}
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {collection.endpoints.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">No endpoints yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create your first endpoint to start mocking API responses.
              </p>
            </div>
          ) : (
            collection.endpoints.map((endpoint) => (
              <div key={endpoint.id} className="group relative">
                <div className="absolute right-4 top-4 hidden space-x-2 group-hover:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateEndpoint(endpoint.id)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <EndpointCard
                  endpoint={endpoint}
                  onEdit={() => handleEditEndpoint(endpoint)}
                  onDelete={() => handleDeleteEndpoint(endpoint.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <RequestHistory />
      </div>

      <EndpointDialog
        isOpen={isDialogOpen}
        endpoint={editingEndpoint}
        onClose={handleCloseDialog}
        onSubmit={editingEndpoint ? handleUpdateEndpoint : handleCreateEndpoint}
      />

      <HistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={filteredHistory}
      />

      <DTOGeneratorDialog
        isOpen={isDTODialogOpen}
        onClose={() => setIsDTODialogOpen(false)}
        endpoints={collection.endpoints}
      />
    </div>
  );
};