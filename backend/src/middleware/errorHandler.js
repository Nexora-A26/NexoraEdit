export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'العنصر غير موجود.' });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const isUploadError = error?.name === 'MulterError';
  const status = error.status || (isUploadError ? 400 : 500);
  const safeMessage = isUploadError
    ? (error.code === 'LIMIT_FILE_SIZE' ? 'The uploaded file is too large.' : 'The upload could not be accepted.')
    : error.message;
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : (safeMessage || 'حدث خطأ داخلي في الخادم.')
  });
}
