import type { IpcMain } from 'electron';

import { createHealthCheckResult, HEALTH_CHECK_CHANNEL } from '../shared/health';

type HealthIpcMain = Pick<IpcMain, 'handle' | 'removeHandler'>;

export function registerHealthCheckHandler(ipcMain: HealthIpcMain): void {
  ipcMain.removeHandler(HEALTH_CHECK_CHANNEL);
  ipcMain.handle(HEALTH_CHECK_CHANNEL, () => createHealthCheckResult());
}
