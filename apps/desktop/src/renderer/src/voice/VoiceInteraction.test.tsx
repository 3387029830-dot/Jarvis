// @vitest-environment jsdom

import { useRef, useSyncExternalStore } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PresenceOrb } from '../presence/PresenceOrb';
import type { LocalPlayback } from './local-playback';
import type { MockVoiceLoopOptions } from './mock-voice-loop';
import type { VoiceCaptureSession } from './voice-capture';
import { VoiceController, type VoiceControllerDependencies } from './voice-controller';
import type { VoiceInteractionMode } from './interaction-mode';
import { VoiceInteraction } from './VoiceInteraction';

const controllers: VoiceController[] = [];

afterEach(() => {
  cleanup();
  for (const controller of controllers.splice(0)) {
    controller.dispose();
  }
});

function createController(options?: {
  readonly runMockLoop?: (loop: MockVoiceLoopOptions) => Promise<void>;
}) {
  const capture: VoiceCaptureSession = {
    cancel: vi.fn(async () => undefined),
    stop: vi.fn(async () => ({
      blob: new Blob(['audio']),
      durationMs: 800,
      mimeType: 'audio/webm',
    })),
  };
  const playback: LocalPlayback = {
    play: vi.fn(async () => undefined),
    stop: vi.fn(),
  };
  const requestMicrophone = vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream);
  const dependencies: VoiceControllerDependencies = {
    createCapture: vi.fn(() => capture),
    playback,
    requestMicrophone,
    runMockLoop:
      options?.runMockLoop ??
      vi.fn(async ({ callbacks }) => {
        callbacks.onTranscript('模拟转录');
        callbacks.onUnderstandingFinished();
        callbacks.onResponseChunk('模拟回答');
        callbacks.onSpeakingStarted();
        callbacks.onCompleted();
      }),
    setTimeout: vi.fn((callback) => {
      callback();
      return 1;
    }),
    stopStream: vi.fn(),
  };
  const controller = new VoiceController(dependencies);
  controllers.push(controller);
  return { capture, controller, requestMicrophone };
}

function Harness({
  controller,
  mode = 'hold',
  reducedMotion = false,
}: {
  readonly controller: VoiceController;
  readonly mode?: VoiceInteractionMode;
  readonly reducedMotion?: boolean;
}): React.JSX.Element {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const binding = {
    beginExternalResponse: () => controller.beginExternalResponse(),
    cancel: () => controller.cancel(),
    completeExternalResponse: () => controller.completeExternalResponse(),
    confirmTranscript: (transcript: string) => controller.confirmTranscript(transcript),
    failExternalResponse: (message: string) => controller.failExternalResponse(message),
    pressStart: () => controller.pressStart(),
    recover: () => controller.recover(),
    replaceExternalResponse: (response: string) => controller.replaceExternalResponse(response),
    release: () => controller.release(),
    restartCapture: () => controller.restartCapture(),
    retryTranscription: () => controller.retryTranscription(),
    state,
  };
  return (
    <>
      <PresenceOrb motion={reducedMotion ? 'static' : 'ambient'} state={state} />
      <VoiceInteraction
        controller={binding}
        isEvidence={false}
        mode={mode}
        onModeChange={vi.fn()}
        reducedMotion={reducedMotion}
        state={state}
        voiceButtonRef={buttonRef}
      />
    </>
  );
}

describe('VoiceInteraction', () => {
  it('uses click and keyboard activation as start/finish in toggle mode', async () => {
    const { controller, requestMicrophone } = createController();
    render(<Harness controller={controller} mode="toggle" />);
    const button = screen.getByRole('button', { name: /点击说话/ });
    fireEvent.click(button);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /点击发送/ })).toBeTruthy());
    expect(requestMicrophone).toHaveBeenCalledOnce();
    expect(screen.getByText('再次点击发送')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /点击发送/ }));
    await vi.waitFor(() =>
      expect(document.querySelector('.voice-round__response p')?.textContent).toBe('模拟回答'),
    );
  });

  it('requests permission only after pointer press and releases into the Mock loop', async () => {
    const { controller, requestMicrophone } = createController();
    render(<Harness controller={controller} />);
    expect(requestMicrophone).not.toHaveBeenCalled();

    const button = screen.getByRole('button', { name: /按住说话/ });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1, pointerType: 'mouse' });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /松开发送/ })).toBeTruthy());
    expect(requestMicrophone).toHaveBeenCalledOnce();
    expect(screen.getByRole('img', { name: /正在聆听/ })).toBeTruthy();

    fireEvent.pointerUp(screen.getByRole('button', { name: /松开发送/ }), {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    });
    await vi.waitFor(() =>
      expect(document.querySelector('.voice-round__response p')?.textContent).toBe('模拟回答'),
    );
    expect(screen.getByText('演示 Mock')).toBeTruthy();
  });

  it('supports keyboard hold/release and ignores key repeat', async () => {
    const { controller, requestMicrophone } = createController();
    render(<Harness controller={controller} />);
    const button = screen.getByRole('button', { name: /按住说话/ });

    fireEvent.keyDown(button, { key: ' ', repeat: false });
    fireEvent.keyDown(button, { key: ' ', repeat: true });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /松开发送/ })).toBeTruthy());
    expect(requestMicrophone).toHaveBeenCalledOnce();

    fireEvent.keyUp(screen.getByRole('button', { name: /松开发送/ }), { key: ' ' });
    await vi.waitFor(() =>
      expect(document.querySelector('.voice-round__response p')?.textContent).toBe('模拟回答'),
    );
  });

  it('cancels with Escape and keeps reduced-motion state feedback', async () => {
    const { capture, controller } = createController();
    render(<Harness controller={controller} reducedMotion />);
    const button = screen.getByRole('button', { name: /按住说话/ });
    fireEvent.keyDown(button, { key: 'Enter', repeat: false });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /松开发送/ })).toBeTruthy());

    fireEvent.keyDown(window, { key: 'Escape' });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /按住说话/ })).toBeTruthy());
    expect(capture.cancel).toHaveBeenCalled();
    expect(document.querySelector('.voice-waveform')?.getAttribute('data-reduced-motion')).toBe(
      'true',
    );
  });

  it('keeps keyboard focus so a new hold interrupts speaking', async () => {
    const { controller, requestMicrophone } = createController({
      runMockLoop: async ({ callbacks, signal }) => {
        callbacks.onTranscript('模拟转录');
        callbacks.onUnderstandingFinished();
        callbacks.onResponseChunk('模拟回答');
        callbacks.onSpeakingStarted();
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        });
      },
    });
    render(<Harness controller={controller} />);
    const button = screen.getByRole('button', { name: /按住说话/ });
    button.focus();
    fireEvent.keyDown(button, { key: ' ', repeat: false });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /松开发送/ })).toBeTruthy());
    fireEvent.keyUp(screen.getByRole('button', { name: /松开发送/ }), { key: ' ' });
    await vi.waitFor(() =>
      expect(screen.getByRole('img', { name: /正在本地播放演示回应/ })).toBeTruthy(),
    );
    const speakingButton = screen.getByRole('button', { name: /按住说话/ });
    expect(document.activeElement).toBe(speakingButton);

    fireEvent.keyDown(speakingButton, { key: ' ', repeat: false });
    await vi.waitFor(() => expect(requestMicrophone).toHaveBeenCalledTimes(2));
  });
});
