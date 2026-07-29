import { describe, expect, it, vi } from 'vitest';

import { HEALTH_CHECK_CHANNEL } from '../shared/health';
import { registerHealthCheckHandler } from './health-handler';

describe('registerHealthCheckHandler', () => {
  it('registers only the fixed health-check contract', () => {
    const handle = vi.fn();
    const removeHandler = vi.fn();

    registerHealthCheckHandler({ handle, removeHandler });

    expect(removeHandler).toHaveBeenCalledWith(HEALTH_CHECK_CHANNEL);
    expect(handle).toHaveBeenCalledOnce();
    expect(handle).toHaveBeenCalledWith(HEALTH_CHECK_CHANNEL, expect.any(Function));

    const handler = handle.mock.calls[0]?.[1] as (() => unknown) | undefined;
    expect(handler?.()).toEqual({ process: 'main', status: 'ok' });
  });
});
