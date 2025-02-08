import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface RequestHistoryItemProps {
  timestamp: number;
  method: string;
  path: string;
  status: number;
  request: any;
  response: any;
}

export const RequestHistoryItem: React.FC<RequestHistoryItemProps> = ({
  timestamp,
  method,
  path,
  status,
  request,
  response,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50';
    if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600 bg-green-50';
      case 'POST': return 'text-blue-600 bg-blue-50';
      case 'PUT': return 'text-yellow-600 bg-yellow-50';
      case 'DELETE': return 'text-red-600 bg-red-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
        )}
        
        <div className="flex-1 flex items-center space-x-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(method)}`}>
            {method}
          </span>
          <span className="font-mono text-sm truncate">{path}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Request</h4>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(request, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Response</h4>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};