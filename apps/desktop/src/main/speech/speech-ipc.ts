import type { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron';

import {
  SPEECH_CANCEL_CHANNEL,
  SPEECH_DELETE_CREDENTIAL_CHANNEL,
  SPEECH_GET_CONFIG_CHANNEL,
  SPEECH_SAVE_CONFIG_CHANNEL,
  SPEECH_TEST_CONFIG_CHANNEL,
  SPEECH_TRANSCRIBE_CHANNEL,
  type SpeechTranscriptionResult,
} from '../../shared/speech';
import { toProviderError } from '../providers/provider-error';
import { SpeechService } from './speech-service';
import {
  validateSpeechDraft,
  validateSpeechSave,
  validateSpeechTranscriptionRequest,
} from './speech-validation';

type SpeechIpcMain = Pick<IpcMain, 'handle' | 'removeHandler'>;

export function registerSpeechHandlers(ipcMain: SpeechIpcMain, service: SpeechService): void {
  const active = new Map<string, AbortController>();
  const keyFor = (sender: WebContents, requestId: string): string => `${sender.id}:${requestId}`;
  const channels = [
    SPEECH_GET_CONFIG_CHANNEL,
    SPEECH_TEST_CONFIG_CHANNEL,
    SPEECH_SAVE_CONFIG_CHANNEL,
    SPEECH_DELETE_CREDENTIAL_CHANNEL,
    SPEECH_TRANSCRIBE_CHANNEL,
    SPEECH_CANCEL_CHANNEL,
  ];
  channels.forEach((channel) => ipcMain.removeHandler(channel));

  ipcMain.handle(SPEECH_GET_CONFIG_CHANNEL, () => service.getConfig());
  ipcMain.handle(SPEECH_TEST_CONFIG_CHANNEL, (_event, raw: unknown) => {
    try {
      return service.testConfig(validateSpeechDraft(raw));
    } catch (error) {
      return { error: toProviderError(error, 'speech-connection-test'), ok: false };
    }
  });
  ipcMain.handle(SPEECH_SAVE_CONFIG_CHANNEL, (_event, raw: unknown) => {
    try {
      return service.saveConfig(validateSpeechSave(raw));
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  });
  ipcMain.handle(SPEECH_DELETE_CREDENTIAL_CHANNEL, () => service.deleteCredential());
  ipcMain.handle(
    SPEECH_TRANSCRIBE_CHANNEL,
    async (event: IpcMainInvokeEvent, raw: unknown): Promise<SpeechTranscriptionResult> => {
      let requestId = 'speech-invalid-request';
      try {
        const request = validateSpeechTranscriptionRequest(raw);
        requestId = request.requestId;
        const key = keyFor(event.sender, request.requestId);
        active.get(key)?.abort();
        const controller = new AbortController();
        active.set(key, controller);
        try {
          return await service.transcribe(request, controller.signal);
        } finally {
          if (active.get(key) === controller) {
            active.delete(key);
          }
        }
      } catch (error) {
        return { error: toProviderError(error, requestId), ok: false };
      }
    },
  );
  ipcMain.handle(SPEECH_CANCEL_CHANNEL, (event: IpcMainInvokeEvent, requestId: unknown) => {
    if (typeof requestId !== 'string') {
      return;
    }
    const key = keyFor(event.sender, requestId);
    active.get(key)?.abort();
    active.delete(key);
  });
}
