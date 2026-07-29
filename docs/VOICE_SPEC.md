# Voice Experience Specification

## 1. Principle

Voice is not a later plugin. It is a foundational interaction path and the main source of the Jarvis feeling.

The first implementation prioritizes reliable push-to-talk over fragile always-listening behavior.

## 2. Voice state machine

```text
idle
  → listening
  → transcribing
  → understanding
  → responding_text
  → speaking
  → idle
```

Interrupt paths:

```text
listening → cancelled
transcribing → cancelled
speaking → interrupted → listening | idle
any state → error → recoverable idle
```

Canonical states:

- `idle`
- `listening`
- `transcribing`
- `understanding`
- `responding_text`
- `speaking`
- `interrupted`
- `cancelled`
- `error`

## 3. V0.1 behavior

- Hold a local shortcut or UI microphone control to record.
- Show waveform and elapsed time.
- Release to submit.
- Send audio through a vendor-neutral STT adapter.
- Stream the text model response where supported.
- Send response segments through a vendor-neutral TTS adapter.
- Play speech while continuing to render text.
- A new press immediately stops playback and begins a new capture.
- Store audio only according to user preference; default is temporary retention until transcription is confirmed.

## 4. Later behavior

- Voice activity detection.
- Hands-free conversational sessions.
- Streaming transcription.
- Full-duplex speech-to-speech providers.
- Wake word only after privacy controls and false-trigger evaluation are complete.

## 5. Provider interfaces

```ts
interface SpeechToTextProvider {
  id: string;
  transcribe(input: AudioInput, options: SttOptions): Promise<Transcript>;
  transcribeStream?(
    input: AsyncIterable<AudioChunk>,
    options: SttOptions,
  ): AsyncIterable<TranscriptDelta>;
}

interface TextToSpeechProvider {
  id: string;
  synthesize(input: TtsInput, options: TtsOptions): Promise<AudioOutput>;
  synthesizeStream?(
    input: AsyncIterable<TextChunk>,
    options: TtsOptions,
  ): AsyncIterable<AudioChunk>;
}

interface ConversationProvider {
  id: string;
  respond(request: ConversationRequest): Promise<ConversationResponse>;
  respondStream?(request: ConversationRequest): AsyncIterable<ConversationDelta>;
}
```

## 6. Electron boundaries

- Renderer captures microphone permission and raw audio through browser media APIs.
- Renderer sends typed audio messages through preload IPC.
- Main process owns provider credentials and network calls.
- Renderer receives transcript, response, and audio events without seeing secrets.
- TTS playback occurs in the renderer for responsive interruption.

## 7. Experience targets

These are design targets, not provider guarantees:

- Visual acknowledgement after key press: under 100 ms.
- No unexplained silent interval; every stage has visible feedback.
- The user can cancel or interrupt at all times.
- Text response should begin before complete TTS generation when streaming is available.
- Voice and Orb states must be driven by the same state machine.

## 8. Privacy controls

Settings must separately control:

- microphone permission;
- temporary audio retention;
- permanent original-audio archive;
- transcription history;
- TTS voice;
- provider used for STT/TTS;
- automatic deletion interval for temporary audio.
