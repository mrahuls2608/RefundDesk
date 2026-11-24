'use client';

import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cx } from './cx';

export type ToastVariant = 'success' | 'info' | 'danger';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const AUTO_DISMISS_MS = 5000;

const STYLE: Record<ToastVariant, string> = {
  success: 'border-success-700',
  info: 'border-info-700',
  danger: 'border-danger-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const api = useMemo<ToastApi>(
    () => ({ show: (message, variant = 'success') => setToasts((list) => [...list, { id: nextId.current++, message, variant }]) }),
    [],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Auto-dismisses after 5 s (except errors) and pauses while hovered or focused. */
function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || toast.variant === 'danger') return;
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [paused, toast, onDismiss]);
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx('pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border-l-4 bg-surface px-4 py-3 shadow-lg', STYLE[toast.variant])}
    >
      <p className="flex-1 text-body">{toast.message}</p>
      <button type="button" onClick={() => onDismiss(toast.id)} className="min-h-touch min-w-touch rounded-sm text-text-muted" aria-label="Dismiss notification">
        <X aria-hidden="true" className="mx-auto h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
