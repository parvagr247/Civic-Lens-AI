import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton = ({ className, ...props }) => (
  <div
    className={twMerge('animate-pulse rounded bg-muted-foreground/15', className)}
    {...props}
  />
);

export const SkeletonLoader = ({ variant = 'card', count = 1, className }) => {
  const renderSkeleton = (index) => {
    if (variant === 'card') {
      return (
        <div key={index} className="p-6 border border-border rounded-xl space-y-3 bg-card shadow-sm">
          <Skeleton className="h-6 w-1/3 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      );
    }

    if (variant === 'text') {
      return (
        <div key={index} className="space-y-2 py-1">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
      );
    }

    if (variant === 'table') {
      return (
        <div key={index} className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex gap-3 items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className={twMerge('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </div>
  );
};
