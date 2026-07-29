import type { BrowserWindowConstructorOptions } from 'electron';

export function createWindowOptions(
  preloadPath: string,
  show: boolean,
): BrowserWindowConstructorOptions {
  return {
    backgroundColor: '#07090d',
    height: 800,
    minHeight: 640,
    minWidth: 1024,
    show,
    title: 'Jarvis',
    width: 1280,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      webSecurity: true,
    },
  };
}
