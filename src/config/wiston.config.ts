import appRoot from 'app-root-path';
import { createLogger, transports, format, config } from 'winston';
const { combine, timestamp, json } = format;

const options = {

    userFile: {
        filename: `${appRoot}/src/${process.env.LOGS_PATH}/user.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },

    dbFile: {
        filename: `${appRoot}/src/${process.env.LOGS_PATH}/db.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },

    systemFile: {
        filename: `${appRoot}/src/${process.env.LOGS_PATH}/system.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },

    exception: {
        filename: `${appRoot}/src/${process.env.LOGS_PATH}/exceptions.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    }

}

// define new logger transports
export const userLogger = createLogger({
    levels: config.syslog.levels,
    defaultMeta: { service: 'store-service' },
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        json()
    ),
    transports: [
        new transports.File(options.userFile)
    ],
    exceptionHandlers: [
        new transports.File(options.exception)
    ],
    exitOnError: false
});

export const dbLogger = createLogger({
    levels: config.syslog.levels,
    defaultMeta: { service: 'store-service' },
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        json()
    ),
    transports: [
        new transports.File(options.dbFile)
    ],
    exceptionHandlers: [
        new transports.File(options.exception)
    ],
    exitOnError: false
});

export const systemLogger = createLogger({
    levels: config.syslog.levels,
    defaultMeta: { service: 'store-service' },
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        json()
    ),
    transports: [
        new transports.File(options.systemFile)
    ],
    exceptionHandlers: [
        new transports.File(options.exception)
    ],
    exitOnError: false
});