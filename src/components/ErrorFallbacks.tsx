import React from 'react';

// Default error fallback component
export const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="text-red-800 font-medium">Something went wrong</h3>
    <p className="text-red-600 text-sm mt-1">
      {process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'}
    </p>
  </div>
);

// Default loading fallback component
export const DefaultLoadingFallback = () => (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Error boundary component
interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; error?: Error }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error || new Error('Unknown error')} />;
    }

    return this.props.children;
  }
}























