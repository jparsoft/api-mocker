import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { ApiEndpoint, HttpMethod } from '../../types/api';
import { Button } from '../atoms/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface EndpointFormProps {
  endpoint?: ApiEndpoint;
  onSubmit: (data: Omit<ApiEndpoint, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export const EndpointForm: React.FC<EndpointFormProps> = ({
  endpoint,
  onSubmit,
  onCancel,
}) => {
  const { t } = useLanguage();
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      path: endpoint?.path || '',
      method: endpoint?.method || 'GET',
      description: endpoint?.description || '',
      response: {
        status: endpoint?.response.status || 200,
        body: endpoint?.response.body || '{\n  "message": "Hello World"\n}',
        contentType: endpoint?.response.contentType || 'application/json',
      },
      headers: endpoint?.headers || [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('endpoints.method')}
        </label>
        <select
          {...register('method')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('endpoints.path')}
        </label>
        <input
          type="text"
          {...register('path', { required: t('endpoints.pathRequired') })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="/api/resource"
        />
        {errors.path && (
          <p className="mt-1 text-sm text-red-600">{errors.path.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('endpoints.description')}
        </label>
        <input
          type="text"
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder={t('endpoints.descriptionPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('endpoints.responseStatus')}
        </label>
        <input
          type="number"
          {...register('response.status', {
            required: t('endpoints.statusRequired'),
            min: { value: 100, message: t('endpoints.statusMin') },
            max: { value: 599, message: t('endpoints.statusMax') },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.response?.status && (
          <p className="mt-1 text-sm text-red-600">{errors.response.status.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('endpoints.responseBody')}
        </label>
        <div className="mt-1 border rounded-md overflow-hidden">
          <Controller
            name="response.body"
            control={control}
            render={({ field }) => (
              <CodeMirror
                value={field.value}
                height="200px"
                extensions={[json()]}
                onChange={field.onChange}
                theme="light"
                className="border-none"
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {endpoint ? t('endpoints.update') : t('endpoints.create')}
        </Button>
      </div>
    </form>
  );
};