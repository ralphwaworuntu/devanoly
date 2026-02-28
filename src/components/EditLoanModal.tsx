import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { LoanTransaction } from '../types';
import { calculateTotalDue, formatCurrency } from '../utils/loanCalculator';
import { X, Save, Star, AlertTriangle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface EditLoanModalProps {
    transactionId: string;
    onClose: () => void;
}

export default function EditLoanModal({ transactionId, onClose }: EditLoanModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const transaction = state.transactions.find((t: LoanTransaction) => t.id === transactionId);

    const [principal, setPrincipal] = useState(0);
    const [rate, setRate] = useState(20);
    const [totalDue, setTotalDue] = useState(0);
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

    // Initialize state from transaction
    useEffect(() => {
        if (transaction) {
            setPrincipal(transaction.totalPrincipal);

            if (transaction.totalPrincipal > 0) {
                const impliedRate = ((transaction.totalDue - transaction.totalPrincipal) / transaction.totalPrincipal) * 100;
                setRate(Math.round(impliedRate) || 0);
            } else {
                const defaultRate = transaction.category === 'Gaji'
                    ? state.config.interestRateGaji
                    : state.config.interestRateRemon;
                setRate(defaultRate);
            }

            setTotalDue(transaction.totalDue);
            setIsPriority(!!transaction.isPriority);
            setSelectedStatus(transaction.status);
            setCustomPaidAmount(transaction.paidAmount);
        }
    }, [transaction, state.config]);

    // Recalculate totalDue when principal or rate changes
    useEffect(() => {
        setTotalDue(calculateTotalDue(principal, rate));
    }, [principal, rate]);

    if (!transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (principal <= 0) {
            showToast('Jumlah pinjaman harus lebih dari 0', 'error');
            return;
        }

        let finalPaidAmount = 0;
        if (selectedStatus === 'Lunas') {
            finalPaidAmount = totalDue;
        } else if (selectedStatus === 'Cicil') {
            finalPaidAmount = customPaidAmount;
            if (finalPaidAmount >= totalDue) {
                showToast('Jumlah bayar melebihi atau sama dengan total. Status diubah ke Lunas.', 'info');
                finalPaidAmount = totalDue;
            } else if (finalPaidAmount <= 0) {
                showToast('Jumlah bayar cicilan harus lebih dari 0.', 'error');
                return;
            }
        }

        dispatch({
            type: 'UPDATE_TRANSACTION',
            payload: {
                id: transactionId,
                totalPrincipal: principal,
                totalDue: totalDue,
                interestRate: rate,
                isPriority: isPriority,
                paidAmount: finalPaidAmount
            }
        });

        showToast('Data pinjaman berhasil diperbarui', 'success');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-white">Edit Pinjaman ({transaction.category})</h3>
                            <p className="text-sm text-slate-400">{transaction.borrowerName}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-6 flex-1">
                        {/* Principal Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Jumlah Pinjaman (Principal)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                                <CurrencyInput
                                    value={principal}
                                    onChange={(val) => setPrincipal(Number(val))}
                                    className="input-field pl-10"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Bunga (%)</label>
                            <div className="flex gap-4">
                                {[10, 20].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRate(r)}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border ${rate === r
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {r}%
                                    </button>
                                ))}
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        className="input-field text-center"
                                        placeholder="Custom"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
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
                                            max={totalDue - 1}
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

                        {/* Move Category */}
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <label className="text-sm font-medium text-slate-300">Pindahkan Kategori</label>
                            <p className="text-xs text-slate-500">
                                Ubah kategori jika salah input. Transaksi akan dipindahkan ke siklus bulan aktif kategori tujuan.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Pindahkan transaksi ini ke kategori GAJI?')) {
                                            dispatch({
                                                type: 'MOVE_LOAN_CATEGORY',
                                                payload: { id: transactionId, newCategory: 'Gaji' }
                                            });
                                            showToast('Kategori berhasil diubah ke GAJI', 'success');
                                            onClose();
                                        }
                                    }}
                                    disabled={transaction.category === 'Gaji'}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${transaction.category === 'Gaji'
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 cursor-default'
                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                                        }`}
                                >
                                    Ke GAJI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Pindahkan transaksi ini ke kategori REMON?')) {
                                            dispatch({
                                                type: 'MOVE_LOAN_CATEGORY',
                                                payload: { id: transactionId, newCategory: 'Remon' }
                                            });
                                            showToast('Kategori berhasil diubah ke REMON', 'success');
                                            onClose();
                                        }
                                    }}
                                    disabled={transaction.category === 'Remon'}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${transaction.category === 'Remon'
                                        ? 'bg-purple-600/20 border-purple-500 text-purple-400 cursor-default'
                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-purple-600 hover:text-white hover:border-purple-500'
                                        }`}
                                >
                                    Ke REMON
                                </button>
                            </div>
                        </div>

                        {/* Total Due Preview */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Pinjaman</span>
                                <span className="text-slate-200">{formatCurrency(principal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Bunga ({rate}%)</span>
                                <span className="text-rose-400">+{formatCurrency(principal * rate / 100)}</span>
                            </div>
                            <div className="h-px bg-slate-700 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-300">Total Tagihan</span>
                                <span className="font-bold text-lg text-emerald-400">{formatCurrency(totalDue)}</span>
                            </div>

                            {/* Comparison with current */}
                            {totalDue !== transaction.totalDue && (
                                <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Sebelumnya</span>
                                    <span className="text-slate-500 line-through">{formatCurrency(transaction.totalDue)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-slate-800/50 shrink-0">
                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
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
