export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - endpoint not found.`,
  });
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value provided for field "${err.path}".`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'Uploaded file exceeds the maximum allowed size of 20MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = "Unexpected form field. Please upload the file using the field name 'file'.";
    }
  }

  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  } else {
    console.warn(`[Request Error ${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
