import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { TtsPublicConfig } from '../../../shared/tts';
import { TtsPlaybackController, type TtsPlaybackDependencies } from './tts-playback-controller';

export function useTtsPlayback(dependencies?: TtsPlaybackDependencies) {
  const [controller] = useState(() => new TtsPlaybackController(dependencies));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [config, setConfig] = useState<TtsPublicConfig | null>(null);
  useEffect(() => {
    let mounted = true;
    const api = window.jarvis?.tts;
    if (api)
      void Promise.resolve(api.getConfig())
        .then((value) => {
          if (mounted && value) setConfig(value);
        })
        .catch(() => undefined);
    return () => {
      mounted = false;
      controller.dispose();
    };
  }, [controller]);
  const play = useCallback(
    (turnId: string, text: string) => {
      if (config?.selectedProfileId) void controller.play(turnId, text, config.selectedProfileId);
    },
    [config, controller],
  );
  const stop = useCallback(() => controller.stop(), [controller]);
  return { config, play, snapshot, stop };
}
