import type { BrowserWindowConstructorOptions } from 'electron';

interface WindowDimensions {
  height: number;
  width: number;
}

export function createWindowOptions(
  preloadPath: string,
  show: boolean,
  dimensions: WindowDimensions = { height: 800, width: 1280 },
): BrowserWindowConstructorOptions {
  return {
    backgroundColor: '#07090d',
    height: dimensions.height,
    minHeight: 640,
    minWidth: 1024,
    show,
    title: 'Jarvis',
    useContentSize: true,
    width: dimensions.width,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      webSecurity: true,
    },
  };
}
