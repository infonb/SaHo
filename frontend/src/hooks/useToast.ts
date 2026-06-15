import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'error';
export interface Toast { id: number; message: string; type: ToastType; }
const TOAST_EVENT = 'saho:toast';

export const useToast = () => {
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const nextToast = { id: Date.now() + Math.random(), message, type };
    window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: nextToast }));
  }, []);

  return { toast };
};

export const useToastStore = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const showToast = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 3200);
    };

    const handleToast = (event: Event) => {
      showToast((event as CustomEvent<Toast>).detail);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);
  return toasts;
};
