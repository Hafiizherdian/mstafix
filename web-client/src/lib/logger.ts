import { type NextRequest } from 'next/server';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogContext = Record<string, unknown>;

class Logger {
  private readonly serviceName: string;
  private readonly requestId?: string;

  constructor(serviceName: string, requestId?: string) {
    this.serviceName = serviceName;
    this.requestId = requestId;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: this.serviceName,
      level: level.toUpperCase(),
      message,
      requestId: this.requestId,
      ...context
    };

    // Stringify the log entry with proper error handling
    try {
      return JSON.stringify(logEntry, (key, value) => {
        // Handle circular references
        if (value instanceof Error) {
          return {
            message: value.message,
            stack: value.stack,
            name: value.name
          };
        }
        return value;
      });
    } catch (e) {
      return JSON.stringify({
        timestamp,
        service: this.serviceName,
        level: level.toUpperCase(),
        message: 'Failed to stringify log entry',
        error: e instanceof Error ? e.message : String(e),
        originalMessage: message
      });
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext = error ? { 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error)
    } : {};
    
    console.error(this.formatMessage('error', message, {
      ...errorContext,
      ...context
    }));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Create a child logger with additional context
  child(context: LogContext) {
    return new Logger(this.serviceName, this.requestId) as Logger & { [K in keyof LogContext]: LogContext[K] };
  }
}

// Create a request-scoped logger
export function createRequestLogger(serviceName: string, request?: Request | NextRequest) {
  const requestId = request?.headers.get('x-request-id') || 
                    crypto.randomUUID().substring(0, 8);
  return new Logger(serviceName, requestId);
}

// Create a module-level logger
export const logger = new Logger('generate-soal-api');
