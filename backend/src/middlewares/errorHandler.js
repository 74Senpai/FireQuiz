export const errorHandler = (err, req, res, next) => {
  // log stack trace
  console.log(err);

  const status = err.status || 500;

  res.status(status).json({
    message: err.message || "Lỗi máy chủ nội bộ"
  });
}
