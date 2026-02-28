import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { LoanTransaction } from '../types';
import { X, Save, Calendar, Star, AlertTriangle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface EditArrearsModalProps {
    transactionId: string;
    onClose: () => void;
}

export default function EditArrearsModal({ transactionId, onClose }: EditArrearsModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const transaction = state.transactions.find((t: LoanTransaction) => t.id === transactionId);

    const [principal, setPrincipal] = useState('');
    const [totalDue, setTotalDue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'Belum Lunas' | 'Cicil' | 'Lunas'>('Belum Lunas');
    const [customPaidAmount, setCustomPaidAmount] = useState(0);

    // Lock background scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (transaction) {
            setPrincipal(transaction.totalPrincipal.toString());
            setTotalDue(transaction.totalDue.toString());
            // Format ISO date to YYYY-MM-DD for input
            const date = new Date(transaction.createdAt);
            if (!isNaN(date.getTime())) {
                setStartDate(date.toISOString().split('T')[0]);
            }
            setIsPriority(!!transaction.isPriority);
            setSelectedStatus(transaction.status);
            setCustomPaidAmount(transaction.paidAmount);
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const numericTotalDue = Number(totalDue);
        let finalPaidAmount = 0;

        if (selectedStatus === 'Lunas') {
            finalPaidAmount = numericTotalDue;
        } else if (selectedStatus === 'Cicil') {
            finalPaidAmount = customPaidAmount;
            if (finalPaidAmount >= numericTotalDue) {
                showToast('Jumlah bayar melebihi atau sama dengan total. Status diubah ke Lunas.', 'info');
                finalPaidAmount = numericTotalDue;
            } else if (finalPaidAmount <= 0) {
                showToast('Jumlah bayar cicilan harus lebih dari 0.', 'error');
                return;
            }
        }

        const dateObj = new Date(startDate);
        const monthStr = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        dispatch({
            type: 'UPDATE_ARREAR',
            payload: {
                id: transactionId,
                totalPrincipal: Number(principal),
                totalDue: numericTotalDue,
                createdAt: new Date(startDate).toISOString(),
                dueMonth: monthStr,
                isPriority: isPriority,
                paidAmount: finalPaidAmount
            }
        } as any);

        showToast('Data tunggakan berhasil diperbarui', 'success');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="card-glass w-full max-w-lg p-0 relative flex flex-col max-h-[90vh] overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-700 shrink-0 flex justify-between items-center bg-slate-800/50">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Edit Tunggakan</h2>
                            <p className="text-slate-400 text-sm">{transaction.borrowerName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-6 flex-1">

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300">Tanggal Mulai Tunggakan</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input-field pl-9"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Tunggakan Pokok</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                    <CurrencyInput
                                        value={principal}
                                        onChange={setPrincipal}
                                        className="input-field pl-10"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Harus Diganti</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                    <CurrencyInput
                                        value={totalDue}
                                        onChange={setTotalDue}
                                        className="input-field pl-10"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Priority Toggle */}
                        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <span className="text-sm font-medium text-slate-300">Nasabah Prioritas?</span>
                            <button
                                type="button"
                                onClick={() => setIsPriority(!isPriority)}
                                className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${isPriority
                                    ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                <Star size={12} className={isPriority ? 'fill-amber-400' : ''} />
                                {isPriority ? 'Ya, Prioritas' : 'Bukan'}
                            </button>
                        </div>

                        {/* Status Editor */}
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300">Status Pembayaran</label>
                                <p className="text-xs text-slate-500 mb-3">
                                    Ubah status pinjaman. Riwayat pembayaran akan digantikan dengan penyesuaian manual.
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Belum Lunas', 'Cicil', 'Lunas'] as const).map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setSelectedStatus(status)}
                                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${selectedStatus === status
                                                ? status === 'Belum Lunas' ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                                                    : status === 'Cicil' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-750'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedStatus === 'Cicil' && (
                                <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">Jumlah Terbayar Manual</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                                        <CurrencyInput
                                            value={customPaidAmount}
                                            onChange={(val) => setCustomPaidAmount(Number(val))}
                                            className="input-field pl-10 bg-slate-900 border-slate-600"
                                            placeholder="0"
                                            max={Number(totalDue) - 1}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedStatus !== transaction.status && (
                                <div className="flex items-start gap-2 text-amber-400/80 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 mt-2">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span className="text-xs">
                                        Perubahan status ini akan <b>mereset riwayat pembayaran (cicilan)</b> yang sudah ada pada transaksi ini.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-700 bg-slate-800/50 shrink-0">
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
