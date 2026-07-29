import type { JarvisApi } from '../../shared/health';

declare global {
  interface Window {
    readonly jarvis: JarvisApi;
  }
}

export {};
