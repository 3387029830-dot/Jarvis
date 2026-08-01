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
      speech: {
        cancel: vi.fn(),
        deleteCredential: vi.fn(),
        getConfig: vi.fn(),
        saveConfig: vi.fn(),
        testConfig: vi.fn(),
        transcribe: vi.fn(),
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
    const nextDraft = '先保留这条下一步想法';
    fireEvent.change(input, { target: { value: nextDraft } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(start).toHaveBeenCalledTimes(2);
    expect((input as HTMLTextAreaElement).value).toBe(nextDraft);

    const reading = screen.getByTestId('conversation-reading');
    Object.defineProperties(reading, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 1200 },
    });
    reading.scrollTop = 100;
    fireEvent.scroll(reading);
    const streamingRequestId = (start.mock.calls[1]?.[0] as { requestId?: string } | undefined)
      ?.requestId;
    act(() => {
      streamListener?.({
        content: '用户向上阅读后新增的流式片段。',
        requestId: streamingRequestId ?? '',
        type: 'delta',
      });
    });
    expect(reading.scrollTop).toBe(100);

    fireEvent.click(screen.getByRole('button', { name: '停止生成' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledOnce());
    expect((input as HTMLTextAreaElement).value).toBe(nextDraft);
    expect(screen.getByRole('button', { name: '发送文字' })).toBeTruthy();

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
    expect(
      Array.from(screen.getByTestId('conversation-composer').children).map(
        (child) => (child as HTMLElement).dataset.layoutArea,
      ),
    ).toEqual(['identity', 'text', 'voice']);
  });
});
