import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const LoadingSpinner = ({
  className,
  size = 'md',
  fullPage = false,
  message,
  ...props
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const containerStyles = fullPage
    ? 'fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={twMerge(containerStyles, className)} {...props}>
      <Loader2 className={twMerge('animate-spin text-primary', sizes[size])} />
      {message && (
        <p className="mt-3 text-sm font-medium text-muted-foreground animate-pulse-subtle">
          {message}
        </p>
      )}
    </div>
  );
};
