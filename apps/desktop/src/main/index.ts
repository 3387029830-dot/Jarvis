import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { HealthCheckResult } from '../shared/health';
import { resolveUserDataPath } from './data-path';
import { registerHealthCheckHandler } from './health-handler';
import { createShowcaseHash, resolveShowcaseEvidenceOptions } from './showcase-evidence';
import { createWindowOptions } from './window-options';
import { OpenAICompatibleConversationProvider } from './providers/openai-compatible-provider';
import { ProviderConfigStore } from './providers/provider-config-store';
import { registerProviderHandlers } from './providers/provider-ipc';
import { ProviderService } from './providers/provider-service';
import { OpenAICompatibleSpeechToTextProvider } from './speech/openai-compatible-speech-provider';
import { SpeechConfigStore } from './speech/speech-config-store';
import { registerSpeechHandlers } from './speech/speech-ipc';
import { SpeechService } from './speech/speech-service';

const isSmokeTest = process.env.JARVIS_SMOKE_TEST === '1';
const showcaseEvidence = resolveShowcaseEvidenceOptions(process.env);

if (showcaseEvidence.enabled) {
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

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

    if (process.env.JARVIS_PROVIDER_ACCEPTANCE === '1') {
      const { runProviderAcceptance } = await import('./providers/provider-acceptance');
      const acceptance = await runProviderAcceptance(window);
      console.log(`JARVIS_PROVIDER_ACCEPTANCE_OK ${JSON.stringify(acceptance)}`);
    }

    if (process.env.JARVIS_SPEECH_ACCEPTANCE === '1') {
      const { runSpeechAcceptance } = await import('./speech/speech-acceptance');
      const acceptance = await runSpeechAcceptance(window);
      console.log(`JARVIS_SPEECH_ACCEPTANCE_OK ${JSON.stringify(acceptance)}`);
    }

    const screenshotPath = process.env.JARVIS_SMOKE_SCREENSHOT;
    if (screenshotPath) {
      const rendererHash = (await window.webContents.executeJavaScript(
        'window.location.hash',
        true,
      )) as string;
      console.log(`JARVIS_SHOWCASE_ROUTE ${rendererHash || '(foundation)'}`);
      await new Promise((resolve) => {
        setTimeout(resolve, showcaseEvidence.route === 'settings' ? 1_600 : 1_000);
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
    createWindowOptions(path.join(__dirname, '../preload/index.js'), !isSmokeTest, {
      height: showcaseEvidence.height,
      width: showcaseEvidence.width,
    }),
  );

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  const evidenceHash = createShowcaseHash(showcaseEvidence);

  if (rendererUrl) {
    const rendererHash = showcaseEvidence.enabled ? evidenceHash : '/presence';
    await window.loadURL(`${rendererUrl}#${rendererHash}`);
  } else if (showcaseEvidence.enabled) {
    await window.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: evidenceHash,
    });
  } else {
    await window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (showcaseEvidence.zoomFactor !== 1) {
    window.webContents.setZoomFactor(showcaseEvidence.zoomFactor);
  }

  if (isSmokeTest) {
    await verifyRendererBridge(window);
  }

  return window;
}

app.whenReady().then(async () => {
  registerHealthCheckHandler(ipcMain);
  const providerStore = new ProviderConfigStore(app.getPath('userData'), safeStorage);
  registerProviderHandlers(
    ipcMain,
    new ProviderService(providerStore, new OpenAICompatibleConversationProvider()),
  );
  registerSpeechHandlers(
    ipcMain,
    new SpeechService(
      new SpeechConfigStore(app.getPath('userData'), safeStorage),
      providerStore,
      new OpenAICompatibleSpeechToTextProvider(),
    ),
  );
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
