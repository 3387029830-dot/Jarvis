import { useEffect, useId, useRef, type DialogHTMLAttributes, type ReactNode } from 'react';

import { getDialogFocusableElements, trapDialogFocus } from './dialog-focus';
import { IconButton } from './IconButton';

export interface DialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  'open' | 'onClose'
> {
  children: ReactNode;
  description?: string;
  onOpenChange(open: boolean): void;
  open: boolean;
  title: string;
}

export function Dialog({
  children,
  className,
  description,
  onOpenChange,
  open,
  title,
  ...props
}: DialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const initialFocus =
        dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ??
        getDialogFocusableElements(dialog)[0];
      initialFocus?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [open]);

  const requestClose = (): void => {
    onOpenChange(false);
  };

  return (
    <dialog
      {...props}
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={['ds-dialog', className ?? ''].filter(Boolean).join(' ')}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          requestClose();
        }
      }}
      onKeyDown={(event) => {
        trapDialogFocus(event.nativeEvent, event.currentTarget);
      }}
      ref={dialogRef}
    >
      <div className="ds-dialog__surface">
        <header className="ds-dialog__header">
          <div>
            <p className="ds-dialog__eyebrow">Focused layer</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <IconButton aria-label="关闭对话框" onClick={requestClose} variant="quiet">
            <span aria-hidden="true">×</span>
          </IconButton>
        </header>
        {description ? (
          <p className="ds-dialog__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="ds-dialog__content">{children}</div>
      </div>
    </dialog>
  );
}
