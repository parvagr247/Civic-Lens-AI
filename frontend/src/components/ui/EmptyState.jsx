import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  title = 'No reports found',
  description = 'There are no active entries in this view. Try adjusting filters or creating a new report.',
  icon: Icon = HelpCircle,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-xl bg-card/30 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};
