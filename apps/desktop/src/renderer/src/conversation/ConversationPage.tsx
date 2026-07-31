import { useEffect, useMemo, useRef, useState } from 'react';

import { copy } from '../copy';
import { Badge, Button } from '../design-system';
import { PresenceOrb } from '../presence/PresenceOrb';
import { AppShell } from '../shell/AppShell';
import { useVoiceInteractionMode } from '../voice/interaction-mode';
import { useVoiceController } from '../voice/use-voice-controller';
import { createVoiceEvidenceState } from '../voice/voice-evidence';
import { VoiceInteraction } from '../voice/VoiceInteraction';
import { takeVoiceTranscriptHandoff } from '../voice/voice-handoff';
import { defaultConversationScenario, findConversationScenario } from './conversation-data';
import { parseConversationOptions } from './conversation-options';
import type { ConversationTurn } from './types';
import { useConversationSession } from './use-conversation-session';
import {
  resolveVoiceTranscriptDraft,
  stageVoiceTranscript as createVoiceTranscriptDraft,
  wasTranscriptionEdited,
  type PendingVoiceDraft,
} from './voice-transcript-draft';

function formatTurnTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function TurnBlock({
  onRetry,
  turn,
}: {
  onRetry(): void;
  turn: ConversationTurn;
}): React.JSX.Element {
  const source =
    turn.source === 'voice'
      ? turn.transcriptionEdited
        ? '语音转录 · 已修正'
        : '语音转录'
      : copy.conversation.sourceText;
  const paragraphs = turn.content.split('\n\n').filter(Boolean);
  return (
    <article
      aria-live={turn.status === 'streaming' ? 'polite' : undefined}
      className={`conversation-turn conversation-turn--${turn.role}`}
      data-status={turn.status}
    >
      <header className="conversation-turn__meta">
        <span>{turn.role === 'jarvis' ? 'Jarvis' : '你'}</span>
        <span>{source}</span>
        <time dateTime={turn.createdAt}>{formatTurnTime(turn.createdAt)}</time>
        {turn.isMock ? <Badge tone="warning">Mock</Badge> : null}
        {turn.role === 'jarvis' && !turn.isMock ? (
          <Badge tone="success">真实 Provider</Badge>
        ) : null}
      </header>
      <div className="conversation-turn__content">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        ) : (
          <p className="conversation-turn__quiet">{copy.conversation.streaming}</p>
        )}
      </div>
      {turn.status === 'streaming' ? (
        <p className="conversation-turn__status" role="status">
          <span aria-hidden="true" />
          {copy.conversation.streaming}
        </p>
      ) : null}
      {turn.status === 'cancelled' ? (
        <p className="conversation-turn__status">{copy.conversation.stopped}</p>
      ) : null}
      {turn.status === 'failed' ? (
        <div className="conversation-turn__failure">
          <p>
            <strong>{turn.providerError?.message ?? copy.conversation.failed}</strong>
            {turn.providerError
              ? `错误代码：${turn.providerError.code}。你的表达仍然保留，未自动切换到 Mock。`
              : copy.conversation.errorBody}
          </p>
          <Button onClick={onRetry} size="small" variant="secondary">
            {copy.conversation.retry}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function UnknownExploration(): React.JSX.Element {
  return (
    <AppShell activeRoute="conversation">
      <main className="conversation-recovery">
        <p>Conversation</p>
        <h1>{copy.conversation.unknownTitle}</h1>
        <p>{copy.conversation.unknownBody}</p>
        <div>
          <Button onClick={() => (window.location.hash = '/presence')} variant="secondary">
            {copy.conversation.backToPresence}
          </Button>
          <Button onClick={() => (window.location.hash = '/conversation')} variant="quiet">
            进入默认讨论
          </Button>
        </div>
      </main>
    </AppShell>
  );
}

export function ConversationPage({
  explorationId,
}: {
  explorationId: string | null;
}): React.JSX.Element {
  const scenario = findConversationScenario(explorationId);
  const activeScenario = scenario ?? defaultConversationScenario;
  const [options] = useState(() => parseConversationOptions(window.location.hash));
  const session = useConversationSession(activeScenario, options.evidence);
  const isRealMode = session.providerConfig?.mode === 'real';
  const syncVoice = session.syncVoice;
  const voiceController = useVoiceController();
  const [voiceMode, setVoiceMode] = useVoiceInteractionMode();
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const readingRef = useRef<HTMLDivElement>(null);
  const isNearLatestRef = useRef(true);
  const composingRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [voiceHandoff] = useState(takeVoiceTranscriptHandoff);
  const voiceHandoffSubmittedRef = useRef(false);
  const [pendingVoiceDraft, setPendingVoiceDraft] = useState<PendingVoiceDraft | null>(null);
  const activeVoiceResponseIdRef = useRef<string | null>(null);
  const [showLatestAction, setShowLatestAction] = useState(false);
  const isGenerating = session.state.activeResponseId !== null;
  const voiceState = options.voiceEvidence
    ? createVoiceEvidenceState(options.voiceEvidence)
    : voiceController.state;
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = prefersReducedMotion || options.reducedMotion;

  const intersections = useMemo(() => activeScenario.intersections, [activeScenario]);

  const shouldStageVoiceTranscript =
    voiceState.speechMode === 'real' &&
    voiceState.transcriptReview === 'pending' &&
    pendingVoiceDraft?.sessionId !== voiceState.sessionId;
  const shouldClearVoiceTranscript =
    pendingVoiceDraft !== null &&
    (voiceState.sessionId !== pendingVoiceDraft.sessionId ||
      voiceState.transcriptReview !== 'pending');

  if (shouldStageVoiceTranscript) {
    const staged = createVoiceTranscriptDraft(draft, voiceState.transcript, voiceState.sessionId);
    setDraft(
      options.voiceEvidence === 'real-edited'
        ? `${staged.draft} 我也想保留自己的修正。`
        : staged.draft,
    );
    setPendingVoiceDraft(staged.pending);
  } else if (shouldClearVoiceTranscript) {
    if (voiceState.transcriptReview !== 'confirmed' && pendingVoiceDraft) {
      setDraft(pendingVoiceDraft.originalDraft);
    }
    setPendingVoiceDraft(null);
  }

  useEffect(() => {
    if (voiceState.speechMode === 'real') {
      return;
    }
    syncVoice({
      phase: voiceState.phase,
      response: voiceState.response,
      sessionId: voiceState.sessionId,
      speechMode: voiceState.speechMode,
      transcript: voiceState.transcript,
      transcriptReview: voiceState.transcriptReview,
    });
  }, [
    syncVoice,
    voiceState.phase,
    voiceState.response,
    voiceState.sessionId,
    voiceState.speechMode,
    voiceState.transcript,
    voiceState.transcriptReview,
  ]);

  useEffect(() => {
    if (!pendingVoiceDraft || pendingVoiceDraft.resolution === 'pending') {
      return;
    }
    const frame = window.requestAnimationFrame(() => composerRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pendingVoiceDraft]);

  useEffect(() => {
    const activeVoiceResponseId = activeVoiceResponseIdRef.current;
    if (!activeVoiceResponseId) {
      return;
    }
    const response = session.state.turns.find((turn) => turn.id === activeVoiceResponseId);
    if (!response) {
      return;
    }
    if (response.status === 'streaming') {
      voiceController.beginExternalResponse();
      voiceController.replaceExternalResponse(response.content);
      return;
    }
    activeVoiceResponseIdRef.current = null;
    if (response.status === 'complete') {
      voiceController.replaceExternalResponse(response.content);
      voiceController.completeExternalResponse();
    } else if (response.status === 'failed') {
      voiceController.failExternalResponse(
        response.providerError?.message ?? 'Conversation 回答没有完成，转录文字仍保留在时间线。',
      );
    } else {
      voiceController.cancel();
    }
  }, [session.state.turns, voiceController]);

  useEffect(() => {
    if (options.reducedMotion) {
      document.documentElement.dataset.motion = 'reduced';
    }
    return () => {
      if (options.reducedMotion) {
        delete document.documentElement.dataset.motion;
      }
    };
  }, [options.reducedMotion]);

  useEffect(() => {
    if (!options.focusComposer) {
      return;
    }
    const frame = window.requestAnimationFrame(() => composerRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [options.focusComposer]);

  useEffect(() => {
    if (!voiceHandoff || voiceHandoffSubmittedRef.current) {
      return;
    }
    voiceHandoffSubmittedRef.current = true;
    session.submitVoice(voiceHandoff.transcript, voiceHandoff.transcriptionEdited);
  }, [session, voiceHandoff]);

  useEffect(() => {
    if (!isNearLatestRef.current) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const reading = readingRef.current;
      if (reading) {
        reading.scrollTop = reading.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [session.state.turns]);

  if (!scenario) {
    return <UnknownExploration />;
  }

  function submitDraft(): void {
    if (!draft.trim() || isGenerating) {
      return;
    }
    session.submitText(draft);
    setDraft('');
  }

  function stageVoiceTranscript(resolution: 'append' | 'replace'): void {
    if (!pendingVoiceDraft) {
      return;
    }
    setDraft(resolveVoiceTranscriptDraft(pendingVoiceDraft, resolution));
    setPendingVoiceDraft({ ...pendingVoiceDraft, resolution });
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function keepOriginalDraft(): void {
    if (!pendingVoiceDraft) {
      return;
    }
    setDraft(pendingVoiceDraft.originalDraft);
    setPendingVoiceDraft(null);
    voiceController.cancel();
  }

  function confirmVoiceTranscript(): void {
    if (
      !pendingVoiceDraft ||
      pendingVoiceDraft.resolution === 'pending' ||
      !draft.trim() ||
      isGenerating
    ) {
      return;
    }
    const transcriptionEdited = wasTranscriptionEdited(draft, pendingVoiceDraft.transcript);
    if (!voiceController.confirmTranscript(draft)) {
      return;
    }
    const responseId = session.submitVoice(draft, transcriptionEdited);
    if (!responseId) {
      return;
    }
    activeVoiceResponseIdRef.current = responseId;
    setPendingVoiceDraft(null);
    setDraft('');
  }

  function updateReadingPosition(): void {
    const reading = readingRef.current;
    if (!reading) {
      return;
    }
    const distanceFromLatest = reading.scrollHeight - reading.scrollTop - reading.clientHeight;
    const isNearLatest = distanceFromLatest <= 96;
    isNearLatestRef.current = isNearLatest;
    setShowLatestAction(!isNearLatest);
  }

  function returnToLatest(): void {
    const reading = readingRef.current;
    if (!reading) {
      return;
    }
    isNearLatestRef.current = true;
    setShowLatestAction(false);
    reading.scrollTo({
      behavior: reducedMotion ? 'auto' : 'smooth',
      top: reading.scrollHeight,
    });
  }

  return (
    <AppShell activeRoute="conversation">
      <main className="conversation-page">
        <header className="conversation-context">
          <a href="#/presence">← {copy.conversation.backToPresence}</a>
          <div className="conversation-context__question">
            <p>正在继续的探索</p>
            <h1>{activeScenario.title}</h1>
            <div>
              <span>{activeScenario.domains.join(' · ')}</span>
              <Badge tone={isRealMode ? 'success' : 'warning'}>
                {isRealMode ? '真实文字 Provider' : '本地 Mock'}
              </Badge>
            </div>
          </div>
          <div className="conversation-context__voice">
            <strong>{copy.conversation.voiceProfileSummary}</strong>
            <span>{copy.conversation.voiceProfileFuture}</span>
          </div>
        </header>

        {session.state.offline ? (
          <aside className="conversation-offline" role="status">
            <strong>{copy.conversation.offlineTitle}</strong>
            <span>{copy.conversation.offlineBody}</span>
          </aside>
        ) : null}

        <div
          className="conversation-reading"
          data-testid="conversation-reading"
          onScroll={updateReadingPosition}
          ref={readingRef}
        >
          <div className="conversation-reading__latest-slot">
            <Button
              className="conversation-reading__latest"
              hidden={!showLatestAction}
              onClick={returnToLatest}
              size="small"
              variant="quiet"
            >
              {copy.conversation.backToLatest}
            </Button>
          </div>
          <section aria-label="对话时间线" className="conversation-timeline">
            <div className="conversation-timeline__intro">
              <span>讨论手稿</span>
              <p>
                {isRealMode
                  ? '新提交的文字会发送给已配置的 Provider；页面中标有 Mock 的既有内容仍是演示数据。'
                  : copy.conversation.mockDisclosure}
              </p>
            </div>
            {session.state.turns.map((turn) => (
              <TurnBlock key={turn.id} onRetry={session.retry} turn={turn} />
            ))}
          </section>

          <aside aria-labelledby="intersections-title" className="conversation-intersections">
            <header>
              <span>Context</span>
              <h2 id="intersections-title">{copy.conversation.contextTitle}</h2>
            </header>
            {isRealMode ? (
              <article>
                <h3>真实回答暂不生成认知交汇</h3>
                <blockquote>
                  本轮不会从 Provider 回答中提取、保存或伪造跨领域认知。JAR-006C
                  之前，这里只保留能力边界说明。
                </blockquote>
              </article>
            ) : (
              <>
                {intersections.map((item) => (
                  <article key={item.domain}>
                    <h3>{item.domain}</h3>
                    <p>{item.concepts.join('、')}</p>
                    <blockquote>{item.reflection}</blockquote>
                  </article>
                ))}
                <small>这些联系来自当前 Mock 回合，尚未保存为个人认知。</small>
              </>
            )}
          </aside>
        </div>

        <section
          aria-labelledby="conversation-composer-title"
          className="conversation-composer"
          data-testid="conversation-composer"
        >
          <header
            className="conversation-composer__identity"
            data-layout-area="identity"
            data-testid="conversation-composer-identity"
          >
            <div>
              <p>继续探索</p>
              <h2 id="conversation-composer-title">{copy.conversation.composerLabel}</h2>
            </div>
            <PresenceOrb motion={reducedMotion ? 'static' : 'ambient'} state={voiceState} />
          </header>

          <div
            className="conversation-composer__text"
            data-voice-transcript-review={
              pendingVoiceDraft ? pendingVoiceDraft.resolution : undefined
            }
            data-layout-area="text"
            data-testid="conversation-composer-text"
          >
            {pendingVoiceDraft ? (
              <div className="conversation-composer__transcript-status" role="status">
                <div>
                  <strong>{copy.voice.transcriptReviewLabel}</strong>
                  <small>
                    {pendingVoiceDraft.resolution === 'pending'
                      ? '文字区已有未发送草稿。原内容保持不变，请先选择如何放入转录。'
                      : copy.voice.transcriptReviewHint}
                  </small>
                </div>
                <Badge tone="success">{copy.voice.realBadge}</Badge>
              </div>
            ) : null}
            <textarea
              id="conversation-input"
              onChange={(event) => {
                const value = event.target.value;
                setDraft(value);
                if (pendingVoiceDraft?.resolution === 'pending') {
                  setPendingVoiceDraft({ ...pendingVoiceDraft, originalDraft: value });
                }
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  !composingRef.current
                ) {
                  event.preventDefault();
                  submitDraft();
                }
              }}
              placeholder={copy.conversation.composerPlaceholder}
              ref={composerRef}
              rows={2}
              value={draft}
            />
            {pendingVoiceDraft?.resolution === 'pending' ? (
              <div className="conversation-composer__draft-conflict">
                <p>{pendingVoiceDraft.transcript}</p>
                <div>
                  <Button
                    onClick={() => stageVoiceTranscript('replace')}
                    size="small"
                    variant="secondary"
                  >
                    替换草稿
                  </Button>
                  <Button
                    onClick={() => stageVoiceTranscript('append')}
                    size="small"
                    variant="secondary"
                  >
                    追加转录
                  </Button>
                  <Button onClick={keepOriginalDraft} size="small" variant="quiet">
                    保留原草稿
                  </Button>
                </div>
              </div>
            ) : null}
            <div
              className="conversation-composer__generation-controls"
              data-testid="conversation-generation-controls"
            >
              <small aria-live="polite">
                {pendingVoiceDraft
                  ? copy.voice.transcriptReviewHint
                  : isGenerating
                    ? copy.conversation.composerStreamingHint
                    : copy.conversation.composerHint}
              </small>
              <div>
                {pendingVoiceDraft && pendingVoiceDraft.resolution !== 'pending' ? (
                  <Button onClick={voiceController.restartCapture} size="small" variant="quiet">
                    {copy.voice.rerecordAction}
                  </Button>
                ) : null}
                <Button
                  data-generating={isGenerating || undefined}
                  disabled={
                    !isGenerating && (!draft.trim() || pendingVoiceDraft?.resolution === 'pending')
                  }
                  onClick={
                    isGenerating
                      ? () => {
                          session.cancel();
                          if (activeVoiceResponseIdRef.current) {
                            voiceController.cancel();
                          }
                        }
                      : pendingVoiceDraft
                        ? confirmVoiceTranscript
                        : submitDraft
                  }
                  variant="secondary"
                >
                  {isGenerating
                    ? copy.conversation.stopGenerating
                    : pendingVoiceDraft
                      ? '发送给 Jarvis'
                      : copy.conversation.send}
                </Button>
              </div>
            </div>
          </div>

          <div
            className="conversation-composer__voice"
            data-layout-area="voice"
            data-testid="conversation-composer-voice"
          >
            <VoiceInteraction
              controller={voiceController}
              isEvidence={options.voiceEvidence !== null}
              mode={voiceMode}
              onModeChange={setVoiceMode}
              reducedMotion={reducedMotion}
              state={voiceState}
              transcriptReviewMode="external"
              voiceButtonRef={voiceButtonRef}
            />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
