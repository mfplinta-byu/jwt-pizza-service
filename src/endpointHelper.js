const logger = require('./logging.js');
class StatusCodeError extends Error {
  // TODO Add in logging for unhandled errors
  constructor(message, statusCode) {
    logger.log('error', 'http', { message, statusCode });
    super(message);
    this.statusCode = statusCode;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  asyncHandler,
  StatusCodeError,
};
