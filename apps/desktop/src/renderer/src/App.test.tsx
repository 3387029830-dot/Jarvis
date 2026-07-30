// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { resolveAppRoute } from './routing';
import { resetVoiceInteractionModeForTests } from './voice/interaction-mode';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  resetVoiceInteractionModeForTests();
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
    expect(resolveAppRoute('#/conversation?exploration=uncertainty-and-crowd')).toBe(
      'conversation',
    );
    expect(resolveAppRoute('#/design-system')).toBe('design-system');
  });

  it('marks only 此刻 active and disables unfinished navigation', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /此刻/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /对话/ }).getAttribute('aria-current')).toBeNull();
    for (const label of ['星图', '演变', '档案']) {
      expect(
        (screen.getByRole('button', { name: new RegExp(label) }) as HTMLButtonElement).disabled,
      ).toBe(true);
    }
    expect(screen.getByRole('link', { name: /设置/ }).getAttribute('href')).toBe('#/settings');
  });

  it('continues an exploration in the matching Conversation route', async () => {
    const user = userEvent.setup();
    render(<App />);

    const firstContinueButton = screen.getAllByRole('button', { name: /继续探索/ }).at(0);
    if (!firstContinueButton) {
      throw new Error('Expected at least one exploration action.');
    }
    await user.click(firstContinueButton);

    expect(window.location.hash).toContain('#/conversation?exploration=uncertainty-and-crowd');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '为什么人在不确定的时候更容易跟随群体？',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /对话/ }).getAttribute('aria-current')).toBe('page');
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

  it('shares the selected voice interaction mode between Presence and Conversation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: '按住说话' }));
    const firstContinueButton = screen.getAllByRole('button', { name: /继续探索/ })[0];
    if (!firstContinueButton) {
      throw new Error('Expected at least one exploration action.');
    }
    await user.click(firstContinueButton);
    expect(
      ((await screen.findByRole('radio', { name: '按住说话' })) as HTMLInputElement).checked,
    ).toBe(true);
  });
});
