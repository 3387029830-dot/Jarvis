import { contextBridge, ipcRenderer } from 'electron';

import { HEALTH_CHECK_CHANNEL, type HealthCheckResult, type JarvisApi } from '../shared/health';

const jarvisApi: JarvisApi = Object.freeze({
  healthCheck: () => ipcRenderer.invoke(HEALTH_CHECK_CHANNEL) as Promise<HealthCheckResult>,
});

contextBridge.exposeInMainWorld('jarvis', jarvisApi);
