import repository from '../repositories/message.repository.js';

export async function processDueMessages() {
  const dueMessages = await repository.findDue();

  for (const scheduled of dueMessages) {
    const locked = await repository.markProcessing(scheduled._id);

    if (!locked) continue;

    try {
      await repository.createMessage({
        message: locked.message,
        scheduledMessageId: locked._id,
        postedAt: new Date(),
      });

      await repository.markCompleted(locked._id);
      console.log(`[Scheduler] Inserted due message into database: "${locked.message}"`);
    } catch (error) {
      await repository.markFailed(locked._id, error.message);
      console.error(`[Scheduler] Failed to process message ${locked._id}:`, error.message || error);
    }
  }
}
