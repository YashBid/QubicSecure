/**
 * Audit Logger
 * Logs every analysis step for auditability as per requirements
 */

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    step: string;
    message: string;
    metadata?: Record<string, any>;
}

class AuditLogger {
    private logs: LogEntry[] = [];

    log(level: LogLevel, step: string, message: string, metadata?: Record<string, any>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            step,
            message,
            metadata,
        };

        this.logs.push(entry);

        // Console output for development
        const logMethod = level === LogLevel.ERROR ? console.error :
            level === LogLevel.WARN ? console.warn :
                console.log;

        logMethod(`[${entry.timestamp}] [${level}] [${step}] ${message}`, metadata || '');
    }

    info(step: string, message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.INFO, step, message, metadata);
    }

    warn(step: string, message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.WARN, step, message, metadata);
    }

    error(step: string, message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.ERROR, step, message, metadata);
    }

    debug(step: string, message: string, metadata?: Record<string, any>) {
        this.log(LogLevel.DEBUG, step, message, metadata);
    }

    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    clear() {
        this.logs = [];
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Singleton instance
export const logger = new AuditLogger();
