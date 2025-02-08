import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiCollection, ApiEndpoint, ChangeHistoryEntry } from '../types/api';

interface ApiState {
  collections: ApiCollection[];
  activeCollectionId: string | null;
  changeHistory: ChangeHistoryEntry[];
  addCollection: (collection: Omit<ApiCollection, 'id' | 'createdAt'>) => void;
  duplicateCollection: (id: string) => void;
  updateCollection: (id: string, data: { name: string; description: string }) => void;
  removeCollection: (id: string) => void;
  addEndpoint: (collectionId: string, endpoint: Omit<ApiEndpoint, 'id' | 'createdAt'>) => void;
  duplicateEndpoint: (collectionId: string, endpointId: string) => void;
  removeEndpoint: (collectionId: string, endpointId: string) => void;
  updateEndpoint: (collectionId: string, endpointId: string, endpoint: Partial<ApiEndpoint>) => void;
  setActiveCollection: (collectionId: string) => void;
  importCollections: (collections: ApiCollection[]) => void;
  exportEndpoint: (collectionId: string, endpointId: string) => string;
  importEndpoint: (collectionId: string, endpointJson: string) => void;
  clearHistory: () => void;
}

export const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      collections: [],
      activeCollectionId: null,
      changeHistory: [],

      addCollection: (collection) => {
        const timestamp = Date.now();
        const newCollection = {
          ...collection,
          id: crypto.randomUUID(),
          createdAt: timestamp,
          lastModified: timestamp,
          endpoints: collection.endpoints.length > 0 ? collection.endpoints : [],
        };

        set((state) => ({
          collections: [...state.collections, newCollection],
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'collection',
              action: 'create',
              itemId: newCollection.id,
              collectionId: newCollection.id,
              changes: { after: newCollection },
            },
            ...state.changeHistory,
          ],
        }));
      },

      duplicateCollection: (id) => {
        const timestamp = Date.now();
        const collection = get().collections.find((c) => c.id === id);
        
        if (collection) {
          const newCollection = {
            ...collection,
            id: crypto.randomUUID(),
            name: `${collection.name} (Copy)`,
            createdAt: timestamp,
            lastModified: timestamp,
            endpoints: collection.endpoints.map(endpoint => ({
              ...endpoint,
              id: crypto.randomUUID(),
              createdAt: timestamp,
              lastModified: timestamp,
            })),
          };

          set((state) => ({
            collections: [...state.collections, newCollection],
            changeHistory: [
              {
                id: crypto.randomUUID(),
                timestamp,
                type: 'collection',
                action: 'duplicate',
                itemId: newCollection.id,
                collectionId: newCollection.id,
                changes: {
                  before: collection,
                  after: newCollection,
                },
              },
              ...state.changeHistory,
            ],
          }));
        }
      },

      updateCollection: (id, data) => {
        const timestamp = Date.now();
        const oldCollection = get().collections.find((c) => c.id === id);

        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id
              ? {
                  ...collection,
                  ...data,
                  lastModified: timestamp,
                }
              : collection
          ),
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'collection',
              action: 'update',
              itemId: id,
              collectionId: id,
              changes: {
                before: oldCollection,
                after: { ...oldCollection, ...data },
              },
            },
            ...state.changeHistory,
          ],
        }));
      },

      removeCollection: (id) => {
        const timestamp = Date.now();
        const collection = get().collections.find((c) => c.id === id);

        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId,
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'collection',
              action: 'delete',
              itemId: id,
              collectionId: id,
              changes: { before: collection },
            },
            ...state.changeHistory,
          ],
        }));
      },

      addEndpoint: (collectionId, endpoint) => {
        const timestamp = Date.now();
        const newEndpoint = {
          ...endpoint,
          id: crypto.randomUUID(),
          createdAt: timestamp,
          lastModified: timestamp,
        };

        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  lastModified: timestamp,
                  endpoints: [...collection.endpoints, newEndpoint],
                }
              : collection
          ),
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'endpoint',
              action: 'create',
              itemId: newEndpoint.id,
              collectionId,
              changes: { after: newEndpoint },
            },
            ...state.changeHistory,
          ],
        }));
      },

      duplicateEndpoint: (collectionId, endpointId) => {
        const timestamp = Date.now();
        const collection = get().collections.find((c) => c.id === collectionId);
        const endpoint = collection?.endpoints.find((e) => e.id === endpointId);

        if (endpoint) {
          const newEndpoint = {
            ...endpoint,
            id: crypto.randomUUID(),
            path: `${endpoint.path}-copy`,
            createdAt: timestamp,
            lastModified: timestamp,
          };

          set((state) => ({
            collections: state.collections.map((collection) =>
              collection.id === collectionId
                ? {
                    ...collection,
                    lastModified: timestamp,
                    endpoints: [...collection.endpoints, newEndpoint],
                  }
                : collection
            ),
            changeHistory: [
              {
                id: crypto.randomUUID(),
                timestamp,
                type: 'endpoint',
                action: 'duplicate',
                itemId: newEndpoint.id,
                collectionId,
                changes: {
                  before: endpoint,
                  after: newEndpoint,
                },
              },
              ...state.changeHistory,
            ],
          }));
        }
      },

      removeEndpoint: (collectionId, endpointId) => {
        const timestamp = Date.now();
        const collection = get().collections.find((c) => c.id === collectionId);
        const endpoint = collection?.endpoints.find((e) => e.id === endpointId);

        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  lastModified: timestamp,
                  endpoints: collection.endpoints.filter((e) => e.id !== endpointId),
                }
              : collection
          ),
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'endpoint',
              action: 'delete',
              itemId: endpointId,
              collectionId,
              changes: { before: endpoint },
            },
            ...state.changeHistory,
          ],
        }));
      },

      updateEndpoint: (collectionId, endpointId, endpoint) => {
        const timestamp = Date.now();
        const collection = get().collections.find((c) => c.id === collectionId);
        const oldEndpoint = collection?.endpoints.find((e) => e.id === endpointId);

        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  lastModified: timestamp,
                  endpoints: collection.endpoints.map((e) =>
                    e.id === endpointId
                      ? { ...e, ...endpoint, lastModified: timestamp }
                      : e
                  ),
                }
              : collection
          ),
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'endpoint',
              action: 'update',
              itemId: endpointId,
              collectionId,
              changes: {
                before: oldEndpoint,
                after: { ...oldEndpoint, ...endpoint },
              },
            },
            ...state.changeHistory,
          ],
        }));
      },

      setActiveCollection: (collectionId) => {
        set({ activeCollectionId: collectionId });
      },

      importCollections: (collections) => {
        const timestamp = Date.now();
        const processedCollections = collections.map(collection => ({
          ...collection,
          id: collection.id || crypto.randomUUID(),
          createdAt: collection.createdAt || timestamp,
          lastModified: collection.lastModified || timestamp,
          endpoints: (collection.endpoints || []).map(endpoint => ({
            ...endpoint,
            id: endpoint.id || crypto.randomUUID(),
            createdAt: endpoint.createdAt || timestamp,
            lastModified: endpoint.lastModified || timestamp,
            response: {
              status: endpoint.response?.status || 200,
              body: endpoint.response?.body || '{"message": "OK"}',
              contentType: endpoint.response?.contentType || 'application/json'
            }
          }))
        }));

        set((state) => ({
          collections: [...state.collections, ...processedCollections],
          changeHistory: [
            {
              id: crypto.randomUUID(),
              timestamp,
              type: 'collection',
              action: 'import',
              itemId: 'bulk-import',
              collectionId: 'bulk-import',
              changes: { after: processedCollections },
            },
            ...state.changeHistory,
          ],
        }));
      },

      exportEndpoint: (collectionId, endpointId) => {
        const collection = get().collections.find((c) => c.id === collectionId);
        const endpoint = collection?.endpoints.find((e) => e.id === endpointId);
        return endpoint ? JSON.stringify(endpoint, null, 2) : '';
      },

      importEndpoint: (collectionId, endpointJson) => {
        try {
          const timestamp = Date.now();
          const endpoint = JSON.parse(endpointJson);
          const newEndpoint = {
            ...endpoint,
            id: crypto.randomUUID(),
            createdAt: timestamp,
            lastModified: timestamp,
          };

          set((state) => ({
            collections: state.collections.map((collection) =>
              collection.id === collectionId
                ? {
                    ...collection,
                    lastModified: timestamp,
                    endpoints: [...collection.endpoints, newEndpoint],
                  }
                : collection
            ),
            changeHistory: [
              {
                id: crypto.randomUUID(),
                timestamp,
                type: 'endpoint',
                action: 'import',
                itemId: newEndpoint.id,
                collectionId,
                changes: { after: newEndpoint },
              },
              ...state.changeHistory,
            ],
          }));
        } catch (error) {
          console.error('Failed to import endpoint:', error);
          throw new Error('Invalid endpoint JSON');
        }
      },

      clearHistory: () => {
        set((state) => ({ ...state, changeHistory: [] }));
      },
    }),
    {
      name: 'api-mocker-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            collections: Array.isArray(persistedState.collections) ? persistedState.collections : [],
            activeCollectionId: persistedState.activeCollectionId || null,
            changeHistory: [],
          };
        }
        if (version === 1) {
          return {
            ...persistedState,
            collections: Array.isArray(persistedState.collections) ? persistedState.collections : [],
            changeHistory: Array.isArray(persistedState.changeHistory) ? persistedState.changeHistory : [],
          };
        }
        return persistedState;
      },
    }
  )
);