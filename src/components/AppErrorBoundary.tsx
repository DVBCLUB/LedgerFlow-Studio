import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary — bắt lỗi runtime trong toàn bộ cây React.
 * Khi một component con throw error, boundary hiển thị fallback UI
 * thay vì crash trắng toàn app.
 */
export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[AppErrorBoundary] Caught runtime error:', error.message);
    console.error('[AppErrorBoundary] Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
          <div className="max-w-lg w-full bg-slate-900 rounded-2xl border border-red-500/20 p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-black text-red-400 mb-2">
              Hệ thống gặp sự cố
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Một thành phần giao diện gặp lỗi runtime. Toàn bộ ứng dụng vẫn an toàn.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 mb-6 text-left">
              <code className="text-xs text-red-300 break-all">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Component-level error boundary — nhẹ hơn, dùng bọc từng module.
 */
export function ModuleErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-6 bg-red-950/30 border border-red-500/20 rounded-xl text-center">
      <p className="text-red-400 font-bold mb-2">Module gặp lỗi</p>
      <code className="text-xs text-red-300/70 block mb-3">{error.message}</code>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold"
      >
        Thử lại module
      </button>
    </div>
  );
}
