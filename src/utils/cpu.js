import os from 'node:os';

export function cpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
  }

  return { idle, total };
}

export function calculateCpuUsage(previous, current) {
  const idle = current.idle - previous.idle;
  const total = current.total - previous.total;

  if (total <= 0) return 0;
  return ((total - idle) / total) * 100;
}
