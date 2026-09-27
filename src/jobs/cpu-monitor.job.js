import { startCpuMonitor } from '../services/cpu.service.js';

export function start() {
  return startCpuMonitor();
}
