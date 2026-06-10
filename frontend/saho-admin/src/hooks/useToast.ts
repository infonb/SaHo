import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'error';
export interface Toast { id: number; message: string; type: ToastType; }
let emit: ((toast: Toast) => void) | null = null;
const pendingToasts: Toast[] = [];

export const useToast = () => {
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const nextToast = { id: Date.now() + Math.random(), message, type };
    if (emit) emit(nextToast);
    else pendingToasts.push(nextToast);
  }, []);

  return { toast };
};

export const useToastStore = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    emit = (toast) => {
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 3200);
    };
    pendingToasts.splice(0).forEach(emit);
    return () => { emit = null; };
  }, []);
  return toasts;
};
