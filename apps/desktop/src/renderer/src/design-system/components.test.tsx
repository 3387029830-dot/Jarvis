// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { useState } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';
import { IconButton } from './IconButton';
import { ScrollArea } from './ScrollArea';
import { Tooltip } from './Tooltip';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(): void {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
});

function DialogHarness(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open specimen</Button>
      <Dialog
        description="Keyboard behavior specimen"
        onOpenChange={setOpen}
        open={open}
        title="Focus management"
      >
        <Button variant="quiet">First action</Button>
        <Button data-dialog-initial-focus>Confirm action</Button>
      </Dialog>
    </>
  );
}

describe('design-system component states', () => {
  it('marks loading and error button states without accepting interaction', () => {
    render(
      <Button error loading>
        Saving
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Saving' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-invalid')).toBe('true');
    expect(button.classList.contains('is-error')).toBe(true);
    expect(button.classList.contains('is-loading')).toBe(true);
  });

  it('requires an accessible IconButton name and associates Tooltip content', () => {
    render(
      <Tooltip content="Supplementary explanation">
        <IconButton aria-label="More information">i</IconButton>
      </Tooltip>,
    );

    const button = screen.getByRole('button', { name: 'More information' });
    const tooltip = screen.getByRole('tooltip');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('makes ScrollArea keyboard reachable and names the region', () => {
    render(<ScrollArea aria-label="Long mixed-language content">Overflow</ScrollArea>);

    expect(
      screen.getByRole('region', { name: 'Long mixed-language content' }).getAttribute('tabindex'),
    ).toBe('0');
  });

  it('opens Dialog on the requested focus target, traps Tab, closes on Escape, and returns focus', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open specimen' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Focus management' });
    const closeButton = screen.getByRole('button', { name: '关闭对话框' });
    const firstAction = screen.getByRole('button', { name: 'First action' });
    const confirmAction = screen.getByRole('button', { name: 'Confirm action' });

    expect(document.activeElement).toBe(confirmAction);

    fireEvent.keyDown(confirmAction, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmAction);

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.contains(firstAction)).toBe(true);
  });
});
