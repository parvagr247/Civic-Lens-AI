import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const PageHeader = ({
  title,
  subtitle,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge('flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/50', className)}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 self-start md:self-center">
          {children}
        </div>
      )}
    </div>
  );
};
