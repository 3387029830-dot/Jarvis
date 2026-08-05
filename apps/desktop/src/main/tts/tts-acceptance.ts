import type { BrowserWindow } from 'electron';

interface TtsAcceptanceResult {
  readonly audioBytes: number;
  readonly cancelled: boolean;
  readonly masked: string;
  readonly providerId: 'minimax';
}

export async function runTtsAcceptance(window: BrowserWindow): Promise<TtsAcceptanceResult> {
  return (await window.webContents.executeJavaScript(
    `(async () => {
      const profile = {
        authorization: { basis: 'original-work', expiresAt: null, permittedUse: 'localhost acceptance only', reference: 'JAR-006C-LOCAL', rightsHolder: 'Jarvis original test fixture' },
        category: 'original', description: 'Local deterministic fixture', displayName: 'Local acceptance voice',
        id: 'local-acceptance-profile', locale: 'zh-CN', model: 'speech-2.8-turbo',
        previewText: '这是本地语音合成验收。', providerId: 'minimax', providerVoiceId: 'jarvis-local-voice'
      };
      const installed = await window.jarvis.tts.installProfile(profile);
      if (!installed.ok) throw new Error('TTS profile install failed: ' + installed.error.code);
      const selected = await window.jarvis.tts.selectProfile(profile.id);
      if (!selected.ok) throw new Error('TTS profile selection failed: ' + selected.error.code);
      const draft = { apiKey: 'jarvis-local-tts-8642', baseUrl: 'http://localhost:4317/v1', language: 'Chinese', mode: 'real', model: 'speech-2.8-turbo', playbackMode: 'manual', timeoutMs: 5000 };
      const tested = await window.jarvis.tts.testConfig(draft);
      if (!tested.ok) throw new Error('TTS test failed: ' + tested.error.code);
      const saved = await window.jarvis.tts.saveConfig(draft);
      if (!saved.ok) throw new Error('TTS save failed: ' + saved.error.code);
      const publicConfig = await window.jarvis.tts.getConfig();
      if (publicConfig.keySuffix !== '8642' || 'apiKey' in publicConfig) throw new Error('TTS masking failed.');
      const completed = await window.jarvis.tts.synthesize({ requestId: 'tts-acceptance-complete', text: '这是本地确定性中文合成。', voiceProfileId: profile.id });
      if (!completed.ok || !(completed.audio instanceof Uint8Array) || completed.audio.byteLength === 0) throw new Error('TTS binary IPC failed.');
      const cancelledPromise = window.jarvis.tts.synthesize({ requestId: 'tts-acceptance-cancel', text: '请取消这一次合成。', voiceProfileId: profile.id });
      await new Promise((resolve) => setTimeout(resolve, 30));
      await window.jarvis.tts.cancel('tts-acceptance-cancel');
      const cancelled = await cancelledPromise;
      if (cancelled.ok || cancelled.error.code !== 'cancelled') throw new Error('TTS cancellation failed.');
      await window.jarvis.tts.deleteCredential();
      return { audioBytes: completed.audio.byteLength, cancelled: true, masked: publicConfig.keySuffix, providerId: completed.metrics.providerId };
    })()`,
    true,
  )) as TtsAcceptanceResult;
}
