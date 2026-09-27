import { getImportStatus, startImport } from '../services/import.service.js';
import { success } from '../utils/response.js';

export async function upload(req, res) {
  const job = await startImport(req.file);

  return success(
    res,
    {
      jobId: job._id,
      status: job.status,
      message: 'File accepted for processing. Check job status for progress.',
    },
    202
  );
}

export async function status(req, res) {
  return success(res, await getImportStatus(req.params.jobId));
}
