import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { LoanTransaction } from '../types';
import { formatCurrency } from '../utils/loanCalculator';
import { X, Wallet, Calendar } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface PaymentModalProps {
    transactionId: string;
    onClose: () => void;
}

export default function PaymentModal({ transactionId, onClose }: PaymentModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();

    // Form State
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [note, setNote] = useState('');

    // Lock background scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const transaction = state.transactions.find((t: LoanTransaction) => t.id === transactionId);
    if (!transaction) return null;

    const remaining = transaction.totalDue - transaction.paidAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        dispatch({
            type: 'MAKE_PAYMENT',
            payload: {
                transactionId,
                amount: Number(amount),
                date: new Date(date).toISOString(),
                note
            }
        });

        const isLunas = Number(amount) >= remaining;
        showToast(
            isLunas
                ? `${transaction.borrowerName} LUNAS! 🎉`
                : `Pembayaran ${formatCurrency(Number(amount))} berhasil dicatat`,
            isLunas ? 'success' : 'info'
        );
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">Input Pembayaran</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${transaction.category === 'Gaji' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                            {transaction.category}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">Untuk {transaction.borrowerName}</p>

                    <div className="bg-slate-800/50 p-4 rounded-xl mb-6 space-y-2 border border-slate-700/50">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Tagihan</span>
                            <span className="text-slate-200">{formatCurrency(transaction.totalDue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Sudah Dibayar</span>
                            <span className="text-emerald-400">{formatCurrency(transaction.paidAmount)}</span>
                        </div>
                        <div className="border-t border-slate-700 my-2"></div>
                        <div className="flex justify-between font-bold">
                            <span className="text-slate-200">Sisa Tagihan</span>
                            <span className="text-rose-400">{formatCurrency(remaining)}</span>
                        </div>
                    </div>

                    {remaining > 0 ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Tanggal Bayar</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Calendar size={16} />
                                    </span>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="input-field pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Jumlah Bayar</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                    <CurrencyInput
                                        value={amount}
                                        onChange={(val) => setAmount(val)}
                                        className="input-field pl-10"
                                        placeholder="0"
                                        autoFocus
                                        max={remaining}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button type="button" onClick={() => setAmount(remaining.toString())} className="text-xs bg-slate-800 text-blue-400 px-2 py-1 rounded hover:bg-slate-700 border border-slate-700">
                                        Lunasi ({formatCurrency(remaining)})
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Catatan (Optional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="input-field"
                                    placeholder="Contoh: Transfer BCA"
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                                <Wallet size={18} />
                                <span className='font-bold'>Simpan Pembayaran</span>
                            </button>
                        </form>
                    ) : (
                        <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-6">
                            <p className="text-emerald-400 font-bold text-lg">Lunas</p>
                            <p className="text-sm text-emerald-500/80">Pinjaman ini sudah lunas sepenuhnya.</p>
                        </div>
                    )}

                    {/* Payment History */}
                    {transaction.installments && transaction.installments.length > 0 && (
                        <div className="mt-8 border-t border-slate-800 pt-6">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">Riwayat Pembayaran</h4>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                {Object.entries(
                                    transaction.installments.reduce((groups, inst) => {
                                        const dateKey = new Date(inst.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                        if (!groups[dateKey]) groups[dateKey] = [];
                                        groups[dateKey].push(inst);
                                        return groups;
                                    }, {} as Record<string, typeof transaction.installments>)
                                ).map(([date, payments]) => (
                                    <div key={date} className="relative pl-4 border-l-2 border-slate-800">
                                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-700 ring-4 ring-slate-900" />
                                        <p className="text-xs font-bold text-slate-400 mb-2 leading-none pt-0.5">{date}</p>
                                        <div className="space-y-2">
                                            {payments.map((inst) => (
                                                <div key={inst.id} className="flex justify-between items-center bg-slate-800/30 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(inst.amount)}</span>
                                                        {inst.note && <span className="text-[10px] text-slate-500 italic">{inst.note}</span>}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Hapus pembayaran ini? Status Lunas mungkin akan berubah.')) {
                                                                dispatch({
                                                                    type: 'DELETE_PAYMENT',
                                                                    payload: { transactionId: transaction.id, installmentId: inst.id! }
                                                                });
                                                                showToast('Pembayaran dihapus', 'warning');
                                                            }
                                                        }}
                                                        className="text-slate-600 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Hapus Pembayaran"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
