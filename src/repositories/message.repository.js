import ScheduledMessage from '../models/ScheduledMessage.js';
import Message from '../models/Message.js';

const createScheduled = (data) => ScheduledMessage.create(data);
const findDue = () =>
  ScheduledMessage.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() },
  }).limit(100);
const markProcessing = (id) =>
  ScheduledMessage.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true }
  );
const markCompleted = (id) => ScheduledMessage.findByIdAndUpdate(id, { status: 'completed' });
const markFailed = (id, error) =>
  ScheduledMessage.findByIdAndUpdate(id, { status: 'failed', error });
const createMessage = (data) => Message.create(data);
const listMessages = () => Message.find().sort({ postedAt: -1 });

export default {
  createScheduled,
  findDue,
  markProcessing,
  markCompleted,
  markFailed,
  createMessage,
  listMessages,
};
