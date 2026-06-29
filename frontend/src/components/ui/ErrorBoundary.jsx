import React from 'react';

/**
 * Production-ready Error Boundary component.
 * Catches uncaught runtime exceptions in the component tree and shows a premium fallback UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary] Caught uncaught runtime exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#090d16] transition-colors duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center font-bold shadow-sm shrink-0">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">Unexpected Error Occurred</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The application encountered an uncaught runtime error. Please reload the page or return to the dashboard.
              </p>
            </div>
            {this.state.error && (
              <details className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800/50 font-mono max-h-40 overflow-y-auto cursor-pointer">
                <summary className="font-bold focus:outline-none mb-1 text-slate-700 dark:text-slate-300">
                  View diagnostic logs
                </summary>
                {this.state.error.toString()}
              </details>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-xl text-xs font-black transition duration-150 shadow-sm"
              >
                Reload Application
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition duration-150"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
