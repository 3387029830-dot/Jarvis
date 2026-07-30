# JAR-005 视觉验收证据

这些 PNG 由生产构建的 Electron 窗口生成。每次捕获都先通过真实 preload `healthCheck()`，窗口启用 `contextIsolation`，renderer 仍无 Node 能力。

## 截图清单

| 文件                                         | 验证内容                                                       | 复现入口                                                          |
| -------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `conversation-money-consensus-1440x900.png`  | 货币、共识与制度场景；编辑性时间线和跨领域上下文               | `#/conversation?exploration=money-consensus-institution`          |
| `conversation-knowledge-action-1440x900.png` | 知识与行动落差场景；中文长文本和不同讨论内容                   | `#/conversation?exploration=knowledge-action-gap`                 |
| `conversation-uncertainty-1024x900.png`      | 1024 px 最小宽度；上下文、时间线和输入区无横向溢出             | `#/conversation?exploration=uncertainty-and-crowd`，窗口 1024×900 |
| `conversation-toggle-listening-1440x900.png` | 默认点击模式的 listening、真实波形视觉、再次点击发送和取消提示 | 在默认模式点击“点击说话”；证据使用确定性 `voice=listening` 快照   |
| `conversation-streaming-1440x900.png`        | Mock 回答分段输出、状态反馈和取消入口                          | 发送文字后等待本地 Mock；证据使用 `state=streaming`               |
| `conversation-offline-1440x900.png`          | 离线说明、可读历史和仍可使用的本地输入                         | 证据使用 `state=offline`                                          |
| `conversation-error-1440x900.png`            | 回答失败、错误说明和相同回答重试                               | 证据使用 `state=error`                                            |
| `conversation-keyboard-focus-1440x900.png`   | textarea 的非颜色单一依赖焦点环                                | Tab 到输入框；证据使用 `focus=composer`                           |
| `conversation-reduced-motion-1440x900.png`   | reduced-motion 下保留 streaming 状态但移除连续脉冲动画         | 系统开启减少动态效果；证据使用 `motion=reduced`                   |

## 哪些是真实功能

- Electron 产品窗口、App Shell、hash 路由和 Presence → Conversation 导航。
- 文字输入、中文输入法组合保护、Enter / Shift+Enter、取消和重试交互。
- 默认点击说话、可选按住说话及两个页面间共享的运行时模式。
- 用户实际操作时的麦克风权限、MediaRecorder、录音时长、analyser 波形和资源清理。
- 键盘焦点、reduced-motion、布局响应与 preload health-check。

## 哪些是 Mock

- 三个 exploration 的历史、领域、跨领域联系和 Jarvis 回答。
- STT 转录、理解、模型回答和分段 streaming。
- 截图中的 listening、offline、error 等状态由只读证据参数固定，便于可重复验收。
- “默认演示声线”只是未来 Voice Profile / Provider binding 的说明，不是已安装声线。

## 当前不足

- 不保存 Conversation 或探索，刷新后回到固定场景。
- 没有真实 STT、模型 Provider 或云端 TTS。
- Voice Profile 只有文档契约，没有安装、预览或授权校验实现。
- 生产 Renderer bundle 约 689 kB，后续需要评估路由拆分。
- Windows 是当前视觉基准；其他系统的中文字体换行可能略有不同。

## 生成方式

先执行 `pnpm build`，再以 `JARVIS_SHOWCASE_EVIDENCE=1`、`JARVIS_EVIDENCE_ROUTE=conversation`、对应场景 / 状态和 `JARVIS_SMOKE_SCREENSHOT` 启动生产 Electron。查询参数只服务视觉证据，不是产品设置。
