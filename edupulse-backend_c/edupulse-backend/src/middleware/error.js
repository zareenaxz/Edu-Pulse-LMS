function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Upload problems (file too big, too many files, disallowed type) are client errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
  }
  if (err.message && err.message.startsWith('File type not allowed')) statusCode = 400;

  // MySQL duplicate entry (unique constraint violation)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  // MySQL foreign key constraint failures
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    message = 'Cannot delete: this record is referenced by other data';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
