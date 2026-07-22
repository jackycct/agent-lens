export interface TimerResult {
  startedAt: Date;
  endedAt: Date;
  wallMs: number;
}

export async function measure<T>(fn: () => Promise<T>): Promise<T & { timer: TimerResult }> {
  const startedAt = new Date();
  const start = performance.now();
  const value = await fn();
  const endedAt = new Date();
  const wallMs = Math.round(performance.now() - start);
  return { ...value, timer: { startedAt, endedAt, wallMs } };
}
