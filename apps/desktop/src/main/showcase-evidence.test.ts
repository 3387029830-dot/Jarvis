import { describe, expect, it } from 'vitest';

import { createShowcaseHash, resolveShowcaseEvidenceOptions } from './showcase-evidence';

describe('visual evidence options', () => {
  it('uses safe viewport defaults and leaves evidence disabled', () => {
    expect(resolveShowcaseEvidenceOptions({})).toEqual({
      conversationScenario: 'uncertainty-and-crowd',
      conversationState: 'normal',
      dialogOpen: false,
      enabled: false,
      focusTarget: false,
      height: 800,
      presenceVariant: 'populated',
      reducedMotion: false,
      route: 'design-system',
      settingsState: 'empty',
      voiceState: 'live',
      width: 1280,
      zoomFactor: 1,
    });
  });

  it('keeps the JAR-002 design-system evidence contract', () => {
    const result = resolveShowcaseEvidenceOptions({
      JARVIS_SHOWCASE_DIALOG: '1',
      JARVIS_SHOWCASE_EVIDENCE: '1',
      JARVIS_SHOWCASE_FOCUS: '1',
      JARVIS_SHOWCASE_REDUCED_MOTION: '1',
      JARVIS_SMOKE_HEIGHT: '900',
      JARVIS_SMOKE_WIDTH: '800',
    });

    expect(result).toMatchObject({
      dialogOpen: true,
      enabled: true,
      focusTarget: true,
      height: 900,
      reducedMotion: true,
      width: 1280,
    });
    expect(createShowcaseHash(result)).toBe(
      '/design-system?dialog=open&focus=button&motion=reduced',
    );
  });

  it('creates deterministic Presence variants and clamps zoom', () => {
    const result = resolveShowcaseEvidenceOptions({
      JARVIS_EVIDENCE: '1',
      JARVIS_EVIDENCE_ROUTE: 'presence',
      JARVIS_EVIDENCE_ZOOM: '2',
      JARVIS_PRESENCE_VARIANT: 'empty',
      JARVIS_SHOWCASE_FOCUS: '1',
      JARVIS_VOICE_STATE: 'speaking',
    });

    expect(result.zoomFactor).toBe(2);
    expect(createShowcaseHash(result)).toBe('/presence?variant=empty&voice=speaking&focus=voice');
  });

  it('creates deterministic Conversation evidence states', () => {
    const result = resolveShowcaseEvidenceOptions({
      JARVIS_CONVERSATION_SCENARIO: 'knowledge-action-gap',
      JARVIS_CONVERSATION_STATE: 'offline',
      JARVIS_EVIDENCE: '1',
      JARVIS_EVIDENCE_ROUTE: 'conversation',
      JARVIS_SHOWCASE_FOCUS: '1',
      JARVIS_VOICE_STATE: 'listening',
    });
    expect(createShowcaseHash(result)).toBe(
      '/conversation?exploration=knowledge-action-gap&state=offline&voice=listening&focus=composer',
    );
  });

  it('creates deterministic Settings evidence states', () => {
    const result = resolveShowcaseEvidenceOptions({
      JARVIS_EVIDENCE: '1',
      JARVIS_EVIDENCE_ROUTE: 'settings',
      JARVIS_SETTINGS_STATE: 'configured',
    });
    expect(createShowcaseHash(result)).toBe('/settings?state=configured');
  });

  it('creates deterministic JAR-006B settings and reduced-motion voice states', () => {
    const settings = resolveShowcaseEvidenceOptions({
      JARVIS_EVIDENCE: '1',
      JARVIS_EVIDENCE_ROUTE: 'settings',
      JARVIS_SETTINGS_STATE: 'stt-configured',
    });
    expect(createShowcaseHash(settings)).toBe('/settings?state=stt-configured');

    const voice = resolveShowcaseEvidenceOptions({
      JARVIS_EVIDENCE: '1',
      JARVIS_EVIDENCE_ROUTE: 'conversation',
      JARVIS_SHOWCASE_REDUCED_MOTION: '1',
      JARVIS_VOICE_STATE: 'real-review',
    });
    expect(createShowcaseHash(voice)).toContain('voice=real-review');
    expect(createShowcaseHash(voice)).toContain('motion=reduced');
  });
});
