import type { ReactNode } from 'react';

interface Props { variant: 'active' | 'inactive' | 'assigned' | 'unassigned' | 'admin' | 'volunteer' | 'organisation' | 'individual' | 'male' | 'female' | 'other' | 'success'; children: ReactNode; }
export default function Badge({ variant, children }: Props) { return <span className={`badge ${variant}`}>{children}</span>; }
