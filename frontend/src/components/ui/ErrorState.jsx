import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Failed to load details',
  message = 'An unexpected error occurred while communicating with backend APIs. Please verify your connection.',
  onRetry,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-destructive/20 rounded-xl bg-destructive/5 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-destructive mb-1">{title}</h3>
      <p className="text-sm text-destructive/80 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm" icon={RefreshCw}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
