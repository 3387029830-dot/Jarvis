import type { BrowserWindow } from 'electron';

interface SpeechAcceptanceResult {
  readonly cancelled: boolean;
  readonly masked: string;
  readonly transcript: string;
  readonly usedBinaryIpc: boolean;
}

export async function runSpeechAcceptance(window: BrowserWindow): Promise<SpeechAcceptanceResult> {
  return (await window.webContents.executeJavaScript(
    `(async () => {
      const draft = {
        apiKey: 'jarvis-local-speech-1357',
        baseUrl: 'http://localhost:4317/v1',
        credentialSource: 'independent',
        language: 'zh',
        mode: 'real',
        model: 'jarvis-local-fake-stt',
        timeoutMs: 5000
      };
      const tested = await window.jarvis.speech.testConfig(draft);
      if (!tested.ok) throw new Error('Speech test failed: ' + tested.error.code);
      const saved = await window.jarvis.speech.saveConfig(draft);
      if (!saved.ok) throw new Error('Speech save failed: ' + saved.error.code);
      const publicConfig = await window.jarvis.speech.getConfig();
      if (publicConfig.keySuffix !== '1357' || 'apiKey' in publicConfig) {
        throw new Error('Speech credential masking contract failed.');
      }
      const audio = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
      const completed = await window.jarvis.speech.transcribe({
        audio,
        durationMs: 800,
        mimeType: 'audio/wav',
        requestId: 'electron-speech-complete'
      });
      if (!completed.ok || !completed.transcript.includes('确定性中文语音转录')) {
        throw new Error('Speech transcription acceptance failed.');
      }
      const cancelledPromise = window.jarvis.speech.transcribe({
        audio,
        durationMs: 800,
        mimeType: 'audio/wav',
        requestId: 'electron-speech-cancel'
      });
      await new Promise((resolve) => setTimeout(resolve, 40));
      await window.jarvis.speech.cancel('electron-speech-cancel');
      const cancelled = await cancelledPromise;
      if (cancelled.ok || cancelled.error.code !== 'cancelled') {
        throw new Error('Speech cancellation acceptance failed.');
      }
      await window.jarvis.speech.deleteCredential();
      return {
        cancelled: true,
        masked: publicConfig.keySuffix,
        transcript: completed.transcript,
        usedBinaryIpc: audio instanceof Uint8Array
      };
    })()`,
    true,
  )) as SpeechAcceptanceResult;
}
