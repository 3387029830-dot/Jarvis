import { contextBridge, ipcRenderer } from 'electron';

import { HEALTH_CHECK_CHANNEL, type HealthCheckResult, type JarvisApi } from '../shared/health';
import {
  CONVERSATION_CANCEL_CHANNEL,
  CONVERSATION_EVENT_CHANNEL,
  CONVERSATION_START_CHANNEL,
  PROVIDER_DELETE_CREDENTIAL_CHANNEL,
  PROVIDER_GET_CONFIG_CHANNEL,
  PROVIDER_SAVE_CONFIG_CHANNEL,
  PROVIDER_TEST_CONFIG_CHANNEL,
  type ConversationRequest,
  type ConversationStreamEvent,
  type ProviderDraftConfig,
  type ProviderOperationResult,
  type ProviderPublicConfig,
  type ProviderSaveInput,
  type ProviderTestResult,
} from '../shared/provider';

const jarvisApi: JarvisApi = Object.freeze({
  conversation: Object.freeze({
    cancel: (requestId: string) => ipcRenderer.invoke(CONVERSATION_CANCEL_CHANNEL, requestId),
    onEvent: (listener: (event: ConversationStreamEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: ConversationStreamEvent): void =>
        listener(payload);
      ipcRenderer.on(CONVERSATION_EVENT_CHANNEL, handler);
      return () => ipcRenderer.removeListener(CONVERSATION_EVENT_CHANNEL, handler);
    },
    start: (request: ConversationRequest) =>
      ipcRenderer.invoke(CONVERSATION_START_CHANNEL, request) as Promise<ProviderOperationResult>,
  }),
  healthCheck: () => ipcRenderer.invoke(HEALTH_CHECK_CHANNEL) as Promise<HealthCheckResult>,
  provider: Object.freeze({
    deleteCredential: () =>
      ipcRenderer.invoke(PROVIDER_DELETE_CREDENTIAL_CHANNEL) as Promise<ProviderOperationResult>,
    getConfig: () =>
      ipcRenderer.invoke(PROVIDER_GET_CONFIG_CHANNEL) as Promise<ProviderPublicConfig>,
    saveConfig: (input: ProviderSaveInput) =>
      ipcRenderer.invoke(PROVIDER_SAVE_CONFIG_CHANNEL, input) as Promise<ProviderOperationResult>,
    testConfig: (input: ProviderDraftConfig) =>
      ipcRenderer.invoke(PROVIDER_TEST_CONFIG_CHANNEL, input) as Promise<ProviderTestResult>,
  }),
});

contextBridge.exposeInMainWorld('jarvis', jarvisApi);
