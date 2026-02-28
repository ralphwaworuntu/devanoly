import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal'
}: ConfirmationModalProps) {
    // Close on Escape key and lock scroll
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle size={32} className="text-rose-400" />;
            case 'warning':
                return <AlertTriangle size={32} className="text-amber-400" />;
            case 'info':
                return <Info size={32} className="text-blue-400" />;
            default:
                return <AlertTriangle size={32} className="text-rose-400" />;
        }
    };

    const getGradient = () => {
        switch (type) {
            case 'danger':
                return 'from-rose-500/20 to-transparent';
            case 'warning':
                return 'from-amber-500/20 to-transparent';
            case 'info':
                return 'from-blue-500/20 to-transparent';
            default:
                return 'from-rose-500/20 to-transparent';
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20';
            default:
                return 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Decorative Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${getGradient()} pointer-events-none`} />

                <div className="p-6 relative">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className={`p-4 rounded-2xl bg-slate-800 shadow-lg ring-1 ring-white/5`}>
                            {getIcon()}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl font-bold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg active:scale-95 ${getConfirmButtonStyle()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

