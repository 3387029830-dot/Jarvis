import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';

import { copy } from '../copy';
import { Badge, Button } from '../design-system';
import type { VoiceInteractionMode } from './interaction-mode';
import { presentVoiceState, type VoiceControllerState } from './voice-state';
import { activateToggleVoice, createVoiceCommands, voicePrimaryLabel } from './voice-gestures';
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
  mode,
  onCancel,
  onConfirmTranscript,
  onRecover,
  onRestartCapture,
  onRetryTranscription,
  reducedMotion,
  reviewDraft,
  reviewMode,
  setReviewDraft,
  state,
}: {
  mode: VoiceInteractionMode;
  onCancel(): void;
  onConfirmTranscript(): void;
  onRecover(): void;
  onRestartCapture(): void;
  onRetryTranscription(): void;
  reducedMotion: boolean;
  reviewDraft: string;
  reviewMode: 'external' | 'inline';
  setReviewDraft(value: string): void;
  state: VoiceControllerState;
}): React.JSX.Element {
  const presentation = presentVoiceState(state, copy.voice.state);
  const action =
    mode === 'toggle' && state.phase === 'listening'
      ? copy.voice.toggleListeningAction
      : presentation.action;
  const canCancel = ['listening', 'transcribing', 'understanding', 'responding_text'].includes(
    state.phase,
  );
  const isPendingReview =
    state.speechMode === 'real' &&
    state.phase === 'transcribing' &&
    state.transcriptReview === 'pending';
  const canRetryTranscription = [
    'audio-too-large',
    'empty-transcript',
    'transcription-failed',
    'unsupported-audio-format',
  ].includes(state.error?.code ?? '');

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
        <Badge
          tone={
            state.phase === 'error' ? 'danger' : state.speechMode === 'real' ? 'success' : 'warning'
          }
        >
          {state.speechMode === 'real' ? copy.voice.realBadge : copy.voice.mockBadge}
        </Badge>
      </header>

      <div aria-atomic="true" aria-live="polite" className="voice-round__status" role="status">
        <span className="voice-round__status-mark" aria-hidden="true" />
        <div>
          <strong>{action}</strong>
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

      {isPendingReview && reviewMode === 'inline' ? (
        <div className="voice-round__transcript voice-round__transcript--review">
          <label htmlFor="voice-transcript-review">{copy.voice.transcriptReviewLabel}</label>
          <textarea
            autoFocus
            id="voice-transcript-review"
            onChange={(event) => setReviewDraft(event.target.value)}
            rows={4}
            value={reviewDraft}
          />
          <small>{copy.voice.transcriptReviewHint}</small>
          <div className="voice-round__review-actions">
            <Button disabled={!reviewDraft.trim()} onClick={onConfirmTranscript} size="small">
              {copy.voice.transcriptReviewAction}
            </Button>
            <Button onClick={onRestartCapture} size="small" variant="secondary">
              {copy.voice.rerecordAction}
            </Button>
          </div>
        </div>
      ) : state.transcript && !isPendingReview ? (
        <article className="voice-round__transcript">
          <span>
            {state.speechMode === 'real'
              ? copy.voice.transcriptReviewLabel
              : copy.voice.transcriptLabel}
          </span>
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
            <Button
              onClick={canRetryTranscription ? onRetryTranscription : onRecover}
              size="small"
              variant="secondary"
            >
              {canRetryTranscription ? copy.voice.retryTranscriptionAction : copy.voice.retryAction}
            </Button>
            <Button onClick={onRestartCapture} size="small" variant="quiet">
              {copy.voice.rerecordAction}
            </Button>
            <Button
              onClick={() =>
                document
                  .querySelector<HTMLInputElement | HTMLTextAreaElement>(
                    '#conversation-input, #presence-question',
                  )
                  ?.focus()
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
  readonly mode: VoiceInteractionMode;
  readonly onTranscriptConfirm?: (transcript: string, edited: boolean) => void;
  readonly onModeChange: (mode: VoiceInteractionMode) => void;
  readonly reducedMotion: boolean;
  readonly state: VoiceControllerState;
  readonly transcriptReviewMode?: 'external' | 'inline';
  readonly voiceButtonRef: RefObject<HTMLButtonElement | null>;
}

export function VoiceInteraction({
  controller,
  isEvidence,
  mode,
  onModeChange,
  onTranscriptConfirm,
  reducedMotion,
  state,
  transcriptReviewMode = 'inline',
  voiceButtonRef,
}: VoiceInteractionProps): React.JSX.Element {
  const reviewKey = `${state.sessionId}:${state.transcriptOriginal}`;
  const [reviewDraftState, setReviewDraftState] = useState({
    key: reviewKey,
    value: state.transcript,
  });
  const reviewDraft =
    reviewDraftState.key === reviewKey ? reviewDraftState.value : state.transcript;
  const setReviewDraft = (value: string): void => {
    setReviewDraftState({ key: reviewKey, value });
  };
  const interactionEnabled =
    state.permission === 'requesting' ||
    ['idle', 'listening', 'speaking', 'error'].includes(state.phase);
  const commands = createVoiceCommands(controller);

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
    if (
      mode !== 'hold' ||
      isEvidence ||
      !interactionEnabled ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    controller.pressStart();
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>): void {
    if (mode !== 'hold' || isEvidence) {
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
    if (mode === 'hold' && (event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      controller.pressStart();
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>): void {
    if (isEvidence) {
      return;
    }
    if (mode === 'hold' && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      controller.release();
    }
  }

  return (
    <div className="voice-experience">
      <div className="presence-voice">
        <Button
          aria-describedby="voice-disclosure"
          aria-disabled={!interactionEnabled}
          aria-pressed={state.phase === 'listening'}
          data-voice-phase={state.phase}
          onClick={() => {
            if (mode === 'toggle' && !isEvidence && interactionEnabled) {
              activateToggleVoice(commands, state);
            }
          }}
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
          {voicePrimaryLabel(mode, state)}
        </Button>
        <p id="voice-disclosure">
          {mode === 'toggle' ? copy.voice.toggleModeDescription : copy.voice.holdModeDescription}
        </p>
      </div>

      <fieldset className="voice-mode" aria-label={copy.voice.modeLabel}>
        <legend>{copy.voice.modeLabel}</legend>
        {(['toggle', 'hold'] as const).map((option) => (
          <label key={option}>
            <input
              checked={mode === option}
              disabled={!['idle', 'error'].includes(state.phase)}
              name="voice-mode"
              onChange={() => onModeChange(option)}
              type="radio"
              value={option}
            />
            <span>{option === 'toggle' ? copy.voice.toggleMode : copy.voice.holdMode}</span>
          </label>
        ))}
      </fieldset>

      <p className="voice-demo-disclosure">
        {state.speechMode === 'real' ? copy.voice.realDisclosure : copy.voice.demoDisclosure}
      </p>

      <CurrentVoiceRound
        mode={mode}
        onCancel={controller.cancel}
        onConfirmTranscript={() => {
          const edited = reviewDraft.trim() !== state.transcriptOriginal;
          if (controller.confirmTranscript(reviewDraft)) {
            onTranscriptConfirm?.(reviewDraft.trim(), edited);
          }
        }}
        onRecover={controller.recover}
        onRestartCapture={controller.restartCapture}
        onRetryTranscription={controller.retryTranscription}
        reducedMotion={reducedMotion}
        reviewDraft={reviewDraft}
        reviewMode={transcriptReviewMode}
        setReviewDraft={setReviewDraft}
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
