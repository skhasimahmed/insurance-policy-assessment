import app from './app.js';
import { port } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { start as startCpuMonitor } from './jobs/cpu-monitor.job.js';
import { start as startScheduledMessageJob } from './jobs/scheduled-message.job.js';

async function startServer() {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`[Server] Service is online and listening at http://localhost:${port}`);
  });

  startCpuMonitor();
  startScheduledMessageJob();

  const shutdown = async (signal) => {
    console.log(`[Server] ${signal} signal received. Gracefully closing connections...`);
    server.close(async () => {
      try {
        await disconnectDatabase();
      } catch (error) {
        console.error('[Server] Error while disconnecting database:', error);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('[Server] Startup error:', error);
  process.exit(1);
});
