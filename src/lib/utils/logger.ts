type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
}

class Logger {
    private static instance: Logger;
    private isDevelopment = import.meta.env.DEV;

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
        return {
            level,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }

    private log(level: LogLevel, message: string, data?: unknown) {
        const logMessage = this.formatMessage(level, message, data);
        
        // In development, use console with color coding
        if (this.isDevelopment) {
            const colors = {
                debug: '#7f7f7f',
                info: '#0077ff',
                warn: '#ff9900',
                error: '#ff0000'
            };
            
            console.group(`%c${logMessage.level.toUpperCase()} - ${logMessage.timestamp}`, `color: ${colors[level]}`);
            console.log(logMessage.message);
            if (logMessage.data) {
                console.log('Data:', logMessage.data);
            }
            console.groupEnd();
        } else {
            // In production, we could send logs to a service or just use basic console
            // You can modify this to send logs to a service like Sentry later
            console[level](message, data);
        }
    }

    debug(message: string, data?: unknown) {
        if (this.isDevelopment) {
            this.log('debug', message, data);
        }
    }

    info(message: string, data?: unknown) {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.log('warn', message, data);
    }

    error(message: string, data?: unknown) {
        this.log('error', message, data);
    }
}

// Export a singleton instance
export const logger = Logger.getInstance();
