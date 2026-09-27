import { processDueMessages } from '../services/scheduled-message.service.js';

let isProcessing = false;

export function start() {
  return setInterval(async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      await processDueMessages();
    } catch (error) {
      console.error('[Scheduler] Error in recurring job execution:', error.message || error);
    } finally {
      isProcessing = false;
    }
  }, 5000);
}
