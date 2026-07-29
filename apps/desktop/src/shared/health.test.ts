import { describe, expect, it } from 'vitest';

import { createHealthCheckResult, HEALTH_CHECK_CHANNEL } from './health';

describe('health-check contract', () => {
  it('uses a namespaced, fixed IPC channel', () => {
    expect(HEALTH_CHECK_CHANNEL).toBe('jarvis:health-check');
  });

  it('returns the minimal typed main-process response', () => {
    expect(createHealthCheckResult()).toEqual({
      process: 'main',
      status: 'ok',
    });
  });
});
