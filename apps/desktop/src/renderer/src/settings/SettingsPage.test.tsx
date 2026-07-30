// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JarvisApi } from '../../../shared/health';
import { SettingsPage } from './SettingsPage';

const getConfig = vi.fn();
const saveConfig = vi.fn();
const testConfig = vi.fn();

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
});
