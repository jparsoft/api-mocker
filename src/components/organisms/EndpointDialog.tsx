import React from 'react';
import { X } from 'lucide-react';
import { ApiEndpoint } from '../../types/api';
import { EndpointForm } from '../molecules/EndpointForm';

interface EndpointDialogProps {
  isOpen: boolean;
  endpoint?: ApiEndpoint;
  onClose: () => void;
  onSubmit: (data: Omit<ApiEndpoint, 'id' | 'createdAt'>) => void;
}

export const EndpointDialog: React.FC<EndpointDialogProps> = ({
  isOpen,
  endpoint,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {endpoint ? 'Edit Endpoint' : 'Create New Endpoint'}
              </h3>
              <div className="mt-6">
                <EndpointForm
                  endpoint={endpoint}
                  onSubmit={onSubmit}
                  onCancel={onClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};