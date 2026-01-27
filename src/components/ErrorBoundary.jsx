import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
          <div className="card max-w-2xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">出现错误</h2>
            <p className="text-slate-700 mb-4">
              应用加载时出现错误。请检查控制台获取详细信息。
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-slate-600 mb-2">
                错误详情
              </summary>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto">
                {this.state.error?.toString()}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-4"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
