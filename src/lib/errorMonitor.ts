// Runtime Error Monitoring System
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: Array<{timestamp: Date, error: Error, context: any}> = [];

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  logError(error: Error, context?: any) {
    const errorEntry = {
      timestamp: new Date(),
      error,
      context
    };
    
    this.errors.push(errorEntry);
    
    // Log to console with emoji for visibility
    console.error('🚨 ERROR MONITOR:', error.message);
    console.error('🚨 Context:', context);
    console.error('🚨 Stack:', error.stack);
    
    // Store in localStorage for debugging
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amihuman-errors');
      const errors = stored ? JSON.parse(stored) : [];
      errors.push(errorEntry);
      localStorage.setItem('amihuman-errors', JSON.stringify(errors.slice(-10))); // Keep last 10
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amihuman-errors');
    }
  }
}

// Global error handler
export const setupErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      ErrorMonitor.getInstance().logError(event.error, {
        type: 'window-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      ErrorMonitor.getInstance().logError(
        new Error(event.reason), 
        { type: 'unhandled-promise-rejection' }
      );
    });
  }
};
