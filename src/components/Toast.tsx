import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const iconMap = {
    success: <CheckCircle2 size={18} />,
    warning: <AlertTriangle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />
};

const colorMap = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    error: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-blue-500/15 border-blue-500/30 text-blue-400'
};

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-2xl min-w-[300px] max-w-[420px] toast-enter ${colorMap[toast.type]}`}
                >
                    <div className="shrink-0">{iconMap[toast.type]}</div>
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
