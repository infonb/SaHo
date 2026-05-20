import type { ReactNode } from 'react';
import Button from './Button';

interface Props { onGo: () => void; onClear: () => void; children: ReactNode; extraAction?: ReactNode; className?: string; }
export default function FilterBar({ onGo, onClear, children, extraAction, className }: Props) {
  return <div className={`filterBar ${className || ''}`}><div className="filterFields">{children}</div><div className="filterActions"><Button size="sm" onClick={onGo}>Go -&gt;</Button><Button size="sm" variant="ghost" onClick={onClear}>x Clear</Button>{extraAction}</div></div>;
}
