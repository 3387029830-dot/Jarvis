import {
  useEffect,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';

import { copy } from '../copy';
import { Badge, Button } from '../design-system';
import { presentVoiceState, type VoiceControllerState } from './voice-state';
import type { VoiceControllerBinding } from './use-voice-controller';

function formatDuration(durationMs: number): string {
  const totalTenths = Math.floor(durationMs / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

function VoiceWaveform({
  level,
  reducedMotion,
}: {
  level: number;
  reducedMotion: boolean;
}): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="voice-waveform"
      data-reduced-motion={reducedMotion || undefined}
    >
      {Array.from({ length: 24 }, (_, index) => {
        const contour = 0.32 + (((index * 7) % 13) + 2) / 15;
        const height = 4 + Math.max(0.08, level) * contour * 30;
        const style = { '--voice-bar-height': `${height.toFixed(1)}px` } as CSSProperties;
        return <i key={index} style={style} />;
      })}
    </div>
  );
}

function CurrentVoiceRound({
  onCancel,
  onRecover,
  reducedMotion,
  state,
}: {
  onCancel(): void;
  onRecover(): void;
  reducedMotion: boolean;
  state: VoiceControllerState;
}): React.JSX.Element {
  const presentation = presentVoiceState(state, copy.voice.state);
  const canCancel = ['listening', 'transcribing', 'understanding', 'responding_text'].includes(
    state.phase,
  );

  return (
    <section
      aria-labelledby="voice-round-title"
      className="voice-round"
      data-voice-phase={state.phase}
    >
      <header className="voice-round__header">
        <div>
          <p>{copy.voice.roundTitle}</p>
          <h2 id="voice-round-title">{presentation.label}</h2>
        </div>
        <Badge tone={state.phase === 'error' ? 'danger' : 'warning'}>{copy.voice.mockBadge}</Badge>
      </header>

      <div aria-atomic="true" aria-live="polite" className="voice-round__status" role="status">
        <span className="voice-round__status-mark" aria-hidden="true" />
        <div>
          <strong>{presentation.action}</strong>
          <p>{presentation.detail}</p>
        </div>
        {state.durationMs > 0 ? (
          <time dateTime={`PT${Math.round(state.durationMs / 1000)}S`}>
            <small>{copy.voice.durationLabel}</small>
            {formatDuration(state.durationMs)}
          </time>
        ) : null}
      </div>

      <VoiceWaveform level={state.level} reducedMotion={reducedMotion} />

      {state.notice ? <p className="voice-round__notice">{state.notice}</p> : null}

      {state.transcript ? (
        <article className="voice-round__transcript">
          <span>{copy.voice.transcriptLabel}</span>
          <p>{state.transcript}</p>
        </article>
      ) : null}

      {state.response ? (
        <article className="voice-round__response">
          <span>{copy.voice.responseLabel}</span>
          <p>{state.response}</p>
        </article>
      ) : null}

      {!state.transcript && state.phase === 'idle' ? (
        <p className="voice-round__empty">{copy.voice.noRoundYet}</p>
      ) : null}

      <div className="voice-round__actions">
        {canCancel ? (
          <Button onClick={onCancel} size="small" variant="quiet">
            {copy.voice.cancelAction}
          </Button>
        ) : null}
        {state.phase === 'error' ? (
          <>
            <Button onClick={onRecover} size="small" variant="secondary">
              {copy.voice.retryAction}
            </Button>
            <Button
              onClick={() =>
                document.querySelector<HTMLInputElement>('#presence-question')?.focus()
              }
              size="small"
              variant="quiet"
            >
              {copy.voice.useTextAction}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}

export interface VoiceInteractionProps {
  readonly controller: VoiceControllerBinding;
  readonly isEvidence: boolean;
  readonly reducedMotion: boolean;
  readonly state: VoiceControllerState;
  readonly voiceButtonRef: RefObject<HTMLButtonElement | null>;
}

export function VoiceInteraction({
  controller,
  isEvidence,
  reducedMotion,
  state,
  voiceButtonRef,
}: VoiceInteractionProps): React.JSX.Element {
  const presentation = presentVoiceState(state, copy.voice.state);
  const holdEnabled =
    state.permission === 'requesting' ||
    ['idle', 'listening', 'speaking', 'error'].includes(state.phase);

  useEffect(() => {
    if (isEvidence) {
      return;
    }
    function cancelOnEscape(event: globalThis.KeyboardEvent): void {
      if (event.key === 'Escape') {
        controller.cancel();
      }
    }
    function cancelOnBlur(): void {
      controller.cancel();
    }
    window.addEventListener('keydown', cancelOnEscape);
    window.addEventListener('blur', cancelOnBlur);
    return () => {
      window.removeEventListener('keydown', cancelOnEscape);
      window.removeEventListener('blur', cancelOnBlur);
    };
  }, [controller, isEvidence]);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (isEvidence || !holdEnabled || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    controller.pressStart();
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>): void {
    if (isEvidence) {
      return;
    }
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    controller.release();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (isEvidence) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      controller.cancel();
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      controller.pressStart();
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>): void {
    if (isEvidence) {
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      controller.release();
    }
  }

  return (
    <div className="voice-experience">
      <div className="presence-voice">
        <Button
          aria-describedby="voice-disclosure"
          aria-disabled={!holdEnabled}
          aria-pressed={state.phase === 'listening'}
          data-voice-phase={state.phase}
          onContextMenu={(event) => event.preventDefault()}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPointerCancel={() => controller.cancel()}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          ref={voiceButtonRef}
          size="large"
        >
          <span className="presence-voice__pulse" aria-hidden="true" />
          {presentation.action}
        </Button>
        <p id="voice-disclosure">{presentation.detail}</p>
      </div>

      <p className="voice-demo-disclosure">{copy.voice.demoDisclosure}</p>

      <CurrentVoiceRound
        onCancel={controller.cancel}
        onRecover={controller.recover}
        reducedMotion={reducedMotion}
        state={state}
      />

      <details className="voice-privacy">
        <summary>{copy.voice.privacySummary}</summary>
        <ul>
          {copy.voice.privacyDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
