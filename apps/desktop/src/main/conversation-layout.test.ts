import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const styles = readFileSync(
  new URL('../renderer/src/conversation/conversation.css', import.meta.url),
  'utf8',
);

describe('Conversation composer CSS contract', () => {
  it('assigns every stable composer region to a named grid area', () => {
    expect(styles).toMatch(
      /\.conversation-composer\s*\{[^}]*grid-template-areas:\s*'identity text voice'/s,
    );
    expect(styles).toMatch(/\.conversation-composer__identity\s*\{[^}]*grid-area:\s*identity/s);
    expect(styles).toMatch(/\.conversation-composer__text\s*\{[^}]*grid-area:\s*text/s);
    expect(styles).toMatch(/\.conversation-composer__voice\s*\{[^}]*grid-area:\s*voice/s);
  });

  it('reflows named areas without auto-placement at supported narrow widths', () => {
    expect(styles).toContain("'identity identity'\n      'text voice'");
    expect(styles).toContain("'identity'\n      'text'\n      'voice'");
    expect(styles).toMatch(
      /@media \(max-width: 860px\)[\s\S]*?\.conversation-composer\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
    );
  });

  it('reserves scrollbar width and removes smooth scrolling in reduced motion', () => {
    expect(styles).toMatch(/\.conversation-reading\s*\{[^}]*scrollbar-gutter:\s*stable/s);
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.conversation-reading\s*\{[^}]*scroll-behavior:\s*auto/s,
    );
    expect(styles).toMatch(
      /\[data-motion='reduced'\] \.conversation-reading\s*\{[^}]*scroll-behavior:\s*auto/s,
    );
  });
});
