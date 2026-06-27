import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const SectionHeader = ({
  title,
  description,
  className,
  ...props
}) => {
  return (
    <div className={twMerge('space-y-1 mb-4', className)} {...props}>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};
