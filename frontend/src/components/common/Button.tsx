import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md'; loading?: boolean; children: ReactNode; }
export default function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: Props) {
  return <button className={`btn ${variant} ${size} ${className}`} disabled={disabled || loading} {...props}>{loading && <span className="spinner" />}{children}</button>;
}
