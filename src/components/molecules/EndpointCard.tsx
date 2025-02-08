import React from 'react';
import { Pencil, Trash2, Play, Globe, Copy, XCircle } from 'lucide-react';
import { ApiEndpoint } from '../../types/api';
import { Button } from '../atoms/Button';
import { cn } from '../../utils/cn';
import { MockServer } from '../../services/mockServer';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  onEdit: (endpoint: ApiEndpoint) => void;
  onDelete: (endpointId: string) => void;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({ endpoint, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const mockServer = MockServer.getInstance();
  const [isPublished, setIsPublished] = React.useState(mockServer.isPublished(endpoint.id));
  const [isCopied, setIsCopied] = React.useState(false);
  const metrics = mockServer.getMetrics(endpoint.id);

  const handleTest = async () => {
    try {
      const response = await mockServer.handleRequest({
        method: endpoint.method,
        path: endpoint.path,
        headers: Object.fromEntries(endpoint.headers.map(h => [h.key, h.value])),
      });
      
      toast.success(`${t('message.testSuccessful')}: ${response.status} ${response.statusText}`);
    } catch (error) {
      toast.error(`${t('message.testFailed')}: ${error instanceof Error ? error.message : t('message.unknownError')}`);
    }
  };

  const handlePublishToggle = () => {
    if (isPublished) {
      mockServer.unpublishEndpoint(endpoint.id);
      setIsPublished(false);
      toast.success(t('message.endpointUnpublished'));
    } else {
      mockServer.publishEndpoint(endpoint.id);
      setIsPublished(true);
      toast.success(t('message.endpointPublished'));
    }
  };

  const handleCopyUrl = async () => {
    const url = mockServer.getPublicUrl(endpoint.id);
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success(t('message.urlCopied'));
      } catch (error) {
        toast.error(t('message.copyFailed'));
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('message.confirmDelete'))) {
      onDelete(endpoint.id);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={cn(
              'rounded px-2 py-1 text-xs font-medium',
              {
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': endpoint.method === 'GET',
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': endpoint.method === 'POST',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': endpoint.method === 'PUT',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': endpoint.method === 'DELETE',
                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': endpoint.method === 'PATCH',
              }
            )}
          >
            {endpoint.method}
          </span>
          <span className="font-mono text-sm text-foreground">{endpoint.path}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-px rounded-md shadow-sm isolate">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTest}
              className={cn(
                "rounded-none rounded-l-md border-r-0",
                "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
              title={t('action.testEndpoint')}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePublishToggle}
              className={cn(
                "rounded-none border-x-0",
                "text-muted-foreground",
                isPublished 
                  ? "hover:text-destructive hover:bg-destructive/10" 
                  : "hover:text-primary hover:bg-accent"
              )}
              title={isPublished ? t('action.unpublishEndpoint') : t('action.publishEndpoint')}
            >
              {isPublished ? <XCircle className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(endpoint)}
              className={cn(
                "rounded-none border-x-0",
                "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
              title={t('action.editEndpoint')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              className={cn(
                "rounded-none rounded-r-md",
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              )}
              title={t('action.deleteEndpoint')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <p className="mt-2 text-sm text-muted-foreground">{endpoint.description}</p>
      
      <div className="mt-3 space-y-3">
        <div className="text-xs font-medium text-muted-foreground">{t('label.responseStatus')}: {endpoint.response.status}</div>
        
        {endpoint.headers.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">{t('label.headers')}:</div>
            <div className="space-y-1">
              {endpoint.headers.map((header, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {header.key}: {header.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {isPublished && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{t('label.publishedStatus')}</div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{metrics.requests} {t('label.requests')}</span>
                  {metrics.lastAccessed > 0 && (
                    <span>{t('label.lastAccessed')}: {new Date(metrics.lastAccessed).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                className={cn(
                  "flex items-center space-x-2 transition-colors",
                  isCopied ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <Copy className="h-4 w-4" />
                <span>{isCopied ? t('message.copied') : t('action.copy')}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};