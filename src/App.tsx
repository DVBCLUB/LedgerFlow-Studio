import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';

import { DynamicModuleProvider } from './context/DynamicModuleContext';
import { AIWorkforceProvider } from './context/AIWorkforceContext';

const LocalLoginGate = lazy(() => import('./components/LocalLoginGate'));
const ErpApp = lazy(() => import('./app/ErpApp'));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-5">
        {/* LF Monogram */}
        <div
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-pulse"
        >
          <span className="text-white font-black text-base tracking-tight select-none">LF</span>
        </div>
        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-white text-sm font-semibold tracking-tight">LedgerFlow Studio</span>
          <span className="text-slate-600 text-[10px] uppercase tracking-widest font-medium">Đang tải hệ thống...</span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 w-28 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
              animation: 'lf-loading 1.6s ease-in-out infinite',
              width: '60%',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes lf-loading {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(280%); }
        }
      `}</style>
    </div>
  );
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="p-8 text-rose-400 bg-slate-950 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-xl font-bold mb-2">Hệ thống gặp sự cố khởi động (Runtime Error)</h1>
      <pre className="text-xs p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-2xl overflow-auto w-full">
        {error ? (error.stack || error.message) : 'Lỗi không xác định'}
      </pre>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <LocalLoginGate>
            <DynamicModuleProvider>
              <AIWorkforceProvider>
                <ErpApp />
              </AIWorkforceProvider>
            </DynamicModuleProvider>
          </LocalLoginGate>
        </ErrorBoundary>
      </Suspense>
    </Router>
  );
}

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
      if (React.isValidElement(this.props.fallback)) {
        return React.cloneElement(this.props.fallback, { error: this.state.error } as any);
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default App;
export { ErrorBoundary, LoadingFallback, ErrorFallback };
