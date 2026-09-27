import service from '../services/message.service.js';
import { success } from '../utils/response.js';

export async function schedule(req, res) {
  const scheduled = await service.schedule(req.body);
  return success(res, scheduled, 201);
}

export async function list(req, res) {
  return success(res, await service.list());
}
