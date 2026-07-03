import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';

import { DynamicModuleProvider } from './context/DynamicModuleContext';
import { AIWorkforceProvider } from './context/AIWorkforceContext';

const LocalLoginGate = lazy(() => import('./components/LocalLoginGate'));
const ErpApp = lazy(() => import('./app/ErpApp'));

function LoadingFallback() {
  return <div>Loading...</div>;
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
