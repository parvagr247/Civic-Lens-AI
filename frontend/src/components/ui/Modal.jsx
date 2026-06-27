import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actionText,
  onAction,
  actionLoading = false,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Dialog content */}
      <div className={`relative bg-card text-card-foreground border border-border w-full ${sizes[size]} rounded-2xl shadow-xl overflow-hidden animate-fade-in z-10`}>
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>

        {(actionText && onAction) && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-secondary/35">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onAction} 
              isLoading={actionLoading}
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
