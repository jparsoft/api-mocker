import React from 'react';
import { Trash2 } from 'lucide-react';
import { RequestHistoryItem } from '../molecules/RequestHistoryItem';
import { Button } from '../atoms/Button';
import { MockServer } from '../../services/mockServer';

export const RequestHistory: React.FC = () => {
  const [history, setHistory] = React.useState(MockServer.getInstance().getRequestHistory());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setHistory(MockServer.getInstance().getRequestHistory());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClearHistory = () => {
    MockServer.getInstance().clearHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
        <p className="mt-2 text-sm text-gray-600">
          Make a request to your mock endpoints to see the history here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
        <Button variant="secondary" size="sm" onClick={handleClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>
      <div className="space-y-2">
        {history.map((item) => (
          <RequestHistoryItem
            key={item.timestamp}
            timestamp={item.timestamp}
            method={item.request.method}
            path={item.request.path}
            status={item.response.status}
            request={item.request}
            response={item.response}
          />
        ))}
      </div>
    </div>
  );
};