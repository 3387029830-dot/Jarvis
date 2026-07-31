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
import {
  SPEECH_CANCEL_CHANNEL,
  SPEECH_DELETE_CREDENTIAL_CHANNEL,
  SPEECH_GET_CONFIG_CHANNEL,
  SPEECH_SAVE_CONFIG_CHANNEL,
  SPEECH_TEST_CONFIG_CHANNEL,
  SPEECH_TRANSCRIBE_CHANNEL,
  type SpeechDraftConfig,
  type SpeechOperationResult,
  type SpeechPublicConfig,
  type SpeechSaveInput,
  type SpeechTestResult,
  type SpeechTranscriptionRequest,
  type SpeechTranscriptionResult,
} from '../shared/speech';

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
  speech: Object.freeze({
    cancel: (requestId: string) => ipcRenderer.invoke(SPEECH_CANCEL_CHANNEL, requestId),
    deleteCredential: () =>
      ipcRenderer.invoke(SPEECH_DELETE_CREDENTIAL_CHANNEL) as Promise<SpeechOperationResult>,
    getConfig: () => ipcRenderer.invoke(SPEECH_GET_CONFIG_CHANNEL) as Promise<SpeechPublicConfig>,
    saveConfig: (input: SpeechSaveInput) =>
      ipcRenderer.invoke(SPEECH_SAVE_CONFIG_CHANNEL, input) as Promise<SpeechOperationResult>,
    testConfig: (input: SpeechDraftConfig) =>
      ipcRenderer.invoke(SPEECH_TEST_CONFIG_CHANNEL, input) as Promise<SpeechTestResult>,
    transcribe: (request: SpeechTranscriptionRequest) =>
      ipcRenderer.invoke(SPEECH_TRANSCRIBE_CHANNEL, request) as Promise<SpeechTranscriptionResult>,
  }),
});

contextBridge.exposeInMainWorld('jarvis', jarvisApi);
