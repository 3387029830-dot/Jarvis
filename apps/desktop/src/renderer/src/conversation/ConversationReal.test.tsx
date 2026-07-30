// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JarvisApi } from '../../../shared/health';
import type { ConversationStreamEvent } from '../../../shared/provider';
import { ConversationPage } from './ConversationPage';

let streamListener: ((event: ConversationStreamEvent) => void) | null = null;
const start = vi.fn();
const cancel = vi.fn();

beforeEach(() => {
  window.location.hash = '#/conversation?exploration=uncertainty-and-crowd&voice=idle';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
  start.mockResolvedValue({
    config: {
      baseUrl: 'https://provider.example/v1',
      hasCredential: true,
      keySuffix: '2468',
      lastTestedAt: '2026-07-30T08:00:00.000Z',
      mode: 'real',
      model: 'model',
    },
    ok: true,
  });
  cancel.mockResolvedValue(undefined);
  Object.defineProperty(window, 'jarvis', {
    configurable: true,
    value: {
      conversation: {
        cancel,
        onEvent: vi.fn((listener) => {
          streamListener = listener;
          return () => {
            streamListener = null;
          };
        }),
        start,
      },
      healthCheck: vi.fn(),
      provider: {
        deleteCredential: vi.fn(),
        getConfig: vi.fn().mockResolvedValue({
          baseUrl: 'https://provider.example/v1',
          hasCredential: true,
          keySuffix: '2468',
          lastTestedAt: '2026-07-30T08:00:00.000Z',
          mode: 'real',
          model: 'model',
        }),
        saveConfig: vi.fn(),
        testConfig: vi.fn(),
      },
    } satisfies JarvisApi,
  });
});

afterEach(() => {
  cleanup();
  streamListener = null;
});

describe('Conversation real Provider path', () => {
  it('streams, cancels and retries without duplicating the user turn', async () => {
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    await screen.findByText('真实文字 Provider');
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '一个真实问题' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(start).toHaveBeenCalledOnce());
    const requestId = (start.mock.calls[0]?.[0] as { requestId?: string } | undefined)?.requestId;
    expect(requestId).toBeTruthy();

    act(() => {
      streamListener?.({ content: '真实', requestId: requestId ?? '', type: 'delta' });
      streamListener?.({ content: '回答', requestId: requestId ?? '', type: 'delta' });
      streamListener?.({ requestId: requestId ?? '', type: 'complete' });
    });
    expect(screen.getByText('真实回答')).toBeTruthy();

    fireEvent.change(input, { target: { value: '需要取消的问题' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: '取消本轮' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledOnce());

    const cancelledRequestId = (start.mock.calls[1]?.[0] as { requestId?: string } | undefined)
      ?.requestId;
    act(() => {
      streamListener?.({
        error: {
          code: 'network',
          message: '无法连接到 Provider，请检查网络和服务地址。',
          providerId: 'openai-compatible',
          requestId: cancelledRequestId ?? '',
          retryable: true,
          safeTechnicalSummary: 'test_network',
        },
        requestId: cancelledRequestId ?? '',
        type: 'error',
      });
    });
    expect(screen.queryByText('test_network')).toBeNull();

    fireEvent.change(input, { target: { value: '需要重试的问题' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(start).toHaveBeenCalledTimes(3));
    const failedRequestId = (start.mock.calls[2]?.[0] as { requestId?: string } | undefined)
      ?.requestId;
    act(() => {
      streamListener?.({
        error: {
          code: 'network',
          message: '无法连接到 Provider，请检查网络和服务地址。',
          providerId: 'openai-compatible',
          requestId: failedRequestId ?? '',
          retryable: true,
          safeTechnicalSummary: 'test_network',
        },
        requestId: failedRequestId ?? '',
        type: 'error',
      });
    });
    fireEvent.click(screen.getByRole('button', { name: '重新尝试' }));
    await waitFor(() => expect(start).toHaveBeenCalledTimes(4));
    expect(screen.getAllByText('需要重试的问题')).toHaveLength(1);
  });
});
