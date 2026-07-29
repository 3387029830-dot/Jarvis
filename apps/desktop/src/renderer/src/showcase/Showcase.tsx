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
      <nav aria-label="Showcase sections" className="showcase__rail">
        <a aria-label="Foundations" href="#foundations">
          01
        </a>
        <a aria-label="Typography" href="#typography">
          02
        </a>
        <a aria-label="Components" href="#components">
          03
        </a>
        <a aria-label="States" href="#states">
          04
        </a>
        <a aria-label="Behavior" href="#behavior">
          05
        </a>
      </nav>

      <header className="showcase__hero">
        <div className="showcase__hero-copy">
          <p className="showcase__kicker">JAR—002 / Development specimen</p>
          <h1>Quiet structure for living thought.</h1>
          <p className="showcase__lede">
            Jarvis 设计系统基础：以克制的明度、可读的中文排版和明确但安静的状态反馈，
            建立一个持续、私密的认知观测空间。
          </p>
        </div>
        <div className="showcase__edition" aria-label="Specimen metadata">
          <span>Foundation</span>
          <strong>02</strong>
          <small>React · CSS variables</small>
        </div>
      </header>

      <div className="showcase__content">
        <section className="specimen-section" id="foundations">
          <header className="specimen-heading">
            <span>01</span>
            <div>
              <p>Foundations</p>
              <h2>Light establishes distance.</h2>
            </div>
          </header>

          <div className="surface-grid" aria-label="Background surface tokens">
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
                <h3>Semantic color</h3>
                <span>Restrained signals</span>
              </div>
              <div className="color-list">
                <div>
                  <i className="color-dot color-dot--accent" />
                  <span>Accent</span>
                  <code>#8FB7FF</code>
                </div>
                <div>
                  <i className="color-dot color-dot--success" />
                  <span>Success</span>
                  <code>#92DFBD</code>
                </div>
                <div>
                  <i className="color-dot color-dot--warning" />
                  <span>Warning</span>
                  <code>#E8C47C</code>
                </div>
                <div>
                  <i className="color-dot color-dot--danger" />
                  <span>Danger</span>
                  <code>#FF8F9A</code>
                </div>
              </div>
            </Panel>

            <Panel className="token-panel">
              <div className="token-panel__heading">
                <h3>Spacing</h3>
                <span>4px base rhythm</span>
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
                <h3>Geometry</h3>
                <span>Soft, not playful</span>
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
                <h3>Depth</h3>
                <span>Boundary before glow</span>
              </div>
              <div className="depth-list">
                <div className="depth-list__hairline">1px · Hairline</div>
                <div className="depth-list__raised">Raised shadow</div>
                <div className="depth-list__glow">Restrained glow</div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="specimen-section" id="typography">
          <header className="specimen-heading">
            <span>02</span>
            <div>
              <p>Typography</p>
              <h2>Reading is the primary interface.</h2>
            </div>
          </header>

          <div className="type-grid">
            <div className="type-scale" aria-label="Typography scale">
              <p className="type-display">观察</p>
              <p className="type-title">思想如何随时间改变</p>
              <p className="type-heading">A continuous field of inquiry</p>
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
              <p>Primitives</p>
              <h2>Reusable, semantic, quiet.</h2>
            </div>
          </header>

          <div className="component-grid">
            <Panel className="component-specimen component-specimen--wide">
              <div className="specimen-label">
                <h3>Button</h3>
                <code>4 variants · 3 sizes</code>
              </div>
              <div className="button-row">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="quiet">Quiet action</Button>
                <Button variant="danger">Destructive</Button>
              </div>
              <div className="button-row button-row--sizes">
                <Button size="small" variant="secondary">
                  Small
                </Button>
                <Button size="medium" variant="secondary">
                  Medium
                </Button>
                <Button size="large" variant="secondary">
                  Large
                </Button>
              </div>
            </Panel>

            <Panel className="component-specimen">
              <div className="specimen-label">
                <h3>IconButton + Tooltip</h3>
                <code>Accessible names</code>
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
                <code>Semantic, not decorative</code>
              </div>
              <div className="badge-row">
                <Badge>Neutral</Badge>
                <Badge tone="accent">Accent</Badge>
                <Badge tone="success">Success</Badge>
                <Badge tone="warning">Warning</Badge>
                <Badge tone="danger">Error</Badge>
              </div>
            </Panel>

            <Panel className="component-specimen component-specimen--wide">
              <div className="specimen-label">
                <h3>Panel + Card</h3>
                <code>Editorial containers</code>
              </div>
              <div className="card-row">
                <Card tone="root">
                  <Badge>Root card</Badge>
                  <h4>清晰的边界，不是小组件</h4>
                  <p>容器承载一段完整思想，以内容层级而不是指标数字建立重点。</p>
                </Card>
                <Card>
                  <Badge tone="accent">Soft card</Badge>
                  <h4>Meaning before ornament</h4>
                  <p>
                    Subtle luminance separates context while the text remains the visual center.
                  </p>
                </Card>
              </div>
            </Panel>
          </div>
        </section>

        <section className="specimen-section" id="states">
          <header className="specimen-heading">
            <span>04</span>
            <div>
              <p>Interaction states</p>
              <h2>Every change should have a reason.</h2>
            </div>
          </header>

          <Panel className="state-panel">
            <div className="state-table" role="list" aria-label="Button interaction states">
              <div role="listitem">
                <span>Default</span>
                <Button variant="secondary">Observe</Button>
              </div>
              <div role="listitem">
                <span>Hover</span>
                <Button data-visual-state="hover" variant="secondary">
                  Observe
                </Button>
              </div>
              <div role="listitem">
                <span>Active</span>
                <Button data-visual-state="active" variant="secondary">
                  Observe
                </Button>
              </div>
              <div role="listitem">
                <span>Keyboard focus</span>
                <Button data-visual-state="focus" ref={focusRef} variant="secondary">
                  Observe
                </Button>
              </div>
              <div role="listitem">
                <span>Disabled</span>
                <Button disabled variant="secondary">
                  Observe
                </Button>
              </div>
              <div role="listitem">
                <span>Loading</span>
                <Button loading variant="secondary">
                  Observing
                </Button>
              </div>
              <div role="listitem">
                <span>Error</span>
                <Button error variant="secondary">
                  Try again
                </Button>
              </div>
            </div>
            <div className="semantic-states">
              <Card className="semantic-state semantic-state--success" tone="root">
                <Badge tone="success">Success</Badge>
                <strong>Change preserved</strong>
                <p>状态已经明确完成，并保留了下一步上下文。</p>
              </Card>
              <Card className="semantic-state semantic-state--warning" tone="root">
                <Badge tone="warning">Warning</Badge>
                <strong>Review needed</strong>
                <p>需要注意，但不使用强烈视觉制造不必要的焦虑。</p>
              </Card>
              <Card className="semantic-state semantic-state--danger" tone="root">
                <Badge tone="danger">Error</Badge>
                <strong>Could not continue</strong>
                <p>错误说明具体、可恢复，不把用户留在不确定状态。</p>
              </Card>
            </div>
            <div className="icon-state-strip">
              <div className="specimen-label">
                <h3>IconButton states</h3>
                <code>Same interaction contract</code>
              </div>
              <div className="icon-state-list">
                <div>
                  <IconButton aria-label="Default icon state">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Default</span>
                </div>
                <div>
                  <IconButton aria-label="Hover icon state" data-visual-state="hover">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Hover</span>
                </div>
                <div>
                  <IconButton aria-label="Active icon state" data-visual-state="active">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Active</span>
                </div>
                <div>
                  <IconButton aria-label="Focus icon state" data-visual-state="focus">
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Focus</span>
                </div>
                <div>
                  <IconButton aria-label="Disabled icon state" disabled>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Disabled</span>
                </div>
                <div>
                  <IconButton aria-label="Loading icon state" loading>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Loading</span>
                </div>
                <div>
                  <IconButton aria-label="Error icon state" error>
                    <SpecimenIcon name="spark" />
                  </IconButton>
                  <span>Error</span>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="specimen-section" id="behavior">
          <header className="specimen-heading">
            <span>05</span>
            <div>
              <p>Behavior</p>
              <h2>Focus, overflow, and motion.</h2>
            </div>
          </header>

          <div className="behavior-grid">
            <Panel className="dialog-specimen">
              <div className="specimen-label">
                <h3>Dialog</h3>
                <code>Focus trap · Escape · return</code>
              </div>
              <p>原生模态语义管理键盘焦点。Escape 关闭后，焦点返回触发按钮。</p>
              <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
            </Panel>

            <Panel className="motion-specimen">
              <div className="specimen-label">
                <h3>Motion preference</h3>
                <code>State remains visible</code>
              </div>
              <div className="motion-line">
                <span className="motion-line__signal" aria-hidden="true" />
                <div>
                  <strong>{reducedMotion ? 'Reduced motion' : 'Normal motion'}</strong>
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
                {reducedMotion ? 'Use normal motion' : 'Simulate reduced motion'}
              </Button>
            </Panel>

            <Panel className="overflow-specimen">
              <div className="specimen-label">
                <h3>ScrollArea</h3>
                <code>Keyboard reachable</code>
              </div>
              <ScrollArea aria-label="中英文长文本滚动示例">
                <h4>长文本与内容溢出</h4>
                <p>
                  一个安静的界面仍然必须容纳复杂内容。滚动区域可以通过 Tab
                  键到达，并以清晰的焦点轮廓说明当前位置。
                </p>
                <p>
                  Thought does not arrive in uniform fragments. A useful reading surface preserves
                  paragraphs, punctuation, and breathing room instead of compressing everything into
                  dense widgets.
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
        <span>Jarvis design-system foundation</span>
        <a href="#top" onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}>
          Return to beginning
        </a>
      </footer>

      <Dialog
        description="这是用于验证语义、焦点管理和层级关系的开发示例，不属于正式 Presence 页面。"
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="A focused layer"
      >
        <div className="dialog-example">
          <Card tone="elevated">
            <Badge tone="warning">Review</Badge>
            <p>重要决定应在有限、可理解的上下文中出现。背景退后，内容保持清晰。</p>
          </Card>
          <div className="dialog-example__actions">
            <Button onClick={() => setDialogOpen(false)} variant="quiet">
              Cancel
            </Button>
            <Button data-dialog-initial-focus onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
