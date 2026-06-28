import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/20 text-slate-900 dark:text-slate-100 shadow-lg',
    warning: 'bg-white/95 dark:bg-slate-900/95 border-amber-500/20 text-slate-900 dark:text-slate-100 shadow-lg',
    error: 'bg-white/95 dark:bg-slate-900/95 border-red-500/20 text-slate-900 dark:text-slate-100 shadow-lg',
    info: 'bg-white/95 dark:bg-slate-900/95 border-blue-500/20 text-slate-900 dark:text-slate-100 shadow-lg',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast notifications container in top-right corner with safe top-28 offset */}
      <div className="fixed top-28 right-8 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md pointer-events-auto transition-all duration-300 transform translate-x-0 animate-slide-in-right ${colors[t.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
            <p className="text-xs font-bold flex-1 leading-normal">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
