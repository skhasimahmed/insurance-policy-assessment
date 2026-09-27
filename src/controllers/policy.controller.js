import service from '../services/policy.service.js';
import { success } from '../utils/response.js';

export async function search(req, res) {
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
  const page = isPaginated ? Math.max(1, Number(req.query.page) || 1) : null;
  const limit = isPaginated ? Math.max(1, Number(req.query.limit) || 10) : null;

  const result = await service.search(req.query.username, { page, limit });

  if (isPaginated) {
    return success(res, result.data, 200, result.pagination);
  }

  return success(res, result);
}

export async function summary(req, res) {
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
  const page = isPaginated ? Math.max(1, Number(req.query.page) || 1) : null;
  const limit = isPaginated ? Math.max(1, Number(req.query.limit) || 10) : null;

  const result = await service.aggregateByUser({ page, limit });

  if (isPaginated) {
    return success(res, result.data, 200, result.pagination);
  }

  return success(res, result);
}
