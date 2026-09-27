import { cpuSnapshot, calculateCpuUsage } from '../utils/cpu.js';
import { cpuThreshold, cpuCheckInterval } from '../config/env.js';

export function startCpuMonitor() {
  let previous = cpuSnapshot();
  let restarting = false;

  const timer = setInterval(() => {
    const current = cpuSnapshot();
    const usage = calculateCpuUsage(previous, current);
    previous = current;

    console.log(`[Monitor] CPU usage: ${usage.toFixed(2)}% (limit: ${cpuThreshold}%)`);

    if (usage >= cpuThreshold && !restarting) {
      restarting = true;
      console.warn(
        `[Monitor] CPU threshold exceeded (${usage.toFixed(2)}% >= ${cpuThreshold}%). Initiating restart for PM2 recovery...`
      );
      clearInterval(timer);
      process.kill(process.pid, 'SIGTERM');
    }
  }, cpuCheckInterval);

  return timer;
}
