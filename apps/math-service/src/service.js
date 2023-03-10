const msInterface = require('message-service-interface');

const logger = require('./utils/logger');
const { msOptions } = require('./config');
const subscribe = require('./subscribe');

const shutDown = async () => {
  const shutDownTimeout = setTimeout(() => {
    logger.error('Failed to shut down, forcefully shutting down');
    process.exit(1);
  }, 10000);

  try {
    if (msInterface.isConnected()) {
      logger.info('Closing connection to message service...');
      await msInterface.close();
      logger.info('Message service connection closed successfully');
    }

    logger.info('Service shut down successfully');
    clearTimeout(shutDownTimeout);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to shut down, forcefully shutting down', { error });
    clearTimeout(shutDownTimeout);
    process.exit(1);
  }
};

const handleSignal = async (signal) => {
  logger.info('Received signal to terminate', { signal });
  await shutDown();
};

const handleFatalError = async (error) => {
  logger.fatal('Fatal error, shutting down', { error });
  await shutDown();
};

const start = async () => {
  logger.info('Connecting to message service', { server: msOptions.servers });
  const connectionEmitter = await msInterface.connect(msOptions);
  logger.info('Message service connected successfully');
  connectionEmitter.on('error', handleFatalError);

  subscribe();
  logger.info('Subscribed to message service successfully');
};

module.exports = { start, handleSignal, handleFatalError };
