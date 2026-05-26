import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'error';
export interface Toast { id: number; message: string; type: ToastType; }
let emit: ((toast: Toast) => void) | null = null;

export const useToast = () => {
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    emit?.({ id: Date.now() + Math.random(), message, type });
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
    return () => { emit = null; };
  }, []);
  return toasts;
};
