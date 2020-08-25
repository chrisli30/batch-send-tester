const winston = require('winston');
const moment = require('moment');

const config = require('./config/index');

const transports = [
    new winston.transports.File({ filename: `./log/${moment().format('YYYY-MM-DD')}-error.log`, level: 'error' }),
    new winston.transports.File({ filename: `./log/${moment().format('YYYY-MM-DD')}-info.log`, level: 'info' }),
    new winston.transports.File({ filename: `./log/${moment().format('YYYY-MM-DD')}-debug.log`, level: 'debug' }),
    // new winston.transports.Console({
    //     format: winston.format.combine(winston.format.cli(), winston.format.splat()),
    // }),
];

const LoggerInstance = winston.createLogger({
    level: config.logs.level,
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
    ),
    transports,
});

module.exports = LoggerInstance;
