// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JarvisApi } from '../../../shared/health';
import { SettingsPage } from './SettingsPage';

const getConfig = vi.fn();
const saveConfig = vi.fn();
const testConfig = vi.fn();
const speechGetConfig = vi.fn();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(): void {
    this.removeAttribute('open');
  };
});

beforeEach(() => {
  getConfig.mockResolvedValue({
    baseUrl: 'https://provider.example/v1',
    hasCredential: true,
    keySuffix: '2468',
    lastTestedAt: null,
    mode: 'mock',
    model: 'provider-model',
  });
  testConfig.mockResolvedValue({ latencyMs: 24, ok: true });
  saveConfig.mockResolvedValue({
    config: {
      baseUrl: 'https://provider.example/v1',
      hasCredential: true,
      keySuffix: '2468',
      lastTestedAt: '2026-07-30T08:00:00.000Z',
      mode: 'real',
      model: 'provider-model',
    },
    ok: true,
  });
  speechGetConfig.mockResolvedValue({
    baseUrl: 'https://speech.example/v1',
    credentialSource: 'independent',
    hasCredential: true,
    keySuffix: '1357',
    language: 'zh',
    lastTestedAt: null,
    mode: 'mock',
    model: 'speech-model',
    providerId: 'openai-compatible',
    timeoutMs: 45000,
  });
  Object.defineProperty(window, 'jarvis', {
    configurable: true,
    value: {
      conversation: {
        cancel: vi.fn(),
        onEvent: vi.fn().mockReturnValue(() => undefined),
        start: vi.fn(),
      },
      healthCheck: vi.fn(),
      provider: {
        deleteCredential: vi.fn(),
        getConfig,
        saveConfig,
        testConfig,
      },
      speech: {
        cancel: vi.fn(),
        deleteCredential: vi.fn(),
        getConfig: speechGetConfig,
        saveConfig: vi.fn(),
        testConfig: vi.fn(),
        transcribe: vi.fn(),
      },
      tts: {
        cancel: vi.fn(),
        deleteCredential: vi.fn(),
        deleteProfile: vi.fn(),
        getConfig: vi.fn(),
        installProfile: vi.fn(),
        saveConfig: vi.fn(),
        selectProfile: vi.fn(),
        synthesize: vi.fn(),
        testConfig: vi.fn(),
      },
    } satisfies JarvisApi,
  });
});

afterEach(() => cleanup());

describe('SettingsPage', () => {
  it('shows only the credential suffix and tests without saving', async () => {
    render(<SettingsPage />);
    await screen.findByDisplayValue('provider-model');
    expect(screen.getByPlaceholderText(/末四位 2468/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('secret');

    fireEvent.click(screen.getByRole('button', { name: '测试连接' }));
    await screen.findByText(/连接测试通过/);
    expect(testConfig).toHaveBeenCalledOnce();
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('requires a successful save path to enable real mode', async () => {
    render(<SettingsPage />);
    await screen.findByDisplayValue('provider-model');
    fireEvent.click(screen.getByRole('radio', { name: /真实文字回答/ }));
    fireEvent.click(screen.getByRole('button', { name: '保存配置' }));
    await waitFor(() =>
      expect(saveConfig).toHaveBeenCalledWith({
        baseUrl: 'https://provider.example/v1',
        mode: 'real',
        model: 'provider-model',
      }),
    );
    expect(await screen.findByText(/真实文字回答现已启用/)).toBeTruthy();
  });

  it('warns before leaving a dirty chapter and keeps its form state mounted', async () => {
    render(<SettingsPage />);
    const conversationModel = await screen.findByDisplayValue('provider-model');
    fireEvent.change(conversationModel, { target: { value: 'unsaved-conversation-model' } });
    fireEvent.click(screen.getByRole('button', { name: /语音识别/ }));

    expect(screen.getByRole('dialog', { name: '切换到另一个设置章节？' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '保留修改并切换' }));
    expect(await screen.findByDisplayValue('speech-model')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /文字对话/ }));
    expect(screen.getByDisplayValue('unsaved-conversation-model')).toBeTruthy();
  });

  it('preserves an unsaved speech chapter and masks its credential', async () => {
    render(<SettingsPage />);
    await screen.findByDisplayValue('provider-model');
    fireEvent.click(screen.getByRole('button', { name: /语音识别/ }));
    const speechModel = await screen.findByDisplayValue('speech-model');
    expect(screen.getByPlaceholderText(/末四位 1357/)).toBeTruthy();
    fireEvent.change(speechModel, { target: { value: 'unsaved-speech-model' } });
    fireEvent.click(screen.getByRole('button', { name: /文字对话/ }));
    expect(screen.getByRole('dialog', { name: '切换到另一个设置章节？' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '保留修改并切换' }));
    fireEvent.click(screen.getByRole('button', { name: /语音识别/ }));
    expect(screen.getByDisplayValue('unsaved-speech-model')).toBeTruthy();
    expect(document.body.textContent).not.toContain('speech-secret');
  });
});
