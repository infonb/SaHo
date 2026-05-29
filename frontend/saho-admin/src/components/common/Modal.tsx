import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, footer, width = 520 }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [open, title]);

  if (!open) return null;

  const node = (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <h2>{title}</h2>
          <button className="modalCloseBtn" onClick={onClose} aria-label="Close dialog" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div ref={bodyRef} className="modalBody">
          {children}
        </div>
        {footer && <div className="modalFooter">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
