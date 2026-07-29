import { app, BrowserWindow, ipcMain } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { HealthCheckResult } from '../shared/health';
import { resolveUserDataPath } from './data-path';
import { registerHealthCheckHandler } from './health-handler';
import { createWindowOptions } from './window-options';

const isSmokeTest = process.env.JARVIS_SMOKE_TEST === '1';

const userDataPath = resolveUserDataPath({
  isPackaged: app.isPackaged,
  overridePath: process.env.JARVIS_USER_DATA_DIR,
  temporaryDirectory: app.getPath('temp'),
});

if (userDataPath) {
  app.setPath('userData', userDataPath);
}

app.enableSandbox();

async function verifyRendererBridge(window: BrowserWindow): Promise<void> {
  try {
    const result = (await window.webContents.executeJavaScript(
      'window.jarvis.healthCheck()',
      true,
    )) as HealthCheckResult;

    if (result.status !== 'ok' || result.process !== 'main') {
      throw new Error(`Unexpected health-check result: ${JSON.stringify(result)}`);
    }

    console.log(`JARVIS_IPC_SMOKE_OK ${JSON.stringify(result)}`);

    const screenshotPath = process.env.JARVIS_SMOKE_SCREENSHOT;
    if (screenshotPath) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      const screenshot = await window.webContents.capturePage();
      await mkdir(path.dirname(screenshotPath), { recursive: true });
      await writeFile(screenshotPath, screenshot.toPNG());
      console.log(`JARVIS_SMOKE_SCREENSHOT ${screenshotPath}`);
    }
  } catch (error) {
    process.exitCode = 1;
    console.error('JARVIS_IPC_SMOKE_FAILED', error);
  } finally {
    app.quit();
  }
}

async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow(
    createWindowOptions(path.join(__dirname, '../preload/index.js'), !isSmokeTest),
  );

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  if (rendererUrl) {
    await window.loadURL(rendererUrl);
  } else {
    await window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (isSmokeTest) {
    await verifyRendererBridge(window);
  }

  return window;
}

app.whenReady().then(async () => {
  registerHealthCheckHandler(ipcMain);
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
