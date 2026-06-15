import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md'; loading?: boolean; children: ReactNode; }
export default function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: Props) {
  const sharedClass = variant === 'primary' ? 'maxBtn maxBtnPrimary' : 'btn';
  return <button className={`${sharedClass} ${variant} ${size} ${className}`.trim()} disabled={disabled || loading} {...props}>{loading && <span className="spinner" />}{children}</button>;
}
