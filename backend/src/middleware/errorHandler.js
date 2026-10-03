// Database/connection failures are transient infrastructure problems, not bugs in
// the request. Reporting them as 503 lets clients (and any load balancer) retry
// instead of treating a recoverable blip as a permanent server error.
const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  '08000',
  '08003',
  '08006',
  '53300',
  '57P01'
]);

function isDatabaseUnavailable(err) {
  if (!err) return false;
  if (DB_UNAVAILABLE_CODES.has(err.code)) return true;
  return /Client has encountered a connection error|Connection terminated|timeout exceeded|Connection terminated unexpectedly|connect ECONNREFUSED/i.test(
    err.message || ''
  );
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const dbDown = isDatabaseUnavailable(err);

  let status;
  if (dbDown) {
    status = 503;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
  } else {
    status = err.status || 500;
  }

  const message =
    err.message === 'Validation error' && Array.isArray(err.details) && err.details.length
      ? err.details[0]
      : err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Please upload a smaller file.'
        : dbDown
          ? 'Database is temporarily unavailable. Please try again.'
          : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || undefined,
      details: err.details || undefined
    }
  });
}

module.exports = errorHandler;
