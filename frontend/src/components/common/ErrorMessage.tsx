import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Service Communication Error',
  message,
  onRetry,
}) => (
  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 my-4">
    <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 mt-1">{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={onRetry} icon={<RefreshCw size={14} />}>
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  </div>
);
