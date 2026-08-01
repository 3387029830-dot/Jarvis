import type { ProviderError, ProviderErrorCode } from '../../shared/provider';

const publicMessages: Record<ProviderErrorCode, string> = {
  authentication: '身份验证失败，请检查 API Key。',
  permission: '当前凭据没有访问此 Provider 资源的权限。',
  invalid_configuration: 'Provider 配置无效，请检查地址、凭据和模型名称。',
  invalid_model: 'Provider 无法找到或不支持这个模型。',
  rate_limit: 'Provider 请求过于频繁，请稍后再试。',
  quota_exceeded: 'Provider 配额或余额不足。',
  timeout: 'Provider 响应超时，请稍后再试。',
  network: '无法连接到 Provider，请检查网络和服务地址。',
  provider_unavailable: 'Provider 服务暂时不可用。',
  content_rejected: 'Provider 拒绝了这次内容请求。',
  cancelled: '本轮回答已取消。',
  malformed_response: 'Provider 返回了无法安全解析的流式数据。',
  audio_too_short: '这段录音太短，请重新录制。',
  audio_too_large: '这段录音超出本轮允许的大小。',
  unsupported_audio_format: '当前录音格式不受语音识别服务支持。',
  empty_transcript: 'Provider 没有识别出可确认的文字。',
  transcription_failed: '这次语音识别没有完成，请重试或重新录音。',
  unknown: 'Provider 请求未能完成。',
};

export class ProviderFailure extends Error {
  readonly code: ProviderErrorCode;
  readonly retryable: boolean;
  readonly status?: number;
  readonly safeTechnicalSummary: string;

  constructor(
    code: ProviderErrorCode,
    options: {
      readonly cause?: unknown;
      readonly safeTechnicalSummary?: string;
      readonly status?: number;
    } = {},
  ) {
    super(publicMessages[code], { cause: options.cause });
    this.name = 'ProviderFailure';
    this.code = code;
    this.retryable = [
      'network',
      'provider_unavailable',
      'rate_limit',
      'timeout',
      'transcription_failed',
      'unknown',
    ].includes(code);
    this.safeTechnicalSummary = options.safeTechnicalSummary ?? code;
    if (options.status !== undefined) {
      this.status = options.status;
    }
  }

  toPublicError(requestId = 'provider-configuration'): ProviderError {
    return {
      code: this.code,
      message: this.message,
      providerId: 'openai-compatible',
      requestId,
      retryable: this.retryable,
      safeTechnicalSummary: this.safeTechnicalSummary,
      ...(this.status === undefined ? {} : { status: this.status }),
    };
  }
}

export function toProviderError(error: unknown, requestId?: string): ProviderError {
  if (error instanceof ProviderFailure) {
    return error.toPublicError(requestId);
  }
  return new ProviderFailure('unknown', { cause: error }).toPublicError(requestId);
}
