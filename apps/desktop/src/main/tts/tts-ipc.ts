import type { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import {
  TTS_CANCEL_CHANNEL,
  TTS_DELETE_CREDENTIAL_CHANNEL,
  TTS_DELETE_PROFILE_CHANNEL,
  TTS_GET_CONFIG_CHANNEL,
  TTS_INSTALL_PROFILE_CHANNEL,
  TTS_SAVE_CONFIG_CHANNEL,
  TTS_SELECT_PROFILE_CHANNEL,
  TTS_SYNTHESIZE_CHANNEL,
  TTS_TEST_CONFIG_CHANNEL,
  type TtsSynthesisResult,
} from '../../shared/tts';
import { toProviderError } from '../providers/provider-error';
import { TtsService } from './tts-service';
import {
  validateTtsDraft,
  validateTtsRequest,
  validateTtsSave,
  validateVoiceProfile,
} from './tts-validation';

type TtsIpcMain = Pick<IpcMain, 'handle' | 'removeHandler'>;
export function registerTtsHandlers(ipcMain: TtsIpcMain, service: TtsService): void {
  const active = new Map<string, AbortController>();
  const keyFor = (sender: WebContents, requestId: string): string => `${sender.id}:${requestId}`;
  [
    TTS_GET_CONFIG_CHANNEL,
    TTS_TEST_CONFIG_CHANNEL,
    TTS_SAVE_CONFIG_CHANNEL,
    TTS_DELETE_CREDENTIAL_CHANNEL,
    TTS_DELETE_PROFILE_CHANNEL,
    TTS_INSTALL_PROFILE_CHANNEL,
    TTS_SELECT_PROFILE_CHANNEL,
    TTS_SYNTHESIZE_CHANNEL,
    TTS_CANCEL_CHANNEL,
  ].forEach((channel) => ipcMain.removeHandler(channel));
  ipcMain.handle(TTS_GET_CONFIG_CHANNEL, () => service.getConfig());
  ipcMain.handle(TTS_TEST_CONFIG_CHANNEL, (_event, raw) => {
    try {
      return service.testConfig(validateTtsDraft(raw));
    } catch (error) {
      return { error: toProviderError(error, 'tts-connection-test', 'minimax'), ok: false };
    }
  });
  ipcMain.handle(TTS_SAVE_CONFIG_CHANNEL, (_event, raw) => {
    try {
      return service.saveConfig(validateTtsSave(raw));
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  });
  ipcMain.handle(TTS_DELETE_CREDENTIAL_CHANNEL, () => service.deleteCredential());
  ipcMain.handle(TTS_DELETE_PROFILE_CHANNEL, (_event, profileId: unknown) =>
    typeof profileId === 'string'
      ? service.deleteProfile(profileId)
      : {
          error: toProviderError(new Error('invalid profile'), undefined, 'minimax'),
          ok: false,
        },
  );
  ipcMain.handle(TTS_INSTALL_PROFILE_CHANNEL, (_event, raw) => {
    try {
      return service.installProfile(validateVoiceProfile(raw));
    } catch (error) {
      return { error: toProviderError(error, undefined, 'minimax'), ok: false };
    }
  });
  ipcMain.handle(TTS_SELECT_PROFILE_CHANNEL, (_event, raw) =>
    typeof raw === 'string'
      ? service.selectProfile(raw)
      : { error: toProviderError(new Error('invalid profile')), ok: false },
  );
  ipcMain.handle(
    TTS_SYNTHESIZE_CHANNEL,
    async (event: IpcMainInvokeEvent, raw: unknown): Promise<TtsSynthesisResult> => {
      let requestId = 'tts-invalid-request';
      try {
        const request = validateTtsRequest(raw);
        requestId = request.requestId;
        const key = keyFor(event.sender, requestId);
        active.get(key)?.abort();
        const controller = new AbortController();
        active.set(key, controller);
        try {
          return await service.synthesize(request, controller.signal);
        } finally {
          if (active.get(key) === controller) active.delete(key);
        }
      } catch (error) {
        return { error: toProviderError(error, requestId, 'minimax'), ok: false };
      }
    },
  );
  ipcMain.handle(TTS_CANCEL_CHANNEL, (event: IpcMainInvokeEvent, requestId: unknown) => {
    if (typeof requestId !== 'string') return;
    const key = keyFor(event.sender, requestId);
    active.get(key)?.abort();
    active.delete(key);
  });
}
