import { useToastStore } from '../../hooks/useToast';

export default function ToastContainer() {
  const toasts = useToastStore();
  return <div className="toastStack">{toasts.map(t => <div className={`appToast ${t.type === 'error' ? 'appToastError' : ''}`} key={t.id}>{t.message}</div>)}</div>;
}
