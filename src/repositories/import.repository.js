import ImportJob from '../models/ImportJob.js';

const create = (data) => ImportJob.create(data);
const findById = (id) => ImportJob.findById(id).lean();
const update = (id, data) => ImportJob.findByIdAndUpdate(id, data, { new: true }).lean();

export default { create, findById, update };
