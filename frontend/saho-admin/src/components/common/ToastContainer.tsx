import { useToastStore } from '../../hooks/useToast';

export default function ToastContainer() {
  const toasts = useToastStore();
  return <div className="toastStack">{toasts.map(t => <div className={`toast ${t.type === 'error' ? 'error' : ''}`} key={t.id}>{t.message}</div>)}</div>;
}
