/**
 * LedgerFlow Studio - Main App Component
 * 
 * This component uses lazy loading and Suspense to optimize performance.
 * Only the essential components are loaded initially, and others are
 * loaded on-demand when needed.
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';

// ==========================================================================
// LAZY-LOADED COMPONENTS
// ==========================================================================

// LocalLoginGate - Always needed for auth
const LocalLoginGate = lazy(() => import('./components/LocalLoginGate'));

// ErpApp - Main app component
const ErpApp = lazy(() => import('./app/ErpApp'));

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="animate-pulse rounded-full bg-cyan-400/20 p-8">
        <div className="h-12 w-12 rounded-full bg-cyan-400/40"></div>
      </div>
    </div>
  );
}

// Error fallback
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="rounded-xl border border-rose-500/25 bg-slate-900/80 p-8 text-center">
        <h2 className="text-xl font-bold text-rose-200">Lỗi tải ứng dụng</h2>
        <p className="mt-4 text-sm text-slate-300">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          Tải lại
        </button>
      </div>
    </div>
  );
}

// ==========================================================================
// MAIN APP COMPONENT
// ==========================================================================

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <LocalLoginGate>
            <ErpApp />
          </LocalLoginGate>
        </ErrorBoundary>
      </Suspense>
    </Router>
  );
}

// ==========================================================================
// ERROR BOUNDARY COMPONENT
// ==========================================================================

class ErrorBoundary extends React.Component<{
  fallback: React.ReactNode;
  children: React.ReactNode;
}, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // If fallback is a function, call it with the error
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error);
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export default App;
export { ErrorBoundary, LoadingFallback, ErrorFallback };
