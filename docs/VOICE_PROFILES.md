# Jarvis Voice Profile 契约

最后更新：2026-08-01

## 目的

Jarvis 的长期目标包括具有影视级完成度的声线体验，但声线表现、Conversation 核心、认知记忆和 Provider 必须解耦。JAR-005 只确定数据契约和授权边界，不安装真实声线，也不接入 TTS Provider。

未经授权的具体人物或演员声音不得作为仓库内置资产。未来第三方 Provider 如提供正式授权的角色声线，应能通过 Provider binding 安装，不需要修改 Conversation 核心。

## 支持的声线类别

### 1. Original Profile

Jarvis 团队原创设计的声线人格。

### 2. Licensed Character Profile

获得角色或声音权利方正式授权的声线。

### 3. Consented Clone Profile

声音本人明确授权创建和使用的声音克隆。

产品目标包括影视级角色声线体验，但角色声线必须拥有明确的授权来源。

## Vendor-neutral 数据契约

```ts
type VoiceProfileCategory = 'original' | 'licensed-character' | 'consented-clone';

interface VoiceProfile {
  id: string;
  displayName: string;
  description: string;
  locale: string;
  category: VoiceProfileCategory;
  archetype: {
    warmth: number;
    composure: number;
    directness: number;
  };
  prosody: {
    rate: number;
    pitch: number;
    energy: number;
    pauseStyle: 'compact' | 'reflective' | 'cinematic';
  };
  previewText: string;
  authorization: {
    basis: 'original-work' | 'license' | 'explicit-consent';
    rightsHolder: string;
    referenceId: string;
    permittedUse: string;
    expiresAt?: string;
  };
  providerBindings: VoiceProviderBinding[];
}

interface VoiceProviderBinding {
  provider: string;
  providerVoiceId: string;
  model?: string;
  region?: string;
  metadata?: Readonly<Record<string, string>>;
}
```

具体实现可以调整字段命名，但必须保持以下不变量：

- 产品层 profile id 不等于 Provider voice id。
- 情绪、节奏和停顿等 prosody 不写进 Provider 专属字段。
- 授权依据属于 profile 的必要元数据，不能只存在于发布说明或人工记忆中。
- Provider binding 可增加或替换，Conversation 只依赖选中的 profile id。
- 切换 Voice Profile 不改变 Jarvis 的人格、对话记忆、认知数据或系统指令。
- 不允许 renderer 保存 Provider 凭据；真实绑定与调用属于 main-process service。

## 安装与校验边界

- 内置 Original Profile 必须有原创作品记录。
- Licensed Character Profile 必须记录权利方、许可引用、用途和有效期（如有）。
- Consented Clone Profile 必须记录声音本人明确同意的引用与使用范围。
- 缺失授权元数据、授权过期或用途不匹配时，profile 不得安装或设为当前声线。
- Provider 返回的营销名称不能代替授权证明。
- Profile 包不得携带 API Key、私有录音、未经许可的训练样本或真实用户对话。

## JAR-006C 实现状态

- 运行时实现使用 `VoiceProfile`、`VoiceAuthorization` 与产品独立 `providerVoiceId`。
- 内置“静默管家、温和导师、理性同伴、夜间低语”仅是 Original Profile 表达模板，
  默认均未绑定、不可试听，不携带真实 voice ID 或音频。
- 手动安装必须填写类别、权利人、授权引用、允许用途和可选到期日；缺失、日期非法或过期
  即不可用。`original` 只能使用 `original-work`，`licensed-character` 只能使用 `license`，
  `consented-clone` 只能使用 `explicit-consent`。
- `理性同伴`只是默认视觉模板，不等于已选择或已授权的 Provider 声线。
- 试听与正式朗读调用同一个 main-process TTS API，试听不会改变当前选择。
- 当前只实现 MiniMax Provider binding；Provider `/get_voice` 发现仍是可选后续能力，
  手动绑定始终保留。
- Renderer 只能看到不含 `providerVoiceId` 的公共 profile 摘要；连接测试和正式朗读在 main
  中重新解析并校验可用 profile，避免过期或篡改配置绕过授权边界。
- 项目所有者真实 MiniMax 验收尚未完成，不能把内置模板描述成可用真实声线。

## JAR-005 历史状态

Conversation 仅展示“默认演示声线”的未来绑定摘要。它使用 JAR-004 的本地 `speechSynthesis` / 确定性短音回退，不是 Voice Profile 安装，也不代表任何角色授权。

## JAR-006 最小验收

- 在代码中实现上述 vendor-neutral 契约和校验。
- 支持 profile 列表、预览、选择与安全回退。
- 接入至少一条真实中文 TTS Provider binding。
- Provider 失败时保留完整文字回答。
- Mock profile 与 Mock adapter 继续供测试和演示使用。
- 验证切换声线不会修改 Conversation 核心、记忆或认知事件。
