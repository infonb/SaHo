import type { ReactNode } from 'react';

interface Props { title: string; subtitle?: string; actions?: ReactNode; }
export default function PageHeader({ title, subtitle, actions }: Props) {
  return <div className="pageHeader"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="actions">{actions}</div>}</div>;
}
