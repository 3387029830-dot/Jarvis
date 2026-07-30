import { useEffect, useRef, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  Dialog,
  IconButton,
  Panel,
  ScrollArea,
  Tooltip,
} from '../design-system';

function parseShowcaseOptions(): {
  dialogOpen: boolean;
  focusTarget: boolean;
  reducedMotion: boolean;
} {
  const hashQuery = window.location.hash.split('?')[1] ?? '';
  const parameters = new URLSearchParams(hashQuery);

  return {
    dialogOpen: parameters.get('dialog') === 'open',
    focusTarget: parameters.get('focus') === 'button',
    reducedMotion: parameters.get('motion') === 'reduced',
  };
}

function SpecimenIcon({ name }: { name: 'more' | 'spark' | 'plus' }): React.JSX.Element {
  if (name === 'plus') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === 'more') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 3 1.5 5.1L19 10l-5.5 1.9L12 17l-1.5-5.1L5 10l5.5-1.9L12 3Z" />
      <path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
    </svg>
  );
}

const spacingTokens = [
  ['01', '4'],
  ['02', '8'],
  ['03', '12'],
  ['04', '16'],
  ['06', '24'],
  ['08', '32'],
  ['12', '48'],
] as const;

const radiusTokens = [
  ['XS', '4'],
  ['SM', '8'],
  ['MD', '14'],
  ['LG', '18'],
] as const;

export function Showcase(): React.JSX.Element {
  const [options] = useState(parseShowcaseOptions);
  const [dialogOpen, setDialogOpen] = useState(options.dialogOpen);
  const [reducedMotion, setReducedMotion] = useState(options.reducedMotion);
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'standard';
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      if (options.focusTarget) {
        document.getElementById('states')?.scrollIntoView({
          behavior: 'instant' as ScrollBehavior,
          block: 'start',
        });
        focusRef.current?.focus({ preventScroll: true });
      } else if (options.reducedMotion) {
        document.getElementById('behavior')?.scrollIntoView({ block: 'start' });
      }
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [options.focusTarget, options.reducedMotion]);

  return (
    <main className="showcase">
      <nav aria-label="设计系统展示章节" className="showcase__rail">
        <a aria-label="基础规范" href="#foundations">
          01
        </a>
        <a aria-label="字体排版" href="#typography">
          02
        </a>
        <a aria-label="基础组件" href="#components">
          03
        </a>
        <a aria-label="交互状态" href="#states">
          04
        </a>
        <a aria-label="行为规范" href="#behavior">
          05
        </a>
      </nav>

      <header className="showcase__hero">
        <div className="showcase__hero-copy">
          <p className="showcase__kicker">JAR—002 / 开发验证页</p>
          <h1>让思想在安静的结构中生长。</h1>
          <p className="showcase__lede">
            Jarvis 设计系统基础：以克制的明度、可读的中文排版和明确但安静的状态反馈，
            建立一个持续、私密的认知观测空间。
          </p>
        </div>
        <div className="showcase__edition" aria-label="展示页元数据">
          <span>设计基础</span>
          <strong>02</strong>
          <small>React · CSS variables</small>
        </div>
      </header>

      <div className="showcase__content">
        <section className="specimen-section" id="foundations">
          <header className="specimen-heading">
            <span>01</span>
            <div>
              <p>基础规范</p>
              <h2>以明度建立距离。</h2>
            </div>
          </header>

          <div className="surface-grid" aria-label="背景层级 token">
            <article className="surface-swatch surface-swatch--root">
              <span>Root</span>
              <code>#07090D</code>
            </article>
            <article className="surface-swatch surface-swatch--elevated">
              <span>Elevated</span>
              <code>#0C1017</code>
            </article>
            <article className="surface-swatch surface-swatch--soft">
              <span>Soft</span>
              <code>#111722</code>
            </article>
            <article className="surface-swatch surface-swatch--overlay">
              <span>Overlay</span>
              <code>82%</code>
            </article>
          </div>

          <div className="foundation-grid">
            <Panel className="token-panel">
              <div className="token-panel__heading">
                <h3>语义颜色</h3>
                <span>克制而明确的信号</span>
              </div>
              <div className="color-list">
                <div>
                  <i className="color-dot color-dot--accent" />
                  <span>主要强调</span>
                  <code>#8FB7FF</code>
                </div>
                <div>
                  <i className="color-dot color-dot--success" />
                  <span>成功</span>
                  <code>#92DFBD</code>
                </div>
                <div>
                  <i className="color-dot color-dot--warning" />
                  <span>警告</span>
                  <code>#E8C47C</code>
                </div>
                <div>
                  <i className="color-dot color-dot--danger" />
                  <span>错误</span>
                  <code>#FF8F9A</code>
                </div>
              </div>
            </Panel>

            <Panel className="token-panel">
              <div className="token-panel__heading">
                <h3>间距</h3>
                <span>以 4px 为基础节奏</span>
              </div>
              <div className="spacing-list">
                {spacingTokens.map(([name, pixels]) => (
                  <div key={name}>
                    <code>{name}</code>
                    <i style={{ width: `calc(${pixels}px * 1.7)` }} />
                    <span>{pixels}px</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="token-panel">
              <div className="token-panel__heading">
                <h3>几何</h3>
                <span>柔和，但不过度活泼</span>
              </div>
              <div className="radius-list">
                {radiusTokens.map(([name, pixels]) => (
                  <div key={name}>
                    <i style={{ borderRadius: `${pixels}px` }} />
                    <code>{name}</code>
                    <span>{pixels}px</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="token-panel">
              <div className="token-panel__heading">
                <h3>深度</h3>
                <span>先建立边界，再使用光感</span>
              </div>
              <div className="depth-list">
                <div className="depth-list__hairline">1px · 细边界</div>
                <div className="depth-list__raised">抬升阴影</div>
                <div className="depth-list__glow">克制光感</div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="specimen-section" id="typography">
          <header className="specimen-heading">
            <span>02</span>
            <div>
              <p>字体排版</p>
              <h2>阅读本身就是主要界面。</h2>
            </div>
          </header>

          <div className="type-grid">
            <div className="type-scale" aria-label="字体层级">
              <p className="type-display">观察</p>
              <p className="type-title">思想如何随时间改变</p>
              <p className="type-heading">持续展开的探索现场</p>
              <p className="type-body">正文 Body · 16 / 1.55</p>
              <p className="type-meta">METADATA · 11 / 0.16EM</p>
            </div>
            <article className="reading-sample">
              <Badge tone="accent">中文与 mixed type</Badge>
              <h3>一个问题不必立刻成为答案。</h3>
              <p>
                好奇心常常从模糊之处开始。A quiet interface should make room for uncertainty，
                让中文标点、English terms 与数字 2026 在同一行里仍然保持自然节奏。
              </p>
              <p>
                这里使用系统中文字体栈和 1.85 倍行高。长文本限制在舒适的阅读宽度内，
                不用狭窄栏位制造紧张，也不让一行文字横跨整个屏幕。
              </p>
            </article>
          </div>
        </section>

        <section className="specimen-section" id="components">
          <header className="specimen-heading">
            <span>03</span>
            <div>
              <p>基础组件</p>
              <h2>可复用、有语义、保持安静。</h2>
            </div>
          </header>

          <div className="component-grid">
            <Panel className="component-specimen component-specimen--wide">
              <div className="specimen-label">
                <h3>Button</h3>
                <code>4 种样式 · 3 种尺寸</code>
              </div>
              <div className="button-row">
                <Button>主要操作</Button>
                <Button variant="secondary">次要操作</Button>
                <Button variant="quiet">安静操作</Button>
                <Button variant="danger">危险操作</Button>
              </div>
              <div className="button-row button-row--sizes">
                <Button size="small" variant="secondary">
                  小
                </Button>
                <Button size="medium" variant="secondary">
                  中
                </Button>
                <Button size="large" variant="secondary">
                  大
                </Button>
              </div>
            </Panel>

            <Panel className="component-specimen">
              <div className="specimen-label">
                <h3>IconButton + Tooltip</h3>
                <code>具备可访问名称</code>
              </div>
              <div className="icon-row">
                <Tooltip content="附加操作，不承载唯一的重要信息">
                  <IconButton aria-label="查看附加操作">
                    <SpecimenIcon name="more" />
                  </IconButton>
                </Tooltip>
                <IconButton aria-label="创建条目" variant="primary">
                  <SpecimenIcon name="plus" />
                </IconButton>
                <IconButton aria-label="智能提示" variant="quiet">
                  <SpecimenIcon name="spark" />
                </IconButton>
              </div>
            </Panel>

            <Panel className="component-specimen">
              <div className="specimen-label">
                <h3>Badge</h3>
                <code>表达语义，不只用于装饰</code>
              </div>
              <div className="badge-row">
                <Badge>中性</Badge>
                <Badge tone="accent">强调</Badge>
                <Badge tone="success">成功</Badge>
                <Badge tone="warning">警告</Badge>
                <Badge tone="danger">错误</Badge>
              </div>
            </Panel>

            <Panel className="component-specimen component-specimen--wide">
              <div className="specimen-label">
                <h3>Panel + Card</h3>
                <code>编辑性内容容器</code>
              </div>
              <div className="card-row">
                <Card tone="root">
                  <Badge>根层卡片</Badge>
                  <h4>清晰的边界，不是小组件</h4>
                  <p>容器承载一段完整思想，以内容层级而不是指标数字建立重点。</p>
                </Card>
                <Card>
                  <Badge tone="accent">柔和卡片</Badge>
                  <h4>意义先于装饰</h4>
                  <p>细微明度区分上下文，文字始终保留为视觉中心。</p>
                </Card>
              </div>
            </Panel>
          </div>
        </section>

        <section className="specimen-section" id="states">
          <header className="specimen-heading">
            <span>04</span>
            <div>
              <p>交互状态</p>
              <h2>每一次变化都应当有原因。</h2>
            </div>
          </header>

          <Panel className="state-panel">
            <div className="state-table" role="list" aria-label="按钮交互状态">
              <div role="listitem">
                <span>默认</span>
                <Button variant="secondary">观察</Button>
              </div>
              <div role="listitem">
                <span>悬停</span>
                <Button data-visual-state="hover" variant="secondary">
                  观察
                </Button>
              </div>
              <div role="listitem">
                <span>按下</span>
                <Button data-visual-state="active" variant="secondary">
                  观察
                </Button>
              </div>
              <div role="listitem">
                <span>键盘焦点</span>
                <Button data-visual-state="focus" ref={focusRef} variant="secondary">
                  观察
                </Button>
              </div>
              <div role="listitem">
                <span>禁用</span>
                <Button disabled variant="secondary">
                  观察
                </Button>
              </div>
              <div role="listitem">
                <span>加载中</span>
                <Button loading variant="secondary">
                  正在观察
                </Button>
              </div>
              <div role="listitem">
                <span>错误</span>
                <Button error variant="secondary">
                  重试
                </Button>
              </div>
            </div>
            <div className="semantic-states">
              <Card className="semantic-state semantic-state--success" tone="root">
                <Badge tone="success">成功</Badge>
                <strong>变更已保留</strong>
                <p>状态已经明确完成，并保留了下一步上下文。</p>
              </Card>
              <Card className="semantic-state semantic-state--warning" tone="root">
                <Badge tone="warning">警告</Badge>
                <strong>需要复核</strong>
                <p>需要注意，但不使用强烈视觉制造不必要的焦虑。</p>
              </Card>
              <Card className="semantic-state semantic-state--danger" tone="root">
                <Badge tone="danger">错误</Badge>
                <strong>无法继续</strong>
                <p>错误说明具体、可恢复，不把用户留在不确定状态。</p>
              </Card>
            </div>
            <div className="icon-state-strip">
              <div className="specimen-label">
                <h3>IconButton 状态</h3>
                <code>遵循同一交互约定</code>
              </div>
              <div className="icon-state-list">
                <div>
                  <IconButton aria-label="默认图标状态">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>默认</span>
                </div>
                <div>
                  <IconButton aria-label="悬停图标状态" data-visual-state="hover">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>悬停</span>
                </div>
                <div>
                  <IconButton aria-label="按下图标状态" data-visual-state="active">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>按下</span>
                </div>
                <div>
                  <IconButton aria-label="焦点图标状态" data-visual-state="focus">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>焦点</span>
                </div>
                <div>
                  <IconButton aria-label="禁用图标状态" disabled>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>禁用</span>
                </div>
                <div>
                  <IconButton aria-label="加载中图标状态" loading>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>加载中</span>
                </div>
                <div>
                  <IconButton aria-label="错误图标状态" error>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>错误</span>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="specimen-section" id="behavior">
          <header className="specimen-heading">
            <span>05</span>
            <div>
              <p>行为规范</p>
              <h2>焦点、溢出与动效。</h2>
            </div>
          </header>

          <div className="behavior-grid">
            <Panel className="dialog-specimen">
              <div className="specimen-label">
                <h3>Dialog</h3>
                <code>焦点约束 · Escape · 焦点返回</code>
              </div>
              <p>原生模态语义管理键盘焦点。Escape 关闭后，焦点返回触发按钮。</p>
              <Button onClick={() => setDialogOpen(true)}>打开对话框</Button>
            </Panel>

            <Panel className="motion-specimen">
              <div className="specimen-label">
                <h3>动效偏好</h3>
                <code>状态始终保持可见</code>
              </div>
              <div className="motion-line">
                <span className="motion-line__signal" aria-hidden="true" />
                <div>
                  <strong>{reducedMotion ? '减少动态效果' : '正常动态效果'}</strong>
                  <p>
                    {reducedMotion
                      ? '位移、缩放和连续动画已移除；颜色、边界与静态标记仍反馈状态。'
                      : '短暂位移只用于确认按压，过渡用于解释状态变化。'}
                  </p>
                </div>
              </div>
              <Button
                aria-pressed={reducedMotion}
                onClick={() => setReducedMotion((current) => !current)}
                variant="secondary"
              >
                {reducedMotion ? '恢复正常动效' : '模拟减少动态效果'}
              </Button>
            </Panel>

            <Panel className="overflow-specimen">
              <div className="specimen-label">
                <h3>ScrollArea</h3>
                <code>键盘可到达</code>
              </div>
              <ScrollArea aria-label="中英文长文本滚动示例">
                <h4>长文本与内容溢出</h4>
                <p>
                  一个安静的界面仍然必须容纳复杂内容。滚动区域可以通过 Tab
                  键到达，并以清晰的焦点轮廓说明当前位置。
                </p>
                <p>
                  思想并不会以整齐一致的碎片抵达。合适的阅读界面会保留段落、标点与呼吸感，
                  而不是把一切压缩成密集的小组件。
                </p>
                <p>
                  当中文、English terminology、数字与引用混合出现时，行距和段落间距需要保持稳定。
                  这里的滚动条保持纤细，却不会隐藏内容仍可继续阅读这一事实。
                </p>
                <p>
                  最后的段落用于验证真实溢出。所有信息都有明确层级，但没有任何悬浮提示承担唯一的重要说明。
                </p>
              </ScrollArea>
            </Panel>
          </div>
        </section>
      </div>

      <footer className="showcase__footer">
        <span>Jarvis 设计系统基础</span>
        <a href="#top" onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}>
          返回开头
        </a>
      </footer>

      <Dialog
        description="这是用于验证语义、焦点管理和层级关系的开发示例，不属于正式 Presence 页面。"
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="一个聚焦的层级"
      >
        <div className="dialog-example">
          <Card tone="elevated">
            <Badge tone="warning">复核</Badge>
            <p>重要决定应在有限、可理解的上下文中出现。背景退后，内容保持清晰。</p>
          </Card>
          <div className="dialog-example__actions">
            <Button onClick={() => setDialogOpen(false)} variant="quiet">
              取消
            </Button>
            <Button data-dialog-initial-focus onClick={() => setDialogOpen(false)}>
              确认
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
