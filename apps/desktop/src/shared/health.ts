export const HEALTH_CHECK_CHANNEL = 'jarvis:health-check' as const;

export interface HealthCheckResult {
  readonly process: 'main';
  readonly status: 'ok';
}

export interface JarvisApi {
  healthCheck(): Promise<HealthCheckResult>;
}

export function createHealthCheckResult(): HealthCheckResult {
  return {
    process: 'main',
    status: 'ok',
  };
}
