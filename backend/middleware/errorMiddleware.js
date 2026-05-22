const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // If the status code is 200 (OK), we change it to 500 (Internal Server Error) because an error occurred. Otherwise, we keep the existing status code.
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : "", // in development, we show error line by line for debugging purposes. 
    // In production, we hide it for security reasons from potential hacker attackts.
  });
};


export { notFound, errorHandler };