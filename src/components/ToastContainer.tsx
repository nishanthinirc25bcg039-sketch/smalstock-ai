import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/inventory';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'error'
            ? AlertCircle
            : toast.type === 'info'
            ? Info
            : CheckCircle2;
        const iconColor =
          toast.type === 'error'
            ? 'text-red-600'
            : toast.type === 'info'
            ? 'text-slate-700'
            : 'text-emerald-600';

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 flex items-start gap-3 transition-all duration-200"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Dismiss notification: ${toast.title}`}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
