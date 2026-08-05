import { useEffect, useMemo, useRef, useState } from 'react';

import type { ProviderError } from '../../../shared/provider';
import type {
  TtsMode,
  TtsPlaybackMode,
  TtsPublicConfig,
  TtsPublicVoiceProfile,
  VoiceProfile,
  VoiceProfileCategory,
} from '../../../shared/tts';
import { Badge, Button, Panel } from '../design-system';

const emptyConfig: TtsPublicConfig = {
  baseUrl: 'https://api.minimax.io/v1',
  hasCredential: false,
  keySuffix: null,
  language: 'Chinese',
  lastTestedAt: null,
  mode: 'mock',
  model: 'speech-2.8-turbo',
  playbackMode: 'manual',
  profiles: [],
  providerId: 'minimax',
  selectedProfileId: null,
  templates: [
    {
      description: '克制、从容，适合长时间陪伴。',
      displayName: '静默管家',
      id: 'silent-steward',
      locale: 'zh-CN',
    },
    {
      description: '温暖而不说教，适合梳理复杂问题。',
      displayName: '温和导师',
      id: 'gentle-mentor',
      locale: 'zh-CN',
    },
    {
      description: '清晰、平衡，适合日常认知对话。',
      displayName: '理性同伴',
      id: 'rational-companion',
      locale: 'zh-CN',
    },
    {
      description: '更轻、更慢，适合夜间回顾。',
      displayName: '夜间低语',
      id: 'night-whisper',
      locale: 'zh-CN',
    },
  ],
  timeoutMs: 45_000,
};
type Feedback =
  { kind: 'error'; error: ProviderError } | { kind: 'success'; message: string } | null;

function evidenceConfig(): TtsPublicConfig | null {
  const state = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('state');
  if (!state?.startsWith('tts-') && !state?.startsWith('voice-')) return null;
  if (state === 'tts-empty') return emptyConfig;
  const installed: TtsPublicVoiceProfile = {
    authorization: {
      basis: 'original-work',
      expiresAt: null,
      permittedUse: 'Jarvis 产品视觉验收',
      reference: 'EVIDENCE-006C',
      rightsHolder: 'Jarvis 原创声线团队',
    },
    category: 'original',
    description: '清晰、平衡，适合日常认知对话。',
    displayName: '理性同伴',
    id: 'evidence-rational',
    locale: 'zh-CN',
    model: 'speech-2.8-turbo',
    previewText: '我在这里。我们可以从真正好奇的问题开始。',
    providerId: 'minimax',
    templateId: 'rational-companion',
  };
  return {
    ...emptyConfig,
    hasCredential: true,
    keySuffix: '2468',
    lastTestedAt: '2026-08-01T05:00:00.000Z',
    mode: 'real',
    profiles: [installed],
    selectedProfileId: installed.id,
  };
}

export function TtsSettingsChapter({
  active,
  onDirtyChange,
  onProfileDirtyChange,
}: {
  readonly active: 'tts' | 'voices' | null;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onProfileDirtyChange: (dirty: boolean) => void;
}): React.JSX.Element {
  const [evidence] = useState(evidenceConfig);
  const initial = evidence ?? emptyConfig;
  const [saved, setSaved] = useState(initial);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [language, setLanguage] = useState(initial.language);
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<TtsMode>(initial.mode);
  const [playbackMode, setPlaybackMode] = useState<TtsPlaybackMode>(initial.playbackMode);
  const [feedback, setFeedback] = useState<Feedback>(() =>
    window.location.hash.includes('voice-preview')
      ? { kind: 'success', message: '试听已完成。试听不会改变当前声线，并可能产生 Provider 费用。' }
      : null,
  );
  const [busy, setBusy] = useState<string | null>(evidence || !window.jarvis?.tts ? null : 'load');
  const [templateId, setTemplateId] = useState('rational-companion');
  const [category, setCategory] = useState<VoiceProfileCategory>('original');
  const [voiceId, setVoiceId] = useState(() =>
    window.location.hash.includes('voice-binding') ? '填写你的 MiniMax voice ID' : '',
  );
  const [rightsHolder, setRightsHolder] = useState(() =>
    window.location.hash.includes('voice-binding') ? '声线权利方' : '',
  );
  const [authorizationReference, setAuthorizationReference] = useState(() =>
    window.location.hash.includes('voice-binding') ? '授权合同或同意记录编号' : '',
  );
  const [permittedUse, setPermittedUse] = useState('仅用于本人在 Jarvis 中的语音播放');
  const [expiresAt, setExpiresAt] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (evidence) return;
    let mounted = true;
    const api = window.jarvis?.tts;
    if (!api) {
      return;
    }
    void Promise.resolve(api.getConfig())
      .then((config) => {
        if (!mounted || !config) return;
        setSaved(config);
        setBaseUrl(config.baseUrl);
        setModel(config.model);
        setLanguage(config.language);
        setMode(config.mode);
        setPlaybackMode(config.playbackMode);
      })
      .catch(() =>
        setFeedback({
          kind: 'error',
          error: {
            code: 'unknown',
            message: '无法读取语音合成配置。',
            providerId: 'openai-compatible',
            requestId: 'tts-config',
            retryable: true,
            safeTechnicalSummary: 'tts_config_read_failed',
          },
        }),
      )
      .finally(() => mounted && setBusy(null));
    return () => {
      mounted = false;
    };
  }, [evidence]);
  const dirty =
    Boolean(apiKey) ||
    baseUrl !== saved.baseUrl ||
    model !== saved.model ||
    language !== saved.language ||
    mode !== saved.mode ||
    playbackMode !== saved.playbackMode;
  const profileDirty = Boolean(
    voiceId.trim() ||
    rightsHolder.trim() ||
    authorizationReference.trim() ||
    expiresAt ||
    permittedUse !== '仅用于本人在 Jarvis 中的语音播放',
  );
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onProfileDirtyChange(profileDirty), [onProfileDirtyChange, profileDirty]);
  useEffect(() => {
    const state = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('state');
    const frame = window.requestAnimationFrame(() => {
      if (state === 'tts-configured')
        document
          .querySelector<HTMLInputElement>('input[type="password"]')
          ?.scrollIntoView({ block: 'center' });
      if (state === 'voice-binding' || state === 'voice-preview')
        document.querySelector<HTMLElement>('.voice-binding')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(
    () => () => {
      previewAudioRef.current?.pause();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );
  const draft = useMemo(
    () => ({
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      baseUrl: baseUrl.trim(),
      language,
      model: model.trim(),
      timeoutMs: 45_000,
    }),
    [apiKey, baseUrl, language, model],
  );
  const template = saved.templates.find((item) => item.id === templateId) ?? saved.templates[0];
  const authorizationBasisByCategory = {
    original: 'original-work',
    'licensed-character': 'license',
    'consented-clone': 'explicit-consent',
  } as const;
  async function save(): Promise<void> {
    setBusy('save');
    setFeedback(null);
    const result = await window.jarvis.tts.saveConfig({ ...draft, mode, playbackMode });
    if (result.ok) {
      setSaved(result.config);
      setApiKey('');
      setFeedback({
        kind: 'success',
        message: mode === 'real' ? '真实语音合成已安全保存。' : '配置已保存；真实 TTS 仍关闭。',
      });
    } else setFeedback({ kind: 'error', error: result.error });
    setBusy(null);
  }
  async function test(): Promise<void> {
    setBusy('test');
    const result = await window.jarvis.tts.testConfig(draft);
    setFeedback(
      result.ok
        ? {
            kind: 'success',
            message: `连接与试听合成通过（${result.latencyMs} ms）。本次会产生少量 Provider 费用。`,
          }
        : { kind: 'error', error: result.error },
    );
    setBusy(null);
  }
  async function install(): Promise<void> {
    if (!template) return;
    setBusy('install');
    const profile: VoiceProfile = {
      authorization: {
        basis: authorizationBasisByCategory[category],
        expiresAt: expiresAt || null,
        permittedUse,
        reference: authorizationReference,
        rightsHolder,
      },
      category,
      description: template.description,
      displayName: template.displayName,
      id: `profile-${Date.now().toString(36)}`,
      locale: template.locale,
      model,
      previewText: '你好，我会以清晰、克制的方式陪你继续思考。',
      providerId: 'minimax',
      providerVoiceId: voiceId,
      templateId: template.id,
    };
    const result = await window.jarvis.tts.installProfile(profile);
    if (result.ok) {
      setSaved(result.config);
      setVoiceId('');
      setRightsHolder('');
      setAuthorizationReference('');
      setPermittedUse('仅用于本人在 Jarvis 中的语音播放');
      setExpiresAt('');
      setFeedback({ kind: 'success', message: '声线绑定已安装。它不会自动成为当前声线。' });
    } else setFeedback({ kind: 'error', error: result.error });
    setBusy(null);
  }
  async function select(id: string): Promise<void> {
    const result = await window.jarvis.tts.selectProfile(id);
    if (result.ok) {
      setSaved(result.config);
      setFeedback({ kind: 'success', message: '当前表达声线已更新。' });
    } else setFeedback({ kind: 'error', error: result.error });
  }
  async function deleteProfile(id: string): Promise<void> {
    stopPreview();
    const result = await window.jarvis.tts.deleteProfile(id);
    if (result.ok) {
      setSaved(result.config);
      setFeedback({ kind: 'success', message: '声线绑定已从本机配置中删除。' });
    } else {
      setFeedback({ kind: 'error', error: result.error });
    }
  }
  function stopPreview(): void {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewingId(null);
  }
  async function preview(profile: TtsPublicVoiceProfile): Promise<void> {
    stopPreview();
    setPreviewingId(profile.id);
    setFeedback(null);
    const result = await window.jarvis.tts.synthesize({
      requestId: `tts-preview-${profile.id}`,
      text: profile.previewText,
      voiceProfileId: profile.id,
    });
    if (!result.ok) {
      setPreviewingId(null);
      setFeedback({ kind: 'error', error: result.error });
      return;
    }
    const buffer = new ArrayBuffer(result.audio.byteLength);
    new Uint8Array(buffer).set(result.audio);
    const objectUrl = URL.createObjectURL(new Blob([buffer], { type: result.mimeType }));
    previewUrlRef.current = objectUrl;
    const audio = new Audio(objectUrl);
    previewAudioRef.current = audio;
    audio.addEventListener('ended', stopPreview, { once: true });
    audio.addEventListener('error', stopPreview, { once: true });
    await audio.play().catch(() => {
      stopPreview();
      setFeedback({
        kind: 'error',
        error: {
          code: 'unknown',
          message: '试听播放失败，声线选择没有改变。',
          providerId: 'minimax',
          requestId: 'tts-preview',
          retryable: true,
          safeTechnicalSummary: 'tts_preview_playback_failed',
        },
      });
    });
  }
  return (
    <>
      <section className="settings-layout" hidden={active !== 'tts'} aria-label="语音合成设置">
        <Panel className="settings-provider">
          <header>
            <p>MiniMax · Expression</p>
            <h2>Text-to-Speech</h2>
            <span>回答默认以文字呈现；播放由你控制。音频只保存在内存中。</span>
            {saved.hasCredential ? (
              <Badge tone="success">已安全保存 · 末四位 {saved.keySuffix ?? '••••'}</Badge>
            ) : null}
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label>
              <span>Base URL</span>
              <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              <small>官方默认：https://api.minimax.io/v1</small>
            </label>
            <label>
              <span>模型</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="speech-2.8-turbo">speech-2.8-turbo</option>
                <option value="speech-2.8-hd">speech-2.8-hd</option>
              </select>
            </label>
            <label>
              <span>语言增强</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="Chinese">Chinese</option>
                <option value="auto">auto</option>
              </select>
            </label>
            <label>
              <span>API Key</span>
              <input
                autoComplete="new-password"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  saved.hasCredential
                    ? `已安全保存 · 末四位 ${saved.keySuffix ?? '••••'}`
                    : '仅交给 main process'
                }
              />
            </label>
            <fieldset>
              <legend>真实合成</legend>
              <label className="settings-mode">
                <input type="radio" checked={mode === 'mock'} onChange={() => setMode('mock')} />
                <span>
                  <strong>关闭真实 TTS</strong>
                  <small>保留文字回答与本地演示回退。</small>
                </span>
              </label>
              <label className="settings-mode">
                <input type="radio" checked={mode === 'real'} onChange={() => setMode('real')} />
                <span>
                  <strong>启用 MiniMax</strong>
                  <small>保存前需要已选声线并完成短句测试。</small>
                </span>
              </label>
            </fieldset>
            <fieldset>
              <legend>回答播放方式</legend>
              {(['off', 'manual', 'automatic'] as const).map((value) => (
                <label className="settings-mode" key={value}>
                  <input
                    type="radio"
                    checked={playbackMode === value}
                    onChange={() => setPlaybackMode(value)}
                  />
                  <span>
                    <strong>
                      {{ off: '不播放', manual: '手动播放', automatic: '自动播放' }[value]}
                    </strong>
                    <small>
                      {value === 'automatic'
                        ? '新回答完成后自动开始，仍可随时停止。'
                        : value === 'manual'
                          ? '默认选择；由你决定何时朗读。'
                          : '始终保留文字路径。'}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            {feedback ? (
              <div
                className={`settings-feedback settings-feedback--${feedback.kind}`}
                role={feedback.kind === 'error' ? 'alert' : 'status'}
              >
                <strong>
                  {feedback.kind === 'error' ? feedback.error.message : feedback.message}
                </strong>
              </div>
            ) : null}
            <footer>
              <Button
                type="button"
                variant="secondary"
                loading={busy === 'test'}
                disabled={!saved.selectedProfileId}
                onClick={() => void test()}
              >
                测试短句合成
              </Button>
              <Button type="submit" loading={busy === 'save'}>
                保存配置
              </Button>
            </footer>
          </form>
        </Panel>
        <aside className="settings-notes">
          <Panel tone="soft">
            <p>费用与隐私</p>
            <h2>按文本产生费用</h2>
            <ul>
              <li>只有朗读时文本才会发送到 MiniMax</li>
              <li>完整 Key 不返回 Renderer</li>
              <li>音频不写入磁盘</li>
              <li>失败时文字回答始终保留</li>
            </ul>
          </Panel>
        </aside>
      </section>
      <section
        className="settings-voice-library"
        hidden={active !== 'voices'}
        aria-label="声线档案"
      >
        <header>
          <div>
            <p>Voice Profile library</p>
            <h2>选择 Jarvis 如何表达</h2>
            <span>产品声线身份与 Provider voice ID 分离；模板不会自带或暗示授权。</span>
          </div>
          <Badge tone="accent">默认视觉 · 理性同伴</Badge>
        </header>
        <div className="voice-template-grid">
          {saved.templates.map((item) => {
            const installed = saved.profiles.find((profile) => profile.templateId === item.id);
            return (
              <Panel key={item.id} tone={item.id === templateId ? 'elevated' : 'soft'}>
                <p>{item.locale}</p>
                <h3>{item.displayName}</h3>
                <span>{item.description}</span>
                <small>
                  {installed ? `已绑定 · ${installed.category}` : '尚未绑定 Provider 声线'}
                </small>
                <Button size="small" variant="secondary" onClick={() => setTemplateId(item.id)}>
                  {item.id === templateId ? '正在编辑' : '配置绑定'}
                </Button>
                {installed ? (
                  <>
                    <Button
                      size="small"
                      variant="quiet"
                      onClick={
                        previewingId === installed.id ? stopPreview : () => void preview(installed)
                      }
                    >
                      {previewingId === installed.id ? '停止试听' : '试听 · 可能产生费用'}
                    </Button>
                    <Button
                      size="small"
                      disabled={saved.selectedProfileId === installed.id}
                      onClick={() => void select(installed.id)}
                    >
                      {saved.selectedProfileId === installed.id ? '当前声线' : '选择声线'}
                    </Button>
                    <Button
                      size="small"
                      variant="quiet"
                      onClick={() => void deleteProfile(installed.id)}
                    >
                      删除绑定
                    </Button>
                  </>
                ) : null}
              </Panel>
            );
          })}
        </div>
        {feedback ? (
          <div
            className={`settings-feedback settings-feedback--${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            <strong>{feedback.kind === 'error' ? feedback.error.message : feedback.message}</strong>
          </div>
        ) : null}
        <Panel className="voice-binding">
          <header>
            <p>Manual provider binding</p>
            <h2>为“{template?.displayName ?? '声线'}”安装授权绑定</h2>
            <span>缺少权利人、授权凭据或允许用途时，无法安装、选择或试听。</span>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void install();
            }}
          >
            <label>
              <span>声线类别</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VoiceProfileCategory)}
              >
                <option value="original">Original Profile</option>
                <option value="licensed-character">Licensed Character Profile</option>
                <option value="consented-clone">Consented Clone Profile</option>
              </select>
            </label>
            <label>
              <span>MiniMax voice ID</span>
              <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} required />
            </label>
            <label>
              <span>权利人</span>
              <input
                value={rightsHolder}
                onChange={(e) => setRightsHolder(e.target.value)}
                required
              />
            </label>
            <label>
              <span>授权凭据 / 来源</span>
              <input
                value={authorizationReference}
                onChange={(e) => setAuthorizationReference(e.target.value)}
                required
              />
            </label>
            <label>
              <span>允许用途</span>
              <input
                value={permittedUse}
                onChange={(e) => setPermittedUse(e.target.value)}
                required
              />
            </label>
            <label>
              <span>授权到期日（可选）</span>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </label>
            <footer>
              <Button type="submit" loading={busy === 'install'}>
                安装绑定
              </Button>
            </footer>
          </form>
        </Panel>
      </section>
    </>
  );
}
