import AppError from '../utils/app-error.js';
import repository from '../repositories/message.repository.js';

function parseScheduledAt(day, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new AppError('Field "day" must be in YYYY-MM-DD format (e.g. 2026-09-30).', 400);
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new AppError('Field "time" must be in 24-hour HH:mm format (e.g. 14:30).', 400);
  }

  const scheduledAt = new Date(`${day}T${time}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new AppError(
      'The provided day and time could not be parsed into a valid calendar date.',
      400
    );
  }

  return scheduledAt;
}

async function schedule({ message, day, time }) {
  if (!message?.trim() || !day || !time) {
    throw new AppError(
      'Fields "message", "day", and "time" are required to schedule a message.',
      400
    );
  }

  const scheduledAt = parseScheduledAt(day, time);

  if (scheduledAt <= new Date()) {
    throw new AppError('Scheduled date and time must be set in the future.', 400);
  }

  const record = await repository.createScheduled({
    message: message.trim(),
    scheduledAt,
  });

  console.log(`[Scheduler] Queued message for ${day} at ${time}: "${message.trim()}"`);

  return record;
}

const list = () => repository.listMessages();

export default { schedule, list };
