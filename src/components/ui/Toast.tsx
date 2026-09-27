/* Toast provider and useToast hook for success/error staff feedback.
 * App-wide; pages never alert() for API results. */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string, duration?: number) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => showToast('success', title, description), [showToast]);
  const error = useCallback((title: string, description?: string) => showToast('error', title, description), [showToast]);
  const warning = useCallback((title: string, description?: string) => showToast('warning', title, description), [showToast]);
  const info = useCallback((title: string, description?: string) => showToast('info', title, description), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let icon = <Info size={18} color="var(--status-info)" />;
          let borderColor = 'var(--status-info-border)';
          let bg = '#ffffff';

          if (toast.type === 'success') {
            icon = <CheckCircle2 size={18} color="var(--status-success)" />;
            borderColor = 'var(--status-success-border)';
          } else if (toast.type === 'error') {
            icon = <AlertCircle size={18} color="var(--status-error)" />;
            borderColor = 'var(--status-error-border)';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle size={18} color="var(--status-warning)" />;
            borderColor = 'var(--status-warning-border)';
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: bg,
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${borderColor}`,
                boxShadow: 'var(--shadow-dropdown)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '1px' }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {toast.title}
                </div>
                {toast.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--c-slate-400)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
