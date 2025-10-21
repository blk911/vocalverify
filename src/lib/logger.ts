/**
 * Application Logger
 * Centralized logging utility with different log levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.getLogLevel();
  }

  /**
   * Get configured log level from environment
   */
  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, data, error } = entry;

    let formatted = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
      formatted += ` [${context}]`;
    }

    formatted += ` ${message}`;

    if (data) {
      formatted += `\nData: ${JSON.stringify(data, null, 2)}`;
    }

    if (error) {
      formatted += `\nError: ${error.message}`;
      if (error.stack) {
        formatted += `\nStack: ${error.stack}`;
      }
    }

    return formatted;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
    };
  }

  /**
   * Write log to console
   */
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.writeLog(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.writeLog(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.writeLog(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: string, data?: any): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      message,
      context,
      data,
      error
    );
    this.writeLog(entry);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, data?: any): void {
    this.info(`API Request: ${method} ${path}`, 'API', data);
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const entry = this.createLogEntry(
      level,
      `API Response: ${method} ${path} - ${status}`,
      'API',
      data
    );
    this.writeLog(entry);
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, collection: string, data?: any): void {
    this.debug(`DB Operation: ${operation} on ${collection}`, 'Database', data);
  }

  /**
   * Log authentication event
   */
  authEvent(event: string, userId?: string, data?: any): void {
    this.info(`Auth Event: ${event}`, 'Auth', { userId, ...data });
  }

  /**
   * Log voice authentication
   */
  voiceAuth(memberCode: string, success: boolean, data?: any): void {
    const message = `Voice Auth: ${memberCode} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const entry = this.createLogEntry(level, message, 'VoiceAuth', data);
    this.writeLog(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: string, data?: any) =>
    logger.debug(message, context, data),

  info: (message: string, context?: string, data?: any) =>
    logger.info(message, context, data),

  warn: (message: string, context?: string, data?: any) =>
    logger.warn(message, context, data),

  error: (message: string, error?: Error, context?: string, data?: any) =>
    logger.error(message, error, context, data),

  api: {
    request: (method: string, path: string, data?: any) =>
      logger.apiRequest(method, path, data),

    response: (method: string, path: string, status: number, data?: any) =>
      logger.apiResponse(method, path, status, data),
  },

  db: (operation: string, collection: string, data?: any) =>
    logger.dbOperation(operation, collection, data),

  auth: (event: string, userId?: string, data?: any) =>
    logger.authEvent(event, userId, data),

  voice: (memberCode: string, success: boolean, data?: any) =>
    logger.voiceAuth(memberCode, success, data),
};
