import { useEffect, useState } from 'react';

import type {
  ConversationMode,
  ProviderError,
  ProviderPublicConfig,
} from '../../../shared/provider';
import { Badge, Button, Dialog, Panel } from '../design-system';
import { AppShell } from '../shell/AppShell';
import './settings.css';

type Feedback =
  | { readonly kind: 'error'; readonly error: ProviderError }
  | { readonly kind: 'success'; readonly message: string }
  | null;

const initialConfig: ProviderPublicConfig = {
  baseUrl: '',
  hasCredential: false,
  keySuffix: null,
  lastTestedAt: null,
  mode: 'mock',
  model: '',
};

type SettingsEvidenceState = 'configured' | 'empty' | 'error' | 'success' | null;

function readEvidenceState(hash: string): SettingsEvidenceState {
  const queryIndex = hash.indexOf('?');
  const state = new URLSearchParams(queryIndex < 0 ? '' : hash.slice(queryIndex + 1)).get('state');
  return state === 'configured' || state === 'empty' || state === 'error' || state === 'success'
    ? state
    : null;
}

function evidenceConfig(state: SettingsEvidenceState): ProviderPublicConfig {
  if (!state || state === 'empty' || state === 'error') {
    return initialConfig;
  }
  return {
    baseUrl: 'https://provider.example/v1',
    hasCredential: true,
    keySuffix: '2468',
    lastTestedAt: state === 'success' ? '2026-07-30T08:00:00.000Z' : null,
    mode: state === 'success' ? 'real' : 'mock',
    model: 'evidence-model',
  };
}

function formatTestedAt(value: string | null): string {
  if (!value) {
    return '尚未通过连接测试';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SettingsPage(): React.JSX.Element {
  const [evidence] = useState(() => readEvidenceState(window.location.hash));
  const [saved, setSaved] = useState(() => evidenceConfig(evidence));
  const [baseUrl, setBaseUrl] = useState(() => evidenceConfig(evidence).baseUrl);
  const [model, setModel] = useState(() => evidenceConfig(evidence).model);
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<ConversationMode>(() => evidenceConfig(evidence).mode);
  const [feedback, setFeedback] = useState<Feedback>(() =>
    evidence === 'success'
      ? { kind: 'success', message: '连接测试通过。真实文字回答可以使用。' }
      : evidence === 'error'
        ? {
            error: {
              code: 'authentication',
              message: '身份验证失败，请检查 API Key。',
              providerId: 'openai-compatible',
              requestId: 'provider-evidence',
              retryable: false,
              safeTechnicalSummary: 'evidence_authentication_failed',
              status: 401,
            },
            kind: 'error',
          }
        : null,
  );
  const [busy, setBusy] = useState<'delete' | 'load' | 'save' | 'test' | null>(
    evidence ? null : 'load',
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (evidence) {
      return;
    }
    let mounted = true;
    void window.jarvis.provider
      .getConfig()
      .then((config) => {
        if (!mounted) {
          return;
        }
        setSaved(config);
        setBaseUrl(config.baseUrl);
        setModel(config.model);
        setMode(config.mode);
      })
      .catch(() => {
        if (mounted) {
          setFeedback({
            error: {
              code: 'unknown',
              message: '无法读取 Provider 配置。',
              providerId: 'openai-compatible',
              requestId: 'provider-configuration',
              retryable: true,
              safeTechnicalSummary: 'config_read_failed',
            },
            kind: 'error',
          });
        }
      })
      .finally(() => {
        if (mounted) {
          setBusy(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, [evidence]);

  const draft = {
    ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    baseUrl: baseUrl.trim(),
    model: model.trim(),
  };

  async function testConnection(): Promise<void> {
    setBusy('test');
    setFeedback(null);
    const result = await window.jarvis.provider.testConfig(draft);
    if (result.ok) {
      setFeedback({
        kind: 'success',
        message: `连接测试通过（${result.latencyMs} ms）。密钥尚未因此写入配置。`,
      });
    } else {
      setFeedback({ error: result.error, kind: 'error' });
    }
    setBusy(null);
  }

  async function saveConfiguration(): Promise<void> {
    setBusy('save');
    setFeedback(null);
    const result = await window.jarvis.provider.saveConfig({ ...draft, mode });
    if (result.ok) {
      setSaved(result.config);
      setApiKey('');
      setFeedback({
        kind: 'success',
        message:
          result.config.mode === 'real'
            ? '配置已通过测试并安全保存。真实文字回答现已启用。'
            : '配置已保存，Conversation 继续使用本地 Mock。',
      });
    } else {
      setFeedback({ error: result.error, kind: 'error' });
    }
    setBusy(null);
  }

  async function deleteCredential(): Promise<void> {
    setBusy('delete');
    const result = await window.jarvis.provider.deleteCredential();
    if (result.ok) {
      setSaved(result.config);
      setMode('mock');
      setApiKey('');
      setFeedback({ kind: 'success', message: '凭据已删除，模式已恢复为本地 Mock。' });
    } else {
      setFeedback({ error: result.error, kind: 'error' });
    }
    setDeleteOpen(false);
    setBusy(null);
  }

  return (
    <AppShell activeRoute="settings">
      <main className="settings-page">
        <header className="settings-hero">
          <div>
            <p>Settings · Provider foundation</p>
            <h1>连接真实的文字思考</h1>
            <span>
              网络请求与 API Key 始终留在 Electron main
              process。当前只接通文字回答，不包含语音识别或语音合成。
            </span>
          </div>
          <Badge tone={saved.mode === 'real' ? 'success' : 'warning'}>
            {saved.mode === 'real' ? '真实文字模式' : '本地 Mock 模式'}
          </Badge>
        </header>

        <div className="settings-layout">
          <Panel className="settings-provider">
            <header>
              <p>OpenAI-compatible</p>
              <h2>Conversation Provider</h2>
              <span>支持 Chat Completions SSE 接口与自定义兼容地址。</span>
            </header>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveConfiguration();
              }}
            >
              <label>
                <span>Base URL</span>
                <input
                  autoComplete="url"
                  disabled={busy !== null}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://provider.example/v1"
                  required
                  type="url"
                  value={baseUrl}
                />
                <small>公网地址必须使用 HTTPS；开发环境允许 localhost HTTP。</small>
              </label>

              <label>
                <span>模型名称</span>
                <input
                  autoComplete="off"
                  disabled={busy !== null}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="输入 Provider 实际支持的模型 ID"
                  required
                  value={model}
                />
              </label>

              <label>
                <span>API Key</span>
                <input
                  autoComplete="new-password"
                  disabled={busy !== null}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={
                    saved.hasCredential
                      ? `已安全保存 · 末四位 ${saved.keySuffix ?? '••••'}`
                      : '输入后仅交给 main process'
                  }
                  type="password"
                  value={apiKey}
                />
                <small>Renderer 不会读取已保存的密钥；留空会继续使用系统安全存储中的凭据。</small>
              </label>

              <fieldset>
                <legend>Conversation 回答模式</legend>
                <label className="settings-mode">
                  <input
                    checked={mode === 'mock'}
                    disabled={busy !== null}
                    name="provider-mode"
                    onChange={() => setMode('mock')}
                    type="radio"
                  />
                  <span>
                    <strong>本地 Mock</strong>
                    <small>确定性演示，不发送网络请求。</small>
                  </span>
                </label>
                <label className="settings-mode">
                  <input
                    checked={mode === 'real'}
                    disabled={busy !== null}
                    name="provider-mode"
                    onChange={() => setMode('real')}
                    type="radio"
                  />
                  <span>
                    <strong>真实文字回答</strong>
                    <small>保存时必须先通过连接测试；失败不会自动回退。</small>
                  </span>
                </label>
              </fieldset>

              {feedback ? (
                <div
                  className={`settings-feedback settings-feedback--${feedback.kind}`}
                  role={feedback.kind === 'error' ? 'alert' : 'status'}
                >
                  <strong>
                    {feedback.kind === 'error' ? feedback.error.message : feedback.message}
                  </strong>
                  {feedback.kind === 'error' ? (
                    <small>
                      错误代码：{feedback.error.code}
                      {feedback.error.status ? ` · HTTP ${feedback.error.status}` : ''}
                    </small>
                  ) : null}
                </div>
              ) : null}

              <footer>
                <Button
                  disabled={!baseUrl.trim() || !model.trim()}
                  loading={busy === 'test'}
                  onClick={() => void testConnection()}
                  variant="secondary"
                >
                  测试连接
                </Button>
                <Button
                  disabled={!baseUrl.trim() || !model.trim()}
                  loading={busy === 'save'}
                  type="submit"
                >
                  保存配置
                </Button>
              </footer>
            </form>
          </Panel>

          <aside className="settings-notes">
            <Panel tone="soft">
              <p>当前边界</p>
              <h2>只接通文字模型</h2>
              <ul>
                <li>真实请求由 main process 发出</li>
                <li>API Key 使用系统 safeStorage 加密</li>
                <li>回答以 SSE 片段进入现有时间线</li>
                <li>没有真实 STT、TTS 或长期记忆</li>
              </ul>
            </Panel>
            <Panel tone="soft">
              <p>最近验证</p>
              <strong>{formatTestedAt(saved.lastTestedAt)}</strong>
              <span>
                {saved.hasCredential
                  ? `已保存凭据 · 末四位 ${saved.keySuffix ?? '••••'}`
                  : '当前没有保存凭据'}
              </span>
              {saved.hasCredential ? (
                <Button
                  loading={busy === 'delete'}
                  onClick={() => setDeleteOpen(true)}
                  size="small"
                  variant="quiet"
                >
                  删除凭据
                </Button>
              ) : null}
            </Panel>
          </aside>
        </div>
      </main>

      <Dialog
        description="删除后，Conversation 会立即恢复为本地 Mock。此操作不会影响 Provider 服务端。"
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title="删除已保存的 API Key？"
      >
        <div className="settings-delete-actions">
          <Button
            data-dialog-initial-focus
            onClick={() => setDeleteOpen(false)}
            variant="secondary"
          >
            保留凭据
          </Button>
          <Button error onClick={() => void deleteCredential()}>
            确认删除
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
