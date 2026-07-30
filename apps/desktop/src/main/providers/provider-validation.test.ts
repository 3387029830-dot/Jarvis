import { describe, expect, it } from 'vitest';

import { ProviderFailure } from './provider-error';
import {
  validateConversationRequest,
  validateProviderBaseUrl,
  validateProviderSave,
} from './provider-validation';

describe('provider runtime validation', () => {
  it('accepts HTTPS and explicit localhost development URLs', () => {
    expect(validateProviderBaseUrl('https://provider.example/v1/')).toBe(
      'https://provider.example/v1',
    );
    expect(validateProviderBaseUrl('http://localhost:8080/v1')).toBe('http://localhost:8080/v1');
  });

  it.each([
    'http://provider.example/v1',
    'https://user:secret@provider.example/v1',
    'https://provider.example/v1?api_key=secret',
    'file:///tmp/provider',
  ])('rejects unsafe base URL %s', (url) => {
    expect(() => validateProviderBaseUrl(url)).toThrow(ProviderFailure);
  });

  it('validates mode and trims provider inputs', () => {
    expect(
      validateProviderSave({
        apiKey: ' secret ',
        baseUrl: 'https://provider.example/v1/',
        mode: 'real',
        model: ' model-id ',
      }),
    ).toEqual({
      apiKey: 'secret',
      baseUrl: 'https://provider.example/v1',
      mode: 'real',
      model: 'model-id',
    });
  });

  it('limits conversation context and validates roles', () => {
    expect(
      validateConversationRequest({
        context: {
          domains: ['心理学'],
          exploration: '为什么会从众？',
          recentMessages: [{ content: '因为不确定。', role: 'assistant' }],
        },
        requestId: 'request-1',
        userMessage: '继续说。',
      }),
    ).toMatchObject({ requestId: 'request-1', userMessage: '继续说。' });
    expect(() =>
      validateConversationRequest({
        context: {
          domains: [],
          exploration: 'x',
          recentMessages: [{ content: 'x', role: 'tool' }],
        },
        requestId: 'request-2',
        userMessage: 'x',
      }),
    ).toThrow(ProviderFailure);
  });
});
