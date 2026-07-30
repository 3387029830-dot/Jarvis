import { useEffect, useMemo, useRef, useState } from 'react';

import { copy } from '../copy';
import { Badge, Button, Card } from '../design-system';
import { AppShell } from '../shell/AppShell';
import { formatPresenceTimestamp } from './format-presence';
import { createPresenceViewModel } from './presence-data';
import { parsePresenceOptions, resolveOrbMotion } from './presence-options';
import { PresenceOrb } from './PresenceOrb';
import type { ExplorationItem } from './types';
import { VoiceInteraction } from '../voice/VoiceInteraction';
import { createVoiceEvidenceState } from '../voice/voice-evidence';
import { useVoiceController } from '../voice/use-voice-controller';

function Timestamp({ value }: { value: string }): React.JSX.Element {
  return (
    <time dateTime={value}>
      {copy.presence.updatedAt} {formatPresenceTimestamp(value)}
    </time>
  );
}

function ExplorationCard({
  item,
  onContinue,
}: {
  item: ExplorationItem;
  onContinue(item: ExplorationItem): void;
}): React.JSX.Element {
  return (
    <Card className="exploration-card" tone="elevated">
      <div className="exploration-card__meta">
        <span>{item.domain}</span>
        <Timestamp value={item.updatedAt} />
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <Button onClick={() => onContinue(item)} size="small" variant="quiet">
        {copy.presence.continueExploration}
        <span aria-hidden="true">→</span>
      </Button>
    </Card>
  );
}

export function PresencePage(): React.JSX.Element {
  const [options] = useState(() => parsePresenceOptions(window.location.hash));
  const model = useMemo(() => createPresenceViewModel(options.variant), [options.variant]);
  const [localResponse, setLocalResponse] = useState<string>('');
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [question, setQuestion] = useState('');
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const voiceController = useVoiceController();
  const voiceState = options.voiceEvidence
    ? createVoiceEvidenceState(options.voiceEvidence)
    : voiceController.state;

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orbMotion = resolveOrbMotion({
    hardwareConcurrency: navigator.hardwareConcurrency || 8,
    prefersReducedMotion,
    reducedMotionOverride: options.reducedMotion,
  });

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
    if (!options.focusTarget) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      voiceButtonRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [options.focusTarget]);

  function handleContinue(item: ExplorationItem): void {
    setSelectedTitle(item.title);
    setLocalResponse(copy.presence.continueResponse);
  }

  function handleQuestionSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }
    setSelectedTitle(question.trim());
    setLocalResponse(copy.presence.questionResponse);
  }

  const hasCognitionContent =
    model.explorations.length > 0 ||
    model.unresolvedQuestions.length > 0 ||
    model.cognitionCandidates.length > 0;

  return (
    <AppShell>
      <main className="presence-page">
        <header className="presence-hero">
          <div className="presence-hero__copy">
            <p className="presence-hero__eyebrow">{copy.presence.eyebrow}</p>
            <h1>{model.greeting.title}</h1>
            <p className="presence-hero__orientation">{model.greeting.orientation}</p>
            <p className="presence-hero__mock-note">{copy.presence.localMockDisclosure}</p>
            {options.reducedMotion ? (
              <p className="presence-hero__motion-note">{copy.presence.reducedMotionActive}</p>
            ) : null}
          </div>
          <PresenceOrb motion={orbMotion} state={voiceState} />
        </header>

        <section aria-label="提问入口" className="presence-entry">
          <form className="presence-question" onSubmit={handleQuestionSubmit}>
            <label htmlFor="presence-question">{copy.presence.questionLabel}</label>
            <div className="presence-question__field">
              <input
                id="presence-question"
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={copy.presence.questionPlaceholder}
                type="text"
                value={question}
              />
              <Button disabled={!question.trim()} size="small" type="submit" variant="secondary">
                {copy.presence.questionAction}
              </Button>
            </div>
          </form>
        </section>

        <VoiceInteraction
          controller={voiceController}
          isEvidence={options.voiceEvidence !== null}
          reducedMotion={prefersReducedMotion || options.reducedMotion}
          state={voiceState}
          voiceButtonRef={voiceButtonRef}
        />

        {localResponse ? (
          <output className="presence-local-response" aria-live="polite">
            {selectedTitle ? <strong>{selectedTitle}</strong> : null}
            <span>{localResponse}</span>
          </output>
        ) : null}

        {!hasCognitionContent ? (
          <section className="presence-empty" aria-labelledby="presence-empty-title">
            <span className="presence-empty__line" aria-hidden="true" />
            <div>
              <p>{copy.presence.activeExplorations}</p>
              <h2 id="presence-empty-title">{copy.presence.emptyTitle}</h2>
              <p>{copy.presence.emptyBody}</p>
              <small>{copy.presence.emptyHint}</small>
            </div>
          </section>
        ) : (
          <div className="presence-journal">
            <section
              aria-labelledby="active-explorations-heading"
              className="presence-journal__explorations"
            >
              <header className="presence-section-heading">
                <div>
                  <span>01</span>
                  <h2 id="active-explorations-heading">{copy.presence.activeExplorations}</h2>
                </div>
                <small>由 Mock 数据生成</small>
              </header>
              <div className="exploration-list">
                {model.explorations.map((item) => (
                  <ExplorationCard item={item} key={item.id} onContinue={handleContinue} />
                ))}
              </div>
            </section>

            <aside className="presence-journal__side">
              {model.unresolvedQuestions.length > 0 ? (
                <section aria-labelledby="unresolved-heading" className="thought-note">
                  <header className="presence-section-heading">
                    <div>
                      <span>02</span>
                      <h2 id="unresolved-heading">{copy.presence.unresolvedQuestions}</h2>
                    </div>
                  </header>
                  {model.unresolvedQuestions.map((item) => (
                    <article key={item.id}>
                      <h3>{item.question}</h3>
                      <p>{item.context}</p>
                      <Timestamp value={item.updatedAt} />
                    </article>
                  ))}
                </section>
              ) : null}

              {model.cognitionCandidates.length > 0 ? (
                <section aria-labelledby="cognition-heading" className="thought-note">
                  <header className="presence-section-heading">
                    <div>
                      <span>03</span>
                      <h2 id="cognition-heading">{copy.presence.recentCognition}</h2>
                    </div>
                  </header>
                  {model.cognitionCandidates.map((item) => (
                    <article key={item.id}>
                      <Badge tone="warning">{copy.presence.provisional}</Badge>
                      <h3>{item.statement}</h3>
                      <p>{item.reflection}</p>
                      <Timestamp value={item.updatedAt} />
                    </article>
                  ))}
                </section>
              ) : null}
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  );
}
