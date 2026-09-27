import { success } from '../utils/response.js';

export function health(req, res) {
  return success(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
}
