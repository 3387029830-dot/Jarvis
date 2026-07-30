import { describe, expect, it, vi } from 'vitest';

import { selectRecordingMimeType, stopMediaStream, VOICE_CAPTURE_LIMITS } from './voice-capture';

describe('voice capture boundaries', () => {
  it('keeps the duration limits centralized', () => {
    expect(VOICE_CAPTURE_LIMITS.minimumDurationMs).toBe(300);
    expect(VOICE_CAPTURE_LIMITS.maximumDurationMs).toBe(60_000);
  });

  it('chooses the first browser-supported recording format', () => {
    const isTypeSupported = vi.fn((type: string) => type === 'audio/webm');
    expect(selectRecordingMimeType({ isTypeSupported })).toBe('audio/webm');
  });

  it('falls back to the browser default format', () => {
    expect(selectRecordingMimeType({ isTypeSupported: () => false })).toBe('');
  });

  it('stops every stream track during cleanup', () => {
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    stopMediaStream({ getTracks: () => [first, second] } as unknown as MediaStream);
    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });
});
