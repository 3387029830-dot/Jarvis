import type {
  ConversationStreamEvent,
  ProviderDraftConfig,
  ProviderOperationResult,
  ProviderPublicConfig,
  ProviderSaveInput,
  ProviderTestResult,
} from '../../shared/provider';
import { OpenAICompatibleConversationProvider } from './openai-compatible-provider';
import { buildConversationMessages } from './prompt';
import { ProviderFailure, toProviderError } from './provider-error';
import { ProviderConfigStore } from './provider-config-store';

export class ProviderService {
  constructor(
    readonly store: ProviderConfigStore,
    readonly provider: OpenAICompatibleConversationProvider,
  ) {}

  getConfig(): Promise<ProviderPublicConfig> {
    return this.store.getPublicConfig();
  }

  async testConfig(input: ProviderDraftConfig): Promise<ProviderTestResult> {
    const startedAt = performance.now();
    try {
      const apiKey = await this.store.resolveCredential(input.apiKey);
      if (!apiKey) {
        throw new ProviderFailure('invalid_configuration');
      }
      const controller = new AbortController();
      await this.provider.stream({
        apiKey,
        config: input,
        messages: [
          {
            content: '这是连接测试。只回复“连接正常”，不要输出解释、隐藏推理或其他内容。',
            role: 'user',
          },
        ],
        onEvent: () => undefined,
        requestId: 'provider-connection-test',
        signal: controller.signal,
      });
      return { latencyMs: Math.max(1, Math.round(performance.now() - startedAt)), ok: true };
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  }

  async saveConfig(input: ProviderSaveInput): Promise<ProviderOperationResult> {
    try {
      let lastTestedAt: string | null = null;
      if (input.mode === 'real') {
        const result = await this.testConfig(input);
        if (!result.ok) {
          return result;
        }
        lastTestedAt = new Date().toISOString();
      }
      const config = await this.store.save(input, input.mode, lastTestedAt);
      return { config, ok: true };
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  }

  async deleteCredential(): Promise<ProviderOperationResult> {
    try {
      return { config: await this.store.deleteCredential(), ok: true };
    } catch (error) {
      return { error: toProviderError(error), ok: false };
    }
  }

  async streamConversation(
    input: {
      readonly context: Parameters<typeof buildConversationMessages>[0];
      readonly requestId: string;
      readonly userMessage: string;
    },
    onEvent: (event: ConversationStreamEvent) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const config = await this.store.getPublicConfig();
    if (config.mode !== 'real') {
      throw new ProviderFailure('invalid_configuration');
    }
    const apiKey = await this.store.getCredential();
    if (!apiKey) {
      throw new ProviderFailure('invalid_configuration');
    }
    await this.provider.stream({
      apiKey,
      config,
      messages: buildConversationMessages(input.context, input.userMessage),
      onEvent,
      requestId: input.requestId,
      signal,
    });
  }
}
