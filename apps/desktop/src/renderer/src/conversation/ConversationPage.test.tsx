// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConversationPage } from './ConversationPage';

beforeEach(() => {
  window.location.hash = '#/conversation?exploration=uncertainty-and-crowd&voice=idle';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    configurable: true,
    value: 8,
  });
});

afterEach(() => cleanup());

describe('ConversationPage', () => {
  function composerAreas(): string[] {
    const composer = screen.getByTestId('conversation-composer');
    return Array.from(composer.children).map(
      (child) => (child as HTMLElement).dataset.layoutArea ?? '',
    );
  }

  it('renders the matching exploration and a shared editorial timeline', () => {
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '为什么人在不确定的时候更容易跟随群体？',
      }),
    ).toBeTruthy();
    expect(screen.getByText('当前思维交汇')).toBeTruthy();
    expect(screen.getByText('声线：默认演示声线')).toBeTruthy();
    expect((screen.getByRole('radio', { name: '点击说话' }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it('supports Enter, Shift+Enter, IME composition, empty prevention and clearing', () => {
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    const input = screen.getByRole('textbox', { name: '' });

    fireEvent.change(input, { target: { value: '组合中的中文' } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { isComposing: true, key: 'Enter' });
    expect((input as HTMLTextAreaElement).value).toBe('组合中的中文');

    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect((input as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByText('组合中的中文')).toBeTruthy();

    fireEvent.change(input, { target: { value: '第一行' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect((input as HTMLTextAreaElement).value).toBe('第一行');
  });

  it('shows offline, failure recovery and unknown-id recovery states', () => {
    window.location.hash =
      '#/conversation?exploration=uncertainty-and-crowd&state=offline&voice=idle';
    const { unmount } = render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(screen.getByText('当前处于离线演示状态')).toBeTruthy();
    unmount();

    window.location.hash =
      '#/conversation?exploration=uncertainty-and-crowd&state=error&voice=idle';
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(screen.getByRole('button', { name: '重新尝试' })).toBeTruthy();
    cleanup();

    render(<ConversationPage explorationId="missing" />);
    expect(screen.getByText('没有找到这段探索')).toBeTruthy();
  });

  it('keeps the same explicitly positioned composer regions across response states', () => {
    const idle = render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(composerAreas()).toEqual(['identity', 'text', 'voice']);
    expect(
      screen.getByTestId('conversation-composer-voice').querySelector('.voice-experience'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: '发送文字' })).toBeTruthy();
    idle.unmount();

    window.location.hash =
      '#/conversation?exploration=uncertainty-and-crowd&state=streaming&voice=idle';
    const streaming = render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(composerAreas()).toEqual(['identity', 'text', 'voice']);
    expect(screen.getByRole('button', { name: '停止生成' })).toBeTruthy();
    expect(screen.getByText('Jarvis 正在回答，你可以先整理下一条想法。')).toBeTruthy();
    streaming.unmount();

    window.location.hash =
      '#/conversation?exploration=uncertainty-and-crowd&state=error&voice=idle';
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    expect(composerAreas()).toEqual(['identity', 'text', 'voice']);
    expect(screen.getByRole('button', { name: '重新尝试' })).toBeTruthy();
  });

  it('only follows new content near the bottom and respects reduced motion when returning', () => {
    window.location.hash =
      '#/conversation?exploration=uncertainty-and-crowd&state=streaming&voice=idle&motion=reduced';
    render(<ConversationPage explorationId="uncertainty-and-crowd" />);
    const reading = screen.getByTestId('conversation-reading');
    const scrollTo = vi.fn();
    Object.defineProperties(reading, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 1200 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    reading.scrollTop = 200;

    fireEvent.scroll(reading);
    fireEvent.click(screen.getByRole('button', { name: '回到最新回答' }));
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 1200 });
  });
});
