import { describe, expect, it } from 'vitest';

import { ProviderFailure, toProviderError } from './provider-error';

describe('Provider error redaction', () => {
  it('does not serialize causes, keys or private Provider bodies', () => {
    const error = toProviderError(
      new ProviderFailure('network', {
        cause: new Error('Authorization: Bearer secret-key and private response'),
        safeTechnicalSummary: 'fetch_failed',
      }),
      'request-safe',
    );
    expect(error).toMatchObject({
      code: 'network',
      providerId: 'openai-compatible',
      requestId: 'request-safe',
      safeTechnicalSummary: 'fetch_failed',
    });
    expect(JSON.stringify(error)).not.toContain('secret-key');
    expect(JSON.stringify(error)).not.toContain('private response');
  });
});
