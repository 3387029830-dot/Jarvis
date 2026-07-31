import { describe, expect, it } from 'vitest';

import { SPEECH_AUDIO_LIMITS } from '../../shared/speech';
import {
  filenameForSpeechRequest,
  normalizeSpeechMimeType,
  validateSpeechDraft,
  validateSpeechTranscriptionRequest,
} from './speech-validation';

describe('speech runtime validation', () => {
  it('normalizes supported MIME types and creates a safe generated filename', () => {
    expect(normalizeSpeechMimeType('Audio/WebM; codecs=opus')).toBe('audio/webm');
    expect(filenameForSpeechRequest('../request?<1>', 'audio/webm')).toBe('jarvis-request1.webm');
  });

  it('requires typed binary audio and enforces duration and size limits', () => {
    const valid = {
      audio: new Uint8Array([1, 2, 3]),
      durationMs: 800,
      mimeType: 'audio/webm',
      requestId: 'request-1',
    };
    expect(validateSpeechTranscriptionRequest(valid)).toMatchObject(valid);
    expect(() => validateSpeechTranscriptionRequest({ ...valid, audio: [1, 2, 3] })).toThrowError();
    expect(() => validateSpeechTranscriptionRequest({ ...valid, durationMs: 100 })).toThrowError();
    expect(() =>
      validateSpeechTranscriptionRequest({
        ...valid,
        audio: new Uint8Array(SPEECH_AUDIO_LIMITS.maximumBytes + 1),
      }),
    ).toThrowError();
    expect(() =>
      validateSpeechTranscriptionRequest({ ...valid, mimeType: 'application/json' }),
    ).toThrowError();
  });

  it('accepts independent credentials and explicit Conversation references', () => {
    expect(
      validateSpeechDraft({
        apiKey: ' secret ',
        baseUrl: 'https://speech.example/v1/',
        credentialSource: 'independent',
        language: ' zh ',
        model: ' speech-model ',
        timeoutMs: 45_000,
      }),
    ).toEqual({
      apiKey: 'secret',
      baseUrl: 'https://speech.example/v1',
      credentialSource: 'independent',
      language: 'zh',
      model: 'speech-model',
      timeoutMs: 45_000,
    });
    expect(
      validateSpeechDraft({
        baseUrl: 'http://localhost:8787/v1',
        credentialSource: 'conversation',
        language: 'zh',
        model: 'local-stt',
        timeoutMs: 10_000,
      }).credentialSource,
    ).toBe('conversation');
  });
});
