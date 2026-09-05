'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type Toast = { id: number; message: string; tone: 'success' | 'error' };

const ToastContext = createContext<{ notify: (message: string, tone?: Toast['tone']) => void }>({
  notify: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm shadow-pop"
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-ink" aria-hidden />
            ) : (
              <AlertCircle className="h-4 w-4 text-danger" aria-hidden />
            )}
            <span className={toast.tone === 'error' ? 'text-danger' : 'text-ink'}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
