import type { ReactNode } from 'react';

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: number; }
export default function Modal({ open, onClose, title, children, footer, width = 520 }: Props) {
  if (!open) return null;
  return <div className="modalOverlay" onMouseDown={onClose}><div className="modalCard" style={{ width }} onMouseDown={(e) => e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button className="btn ghost sm" onClick={onClose}>x</button></div><div className="modalBody">{children}</div>{footer && <div className="modalFooter">{footer}</div>}</div></div>;
}
