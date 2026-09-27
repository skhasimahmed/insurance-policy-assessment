import AppError from '../utils/app-error.js';
import repository from '../repositories/policy.repository.js';

async function search(username, { page = 1, limit = 10 } = {}) {
  if (!username?.trim()) {
    throw new AppError('Query parameter "username" is required to search policies.', 400);
  }

  return repository.searchByUsername(username.trim(), { page, limit });
}

async function aggregateByUser({ page = 1, limit = 10 } = {}) {
  return repository.aggregateByUser({ page, limit });
}

export default { search, aggregateByUser };
