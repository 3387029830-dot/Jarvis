// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { resolveAppRoute } from './routing';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.location.hash = '#/presence?variant=populated&voice=idle';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    configurable: true,
    value: 8,
  });
});

describe('Jarvis application routing and Presence behavior', () => {
  it('uses Presence as the default product route and keeps showcase development-only', () => {
    expect(resolveAppRoute('')).toBe('presence');
    expect(resolveAppRoute('#/presence')).toBe('presence');
    expect(resolveAppRoute('#/design-system')).toBe('design-system');
  });

  it('marks only 此刻 active and disables unfinished navigation', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /此刻/ }).getAttribute('aria-current')).toBe('page');
    for (const label of ['对话', '星图', '演变', '档案', '设置']) {
      expect(
        (screen.getByRole('button', { name: new RegExp(label) }) as HTMLButtonElement).disabled,
      ).toBe(true);
    }
  });

  it('expands an exploration with an honest page-local response', async () => {
    const user = userEvent.setup();
    render(<App />);

    const firstContinueButton = screen.getAllByRole('button', { name: /继续探索/ }).at(0);
    if (!firstContinueButton) {
      throw new Error('Expected at least one exploration action.');
    }
    await user.click(firstContinueButton);

    expect(screen.getByText(/本轮不会调用模型或保存数据/)).toBeTruthy();
  });

  it('does not request microphone access on startup and discloses the real/Mock boundary', () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(<App />);

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByText(/录音与波形来自真实麦克风/)).toBeTruthy();
    expect(screen.getByText(/应用启动时不会主动访问麦克风/)).toBeTruthy();
  });
});
