
const notFound = (req, res, next) => {
  const err = new Error('Route Not Found');
  err.status = 404;
  next(err);
}

const errorHandler = (err, req, res, next) => {
  // Set default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error for debugging
  console.error(`Error ${status}: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Send error response
  res.status(status).json({
    error: message,
    status: status,
    path: req.path
  });
};

module.exports = { notFound, errorHandler };
