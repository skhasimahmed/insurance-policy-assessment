export function success(res, data, statusCode = 200, pagination = null) {
  const payload = { success: true };

  if (pagination) {
    payload.pagination = pagination;
  }

  payload.data = data;

  return res.status(statusCode).json(payload);
}
