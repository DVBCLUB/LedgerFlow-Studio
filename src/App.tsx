import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';

const LocalLoginGate = lazy(() => import('./components/LocalLoginGate'));
const ErpApp = lazy(() => import('./app/ErpApp'));

function LoadingFallback() {
  return <div>Loading...</div>;
}

function ErrorFallback({ error }: { error: Error }) {
  return <div>{error.message}</div>;
}

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
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error);
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default App;
export { ErrorBoundary, LoadingFallback, ErrorFallback };
