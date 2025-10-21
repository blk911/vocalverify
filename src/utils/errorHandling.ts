/**
 * Comprehensive Error Handling Utilities for Production
 * Prevents runtime errors and provides graceful fallbacks
 */

// Safe property access with fallbacks
export const safeGet = (obj: any, path: string, defaultValue: any = '') => {
  try {
    return (
      path.split('.').reduce((current, key) => current?.[key], obj) ??
      defaultValue
    );
  } catch {
    return defaultValue;
  }
};

// Safe string operations
export const safeUpperCase = (str: any, fallback: string = 'UNKNOWN') => {
  try {
    return (str || fallback).toString().toUpperCase();
  } catch {
    return fallback;
  }
};

// Safe array operations
export const safeArray = (arr: any, fallback: any[] = []) => {
  return Array.isArray(arr) ? arr : fallback;
};

// Safe object operations
export const safeObject = (obj: any, fallback: any = {}) => {
  return obj && typeof obj === 'object' ? obj : fallback;
};

// Safe date operations
export const safeDate = (date: any, fallback: Date = new Date()) => {
  try {
    return date ? new Date(date) : fallback;
  } catch {
    return fallback;
  }
};

// Safe number operations
export const safeNumber = (num: any, fallback: number = 0) => {
  try {
    return Number(num) || fallback;
  } catch {
    return fallback;
  }
};

// Safe string length check
export const safeLength = (str: any, fallback: number = 0) => {
  try {
    return (str || '').toString().length || fallback;
  } catch {
    return fallback;
  }
};

// Safe array length check
export const safeArrayLength = (arr: any, fallback: number = 0) => {
  try {
    return Array.isArray(arr) ? arr.length : fallback;
  } catch {
    return fallback;
  }
};

// Safe property existence check
export const safeHas = (obj: any, prop: string) => {
  try {
    return obj && typeof obj === 'object' && prop in obj;
  } catch {
    return false;
  }
};

// Safe function call
export const safeCall = (fn: any, ...args: any[]) => {
  try {
    return typeof fn === 'function' ? fn(...args) : undefined;
  } catch {
    return undefined;
  }
};

// Error boundary helper
export const withErrorHandling = (fn: Function, fallback: any = null) => {
  return (...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Error in function:', error);
      return fallback;
    }
  };
};

// Production error logger
export const logError = (error: any, context: string = 'Unknown') => {
  if (process.env.NODE_ENV === 'production') {
    // In production, log to external service
    console.error(`[${context}]`, error);
  } else {
    // In development, show detailed error
    console.error(`[${context}]`, error);
  }
};

// Validation helpers
export const isValidString = (str: any): str is string => {
  return typeof str === 'string' && str.length > 0;
};

export const isValidArray = (arr: any): arr is any[] => {
  return Array.isArray(arr);
};

export const isValidObject = (obj: any): obj is object => {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
};

export const isValidNumber = (num: any): num is number => {
  return typeof num === 'number' && !isNaN(num);
};

// React component error boundary props
export interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  children: React.ReactNode;
}

// Default fallback components (moved to separate .tsx file)
export const getDefaultErrorFallback = (error: Error) => ({
  type: 'div',
  props: {
    className: 'p-4 bg-red-50 border border-red-200 rounded-lg',
    children: [
      {
        type: 'h3',
        props: {
          className: 'text-red-800 font-medium',
          children: 'Something went wrong',
        },
      },
      {
        type: 'p',
        props: {
          className: 'text-red-600 text-sm mt-1',
          children:
            process.env.NODE_ENV === 'development'
              ? error.message
              : 'Please try again later',
        },
      },
    ],
  },
});

export const getDefaultLoadingFallback = () => ({
  type: 'div',
  props: {
    className: 'p-4 bg-gray-50 border border-gray-200 rounded-lg',
    children: {
      type: 'div',
      props: {
        className: 'animate-pulse',
        children: [
          {
            type: 'div',
            props: {
              className: 'h-4 bg-gray-200 rounded w-3/4 mb-2',
            },
          },
          {
            type: 'div',
            props: {
              className: 'h-4 bg-gray-200 rounded w-1/2',
            },
          },
        ],
      },
    },
  },
});
