import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { X, Save, User } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface EditBorrowerModalProps {
    borrowerId: string;
    onClose: () => void;
}

export default function EditBorrowerModal({ borrowerId, onClose }: EditBorrowerModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');

    // Lock background scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const borrower = state.borrowers.find(b => b.id === borrowerId);
        if (borrower) {
            setName(borrower.name);
            setLimit(borrower.limit.toString());
        }
    }, [borrowerId, state.borrowers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !limit) return;

        dispatch({
            type: 'UPDATE_BORROWER',
            payload: {
                id: borrowerId,
                name: name,
                limit: Number(limit)
            }
        });

        showToast('Data peminjam berhasil diperbarui', 'success');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">Edit Data Peminjam</h3>
                    <p className="text-slate-400 text-sm mb-6">Perbarui nama dan limit kredit.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Nama Lengkap</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <User size={16} />
                                </span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="Nama Peminjam"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Limit Pinjaman</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                <CurrencyInput
                                    value={limit}
                                    onChange={setLimit}
                                    className="input-field pl-10"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                        >
                            <Save size={18} />
                            Simpan Perubahan
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
