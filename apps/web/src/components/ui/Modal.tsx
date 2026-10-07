import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Accessible dialog on the native <dialog> element (focus trap + Esc handled by the browser). */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-dialog rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-panel/50"
    >
      {open && (
        <div className="flex max-h-dvh flex-col animate-rise-in">
          <div className="flex items-center justify-between gap-16 border-b border-line px-24 py-16">
            <h2 id={titleId} className="text-subheading text-ink-brand">
              {title}
            </h2>
            <Button variant="quiet" size="icon" onClick={onClose} aria-label="Close dialog">
              <X className="size-20" aria-hidden="true" />
            </Button>
          </div>
          <div className="overflow-y-auto px-24 py-20">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-8 border-t border-line bg-canvas px-24 py-16">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body text-ink-muted">{message}</p>
    </Modal>
  );
}
