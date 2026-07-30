import type { JarvisConversationApi, JarvisProviderApi } from './provider';

export const HEALTH_CHECK_CHANNEL = 'jarvis:health-check' as const;

export interface HealthCheckResult {
  readonly process: 'main';
  readonly status: 'ok';
}

export interface JarvisApi {
  readonly conversation: JarvisConversationApi;
  healthCheck(): Promise<HealthCheckResult>;
  readonly provider: JarvisProviderApi;
}

export function createHealthCheckResult(): HealthCheckResult {
  return {
    process: 'main',
    status: 'ok',
  };
}
