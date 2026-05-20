import type { ReactNode } from 'react';
import Button from './Button';

interface Props { onGo: () => void; onClear: () => void; children: ReactNode; }
export default function FilterBar({ onGo, onClear, children }: Props) {
  return <div className="filterBar"><div className="filterFields">{children}</div><Button size="sm" onClick={onGo}>Go -&gt;</Button><Button size="sm" variant="ghost" onClick={onClear}>x Clear</Button></div>;
}
