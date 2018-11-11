import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const LOG_FILES_LOCATION = process.env.LOG_FILES_LOCATION || 'logs';
const LOG_FILES_ARCHIVE_ROTATED = Boolean(process.env.LOG_FILES_ARCHIVE_ROTATED || false);
const LOG_FILES_MAX_SIZE = process.env.LOG_FILES_MAX_SIZE || '20m';
const LOG_FILES_MAX_AGE = process.env.LOG_FILES_MAX_AGE || '14d';
const LOG_FILES_DATE_PATTERN = process.env.LOG_FILES_DATE_PATTERN || 'YYYY-MM-DD';
const LOG_TO_CONSOLE = Boolean(process.env.LOG_TO_CONSOLE || true);

const {
  colorize,
  combine,
  timestamp,
  printf,
} = winston.format;

const loggingFormat = printf(info => (
  `${info.timestamp} ${info.level}: ${info.message}`
));

const defaultConfig = {
  datePattern: LOG_FILES_DATE_PATTERN,
  zippedArchive: LOG_FILES_ARCHIVE_ROTATED,
  maxSize: LOG_FILES_MAX_SIZE,
  maxFiles: LOG_FILES_MAX_AGE,
  format: combine(
    timestamp(),
    loggingFormat,
  ),
};

const transports = [
  //
  // - Write to all logs with level `info` and below to `combined.log`
  // - Write all logs error (and below) to `error.log`.
  //
  new DailyRotateFile({
    ...defaultConfig,
    filename: `${LOG_FILES_LOCATION}/error-%DATE%.log`,
    level: 'error',
  }),
  new DailyRotateFile({
    ...defaultConfig,
    filename: `${LOG_FILES_LOCATION}/combined-%DATE%.log`,
  }),
];

if (LOG_TO_CONSOLE) {
  transports.push(new winston.transports.Console({
    ...defaultConfig,
    format: combine(
      timestamp(),
      colorize(),
      loggingFormat,
    ),
  }));
}

const logger = winston.createLogger({
  format: winston.format.json(),
  transports,
});

export default logger;
