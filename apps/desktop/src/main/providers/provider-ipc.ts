import type { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron';

import {
  CONVERSATION_CANCEL_CHANNEL,
  CONVERSATION_EVENT_CHANNEL,
  CONVERSATION_START_CHANNEL,
  PROVIDER_DELETE_CREDENTIAL_CHANNEL,
  PROVIDER_GET_CONFIG_CHANNEL,
  PROVIDER_SAVE_CONFIG_CHANNEL,
  PROVIDER_TEST_CONFIG_CHANNEL,
  type ProviderOperationResult,
} from '../../shared/provider';
import { toProviderError } from './provider-error';
import { ProviderService } from './provider-service';
import {
  validateConversationRequest,
  validateProviderDraft,
  validateProviderSave,
} from './provider-validation';

type ProviderIpcMain = Pick<IpcMain, 'handle' | 'removeHandler'>;

export function registerProviderHandlers(ipcMain: ProviderIpcMain, service: ProviderService): void {
  const active = new Map<string, AbortController>();
  const keyFor = (sender: WebContents, requestId: string): string => `${sender.id}:${requestId}`;
  const channels = [
    PROVIDER_GET_CONFIG_CHANNEL,
    PROVIDER_TEST_CONFIG_CHANNEL,
    PROVIDER_SAVE_CONFIG_CHANNEL,
    PROVIDER_DELETE_CREDENTIAL_CHANNEL,
    CONVERSATION_START_CHANNEL,
    CONVERSATION_CANCEL_CHANNEL,
  ];
  channels.forEach((channel) => ipcMain.removeHandler(channel));

  ipcMain.handle(PROVIDER_GET_CONFIG_CHANNEL, () => service.getConfig());
  ipcMain.handle(PROVIDER_TEST_CONFIG_CHANNEL, (_event, raw: unknown) => {
    try {
      return service.testConfig(validateProviderDraft(raw));
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  });
  ipcMain.handle(PROVIDER_SAVE_CONFIG_CHANNEL, (_event, raw: unknown) => {
    try {
      return service.saveConfig(validateProviderSave(raw));
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  });
  ipcMain.handle(PROVIDER_DELETE_CREDENTIAL_CHANNEL, () => service.deleteCredential());
  ipcMain.handle(
    CONVERSATION_START_CHANNEL,
    async (event: IpcMainInvokeEvent, raw: unknown): Promise<ProviderOperationResult> => {
      try {
        const request = validateConversationRequest(raw);
        const key = keyFor(event.sender, request.requestId);
        active.get(key)?.abort();
        const controller = new AbortController();
        active.set(key, controller);
        const send = (payload: unknown): void => {
          if (!event.sender.isDestroyed()) {
            event.sender.send(CONVERSATION_EVENT_CHANNEL, payload);
          }
        };
        void service
          .streamConversation(request, send, controller.signal)
          .catch((error: unknown) => {
            send({
              error: toProviderError(error, request.requestId),
              requestId: request.requestId,
              type: 'error',
            });
          })
          .finally(() => {
            if (active.get(key) === controller) {
              active.delete(key);
            }
          });
        return { config: await service.getConfig(), ok: true };
      } catch (error) {
        return { error: toProviderError(error), ok: false };
      }
    },
  );
  ipcMain.handle(CONVERSATION_CANCEL_CHANNEL, (event: IpcMainInvokeEvent, requestId: unknown) => {
    if (typeof requestId === 'string') {
      const key = keyFor(event.sender, requestId);
      active.get(key)?.abort();
      active.delete(key);
    }
  });
}
