import type { BrowserWindow } from 'electron';

interface ProviderAcceptanceResult {
  readonly cancelled: boolean;
  readonly masked: string;
  readonly receivedCharacters: number;
}

export async function runProviderAcceptance(
  window: BrowserWindow,
): Promise<ProviderAcceptanceResult> {
  return (await window.webContents.executeJavaScript(
    `(async () => {
      const draft = {
        apiKey: 'jarvis-local-acceptance-2468',
        baseUrl: 'http://localhost:4317/v1',
        mode: 'real',
        model: 'jarvis-local-fake'
      };
      const test = await window.jarvis.provider.testConfig(draft);
      if (!test.ok) throw new Error('Provider test failed: ' + test.error.code);
      const saved = await window.jarvis.provider.saveConfig(draft);
      if (!saved.ok) throw new Error('Provider save failed: ' + saved.error.code);
      const publicConfig = await window.jarvis.provider.getConfig();
      if (publicConfig.keySuffix !== '2468' || 'apiKey' in publicConfig) {
        throw new Error('Credential masking contract failed.');
      }
      const requestId = 'electron-acceptance-complete';
      let text = '';
      await new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Stream acceptance timeout.')), 5000);
        const unsubscribe = window.jarvis.conversation.onEvent((event) => {
          if (event.requestId !== requestId) return;
          if (event.type === 'delta') text += event.content;
          if (event.type === 'error') {
            clearTimeout(timeout);
            unsubscribe();
            reject(new Error('Stream failed: ' + event.error.code));
          }
          if (event.type === 'complete') {
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        });
        const started = await window.jarvis.conversation.start({
          context: { domains: ['测试'], exploration: '本地 Provider 验收', recentMessages: [] },
          requestId,
          userMessage: '请验证中文流式回答。'
        });
        if (!started.ok) reject(new Error('Start failed: ' + started.error.code));
      });
      if (!text.includes('本地测试 Provider')) throw new Error('Unexpected stream content.');
      const cancelId = 'electron-acceptance-cancel';
      let cancelDeltas = 0;
      const unsubscribeCancel = window.jarvis.conversation.onEvent((event) => {
        if (event.requestId === cancelId && event.type === 'delta') cancelDeltas += 1;
      });
      const cancelStarted = await window.jarvis.conversation.start({
        context: { domains: ['测试'], exploration: '取消验收', recentMessages: [] },
        requestId: cancelId,
        userMessage: '请开始一个可取消的回答。'
      });
      if (!cancelStarted.ok) throw new Error('Cancel start failed.');
      await new Promise((resolve) => setTimeout(resolve, 230));
      await window.jarvis.conversation.cancel(cancelId);
      await new Promise((resolve) => setTimeout(resolve, 500));
      unsubscribeCancel();
      if (cancelDeltas > 1) throw new Error('Chunks arrived after cancellation.');
      await window.jarvis.provider.deleteCredential();
      return { cancelled: true, masked: publicConfig.keySuffix, receivedCharacters: text.length };
    })()`,
    true,
  )) as ProviderAcceptanceResult;
}
