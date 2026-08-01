import { useEffect, useMemo, useState } from 'react';

import type {
  SpeechCredentialSource,
  SpeechMode,
  SpeechPublicConfig,
} from '../../../shared/speech';
import type { ProviderError } from '../../../shared/provider';
import { Badge, Button, Dialog, Panel } from '../design-system';

const initialSpeechConfig: SpeechPublicConfig = {
  baseUrl: '',
  credentialSource: 'independent',
  hasCredential: false,
  keySuffix: null,
  language: 'zh',
  lastTestedAt: null,
  mode: 'mock',
  model: '',
  providerId: 'openai-compatible',
  timeoutMs: 45_000,
};

type Feedback =
  | { readonly error: ProviderError; readonly kind: 'error' }
  | { readonly kind: 'success'; readonly message: string }
  | null;

function formatTestedAt(value: string | null): string {
  if (!value) {
    return '尚未通过语音识别连接测试';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function readEvidenceConfig(): SpeechPublicConfig | null {
  const queryIndex = window.location.hash.indexOf('?');
  const state = new URLSearchParams(
    queryIndex < 0 ? '' : window.location.hash.slice(queryIndex + 1),
  ).get('state');
  if (state !== 'stt-empty' && state !== 'stt-configured' && state !== 'stt-error') {
    return null;
  }
  if (state === 'stt-empty' || state === 'stt-error') {
    return initialSpeechConfig;
  }
  return {
    baseUrl: 'https://speech.example/v1',
    credentialSource: 'independent',
    hasCredential: true,
    keySuffix: '1357',
    language: 'zh',
    lastTestedAt: '2026-07-31T08:00:00.000Z',
    mode: 'real',
    model: 'evidence-speech-model',
    providerId: 'openai-compatible',
    timeoutMs: 45_000,
  };
}

export function SpeechSettingsChapter({
  hidden,
  onDirtyChange,
}: {
  readonly hidden: boolean;
  readonly onDirtyChange: (dirty: boolean) => void;
}): React.JSX.Element {
  const [evidence] = useState(readEvidenceConfig);
  const [saved, setSaved] = useState(evidence ?? initialSpeechConfig);
  const [baseUrl, setBaseUrl] = useState((evidence ?? initialSpeechConfig).baseUrl);
  const [model, setModel] = useState((evidence ?? initialSpeechConfig).model);
  const [language, setLanguage] = useState((evidence ?? initialSpeechConfig).language);
  const [timeoutMs, setTimeoutMs] = useState((evidence ?? initialSpeechConfig).timeoutMs);
  const [credentialSource, setCredentialSource] = useState<SpeechCredentialSource>(
    (evidence ?? initialSpeechConfig).credentialSource,
  );
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<SpeechMode>((evidence ?? initialSpeechConfig).mode);
  const [feedback, setFeedback] = useState<Feedback>(() =>
    window.location.hash.includes('state=stt-error')
      ? {
          error: {
            code: 'authentication',
            message: '身份验证失败，请检查语音识别 API Key。',
            providerId: 'openai-compatible',
            requestId: 'speech-evidence',
            retryable: false,
            safeTechnicalSummary: 'speech_evidence_authentication',
            status: 401,
          },
          kind: 'error',
        }
      : null,
  );
  const [busy, setBusy] = useState<'delete' | 'load' | 'save' | 'test' | null>(
    evidence || !window.jarvis?.speech ? null : 'load',
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (evidence) {
      return;
    }
    const speechApi = window.jarvis?.speech;
    if (!speechApi) {
      return;
    }
    let mounted = true;
    void speechApi
      .getConfig()
      .then((config) => {
        if (!mounted) {
          return;
        }
        setSaved(config);
        setBaseUrl(config.baseUrl);
        setModel(config.model);
        setLanguage(config.language);
        setTimeoutMs(config.timeoutMs);
        setCredentialSource(config.credentialSource);
        setMode(config.mode);
      })
      .catch(() => {
        if (mounted) {
          setFeedback({
            error: {
              code: 'unknown',
              message: '无法读取语音识别配置。',
              providerId: 'openai-compatible',
              requestId: 'speech-configuration',
              retryable: true,
              safeTechnicalSummary: 'speech_config_read_failed',
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

  const dirty = useMemo(
    () =>
      Boolean(apiKey.trim()) ||
      baseUrl.trim() !== saved.baseUrl ||
      model.trim() !== saved.model ||
      language.trim() !== saved.language ||
      timeoutMs !== saved.timeoutMs ||
      credentialSource !== saved.credentialSource ||
      mode !== saved.mode,
    [apiKey, baseUrl, credentialSource, language, mode, model, saved, timeoutMs],
  );

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const draft = {
    ...(apiKey.trim() && credentialSource === 'independent' ? { apiKey: apiKey.trim() } : {}),
    baseUrl: baseUrl.trim(),
    credentialSource,
    language: language.trim(),
    model: model.trim(),
    timeoutMs,
  };
  const canSubmit =
    Boolean(baseUrl.trim() && model.trim() && language.trim()) &&
    timeoutMs >= 1_000 &&
    timeoutMs <= 120_000;

  async function testConnection(): Promise<void> {
    setBusy('test');
    setFeedback(null);
    const result = await window.jarvis.speech.testConfig(draft);
    setFeedback(
      result.ok
        ? {
            kind: 'success',
            message: `连接测试通过（${result.latencyMs} ms）。测试使用仓库生成的短音频，可能产生少量 Provider 费用。`,
          }
        : { error: result.error, kind: 'error' },
    );
    setBusy(null);
  }

  async function saveConfiguration(): Promise<void> {
    setBusy('save');
    setFeedback(null);
    const result = await window.jarvis.speech.saveConfig({ ...draft, mode });
    if (result.ok) {
      setSaved(result.config);
      setApiKey('');
      setFeedback({
        kind: 'success',
        message:
          result.config.mode === 'real'
            ? '真实语音识别已安全保存并启用。'
            : '语音识别配置已保存，当前继续使用本地 Mock。',
      });
    } else {
      setFeedback({ error: result.error, kind: 'error' });
    }
    setBusy(null);
  }

  async function deleteCredential(): Promise<void> {
    setBusy('delete');
    const result = await window.jarvis.speech.deleteCredential();
    if (result.ok) {
      setSaved(result.config);
      setMode('mock');
      setCredentialSource('independent');
      setApiKey('');
      setFeedback({ kind: 'success', message: '语音识别凭据已删除，模式已恢复为 Mock。' });
    } else {
      setFeedback({ error: result.error, kind: 'error' });
    }
    setDeleteOpen(false);
    setBusy(null);
  }

  return (
    <div className="settings-layout" hidden={hidden}>
      <Panel className="settings-provider">
        <header>
          <p>OpenAI-compatible · Multipart</p>
          <h2>Speech-to-Text Provider</h2>
          <span>录音只在用户主动结束采集后，通过 main process 发送到配置的识别服务。</span>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveConfiguration();
          }}
        >
          <fieldset>
            <legend>语音识别模式</legend>
            <label className="settings-mode">
              <input
                checked={mode === 'mock'}
                disabled={busy !== null}
                name="speech-mode"
                onChange={() => setMode('mock')}
                type="radio"
              />
              <span>
                <strong>本地 Mock</strong>
                <small>不会上传录音，继续使用确定性模拟转录。</small>
              </span>
            </label>
            <label className="settings-mode">
              <input
                checked={mode === 'real'}
                disabled={busy !== null}
                name="speech-mode"
                onChange={() => setMode('real')}
                type="radio"
              />
              <span>
                <strong>真实语音识别</strong>
                <small>录音会发送给配置的第三方 Provider；失败不会静默切换 Mock。</small>
              </span>
            </label>
          </fieldset>

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
          </label>

          <div className="settings-field-row">
            <label>
              <span>模型名称</span>
              <input
                autoComplete="off"
                disabled={busy !== null}
                onChange={(event) => setModel(event.target.value)}
                placeholder="输入实际支持的语音识别模型 ID"
                required
                value={model}
              />
            </label>
            <label>
              <span>语言</span>
              <input
                autoComplete="off"
                disabled={busy !== null}
                onChange={(event) => setLanguage(event.target.value)}
                required
                value={language}
              />
              <small>默认 `zh`，也可填写 Provider 支持的语言代码。</small>
            </label>
            <label>
              <span>超时（毫秒）</span>
              <input
                disabled={busy !== null}
                max={120000}
                min={1000}
                onChange={(event) => setTimeoutMs(Number(event.target.value))}
                required
                type="number"
                value={timeoutMs}
              />
            </label>
          </div>

          <fieldset>
            <legend>凭据来源</legend>
            <label className="settings-mode">
              <input
                checked={credentialSource === 'independent'}
                disabled={busy !== null}
                name="speech-credential-source"
                onChange={() => setCredentialSource('independent')}
                type="radio"
              />
              <span>
                <strong>独立语音识别凭据</strong>
                <small>单独加密保存，不与 Conversation 配置混合。</small>
              </span>
            </label>
            <label className="settings-mode">
              <input
                checked={credentialSource === 'conversation'}
                disabled={busy !== null}
                name="speech-credential-source"
                onChange={() => setCredentialSource('conversation')}
                type="radio"
              />
              <span>
                <strong>复用 Conversation 凭据引用</strong>
                <small>只保存引用；完整 Key 仍只在 main process 解密。</small>
              </span>
            </label>
          </fieldset>

          {credentialSource === 'independent' ? (
            <label>
              <span>API Key</span>
              <input
                autoComplete="new-password"
                disabled={busy !== null}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={
                  saved.hasCredential && saved.credentialSource === 'independent'
                    ? `已安全保存 · 末四位 ${saved.keySuffix ?? '••••'}`
                    : '输入后仅交给 main process'
                }
                type="password"
                value={apiKey}
              />
              <small>保存后不会回显完整 Key；Renderer 只能看到末四位。</small>
            </label>
          ) : (
            <p className="settings-credential-reference">
              将使用 Conversation 安全存储中的凭据。语音识别仍会独立测试自己的 endpoint 与模型。
            </p>
          )}

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
              disabled={!canSubmit}
              loading={busy === 'test'}
              onClick={() => void testConnection()}
              variant="secondary"
            >
              测试语音识别连接
            </Button>
            <Button disabled={!canSubmit} loading={busy === 'save'} type="submit">
              保存语音识别配置
            </Button>
          </footer>
        </form>
      </Panel>

      <aside className="settings-notes">
        <Panel tone="soft">
          <p>当前状态</p>
          <h2>{saved.mode === 'real' ? '真实 STT 已配置' : '使用 Mock STT'}</h2>
          <Badge tone={saved.mode === 'real' ? 'success' : 'warning'}>
            {saved.mode === 'real' ? '真实语音识别' : '本地 Mock'}
          </Badge>
          <span>{formatTestedAt(saved.lastTestedAt)}</span>
          <span>
            {saved.hasCredential
              ? `凭据可用 · 末四位 ${saved.keySuffix ?? '••••'}`
              : '当前没有可用凭据'}
          </span>
          {saved.hasCredential && saved.credentialSource === 'independent' ? (
            <Button
              loading={busy === 'delete'}
              onClick={() => setDeleteOpen(true)}
              size="small"
              variant="quiet"
            >
              删除语音识别凭据
            </Button>
          ) : null}
        </Panel>
        <Panel tone="soft">
          <p>音频与隐私</p>
          <ul>
            <li>麦克风只在主动录音期间启用</li>
            <li>真实模式会把本次音频发送给配置的第三方</li>
            <li>原始音频不写入磁盘，识别后释放</li>
            <li>重试期间只短暂保留当前一份录音</li>
            <li>Conversation 只接收用户确认后的文字，不接收音频</li>
            <li>第三方的数据处理仍受其服务条款约束</li>
          </ul>
        </Panel>
      </aside>

      <Dialog
        description="删除后，真实语音识别会恢复为 Mock；Conversation 凭据不受影响。"
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title="删除语音识别 API Key？"
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
    </div>
  );
}
