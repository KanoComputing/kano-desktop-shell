const path = require('path');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const { app } = require('electron');
const mkdirp = require('mkdirp');

const loggers = new Map();

const defaultOptions = {
    level: 'info',
    file: {
        level: 'warn',
        period: '1d',
        count: 7,
    },
    devMode: {
        level: 'debug',
        file: {
            level: 'debug',
        },
    },
};

const Logger = {
    getLogger(opts, name = null) {
        const loggerName = name || app.getName();
        const fileOptions = Object.assign({}, defaultOptions.file, opts.file || {});
        const options = Object.assign({}, defaultOptions, opts);
        if (!loggers.has(loggerName)) {
            const streams = [{
                level: options.level,
                type: 'raw',
                stream: bunyanDebugStream(),
                name: 'stream',
            }];
            // Setting the file property to false will disable it
            if (opts.file !== false) {
                mkdirp.sync(app.getPath('userData'));
                streams.push({
                    level: fileOptions.level,
                    type: 'rotating-file',
                    path: path.join(app.getPath('userData'), `${loggerName}.log`),
                    name: 'file',
                    period: fileOptions.period,
                    count: fileOptions.count,
                });
            }
            const logger = bunyan.createLogger({
                name: loggerName,
                streams,
                serializers: bunyanDebugStream.serializers,
            });
            loggers.set(loggerName, logger);
        }
        return loggers.get(loggerName);
    },
    enableDevMode(opts, name = null) {
        const loggerName = name || app.getName();
        if (!loggers.has(loggerName)) {
            return;
        }
        const level = opts.devMode
                        && opts.devMode.level
            ? opts.devMode.level : defaultOptions.devMode.level;
        const fileLevel = opts.devMode
                        && opts.devMode.file
                        && opts.devMode.file.level
            ? opts.devMode.file.level : defaultOptions.devMode.file.level;
        const logger = loggers.get(loggerName);
        logger.levels('stream', level);
        logger.levels('file', fileLevel);
    },
};

module.exports = Logger;
