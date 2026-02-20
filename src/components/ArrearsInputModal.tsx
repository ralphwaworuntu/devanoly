import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Borrower } from '../types';
import { X, Save, Calendar, User } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import { generateId } from '../utils/idGenerator';

interface ArrearsInputModalProps {
    onClose: () => void;
}

export default function ArrearsInputModal({ onClose }: ArrearsInputModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();

    const [borrowerId, setBorrowerId] = useState('');
    const [borrowerName, setBorrowerName] = useState(''); // For new borrower
    const [isNewBorrower, setIsNewBorrower] = useState(false);

    // Configurable Fields
    const [principal, setPrincipal] = useState('');
    const [totalDue, setTotalDue] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if ((!borrowerId && !isNewBorrower) || (isNewBorrower && !borrowerName)) {
                showToast('Pilih atau isi nama peminjam', 'error');
                return;
            }

            if (!principal || !totalDue || !startDate) {
                showToast('Lengkapi data tunggakan (Pokok, Tagihan, Tanggal)', 'error');
                return;
            }

            let finalBorrowerId = borrowerId;

            // Create new borrower if needed
            if (isNewBorrower) {
                finalBorrowerId = generateId();
                dispatch({
                    type: 'ADD_BORROWER',
                    payload: {
                        id: finalBorrowerId,
                        name: borrowerName,
                        limit: 3000000 // Default limit
                    }
                });
            }

            // Derive Month string from Date (e.g. "Februari 2026")
            // Use Indonesian locale
            const dateObj = new Date(startDate);
            const monthStr = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

            const newTx = {
                id: generateId(),
                borrowerId: finalBorrowerId,
                borrowerName: isNewBorrower ? borrowerName : state.borrowers.find(b => b.id === finalBorrowerId)?.name || '',
                category: state.config.activeCycle,
                totalPrincipal: Number(principal),
                totalDue: Number(totalDue),
                paidAmount: 0,
                status: 'Belum Lunas' as const,
                entries: [{
                    id: generateId(),
                    borrowerId: finalBorrowerId,
                    category: state.config.activeCycle,
                    amount: Number(principal),
                    interestRate: 0, // Manual Arrear doesn't explicitly track rate usually, or we could calculate it
                    totalDue: Number(totalDue),
                    date: new Date(startDate).toISOString()
                }],
                installments: [],
                dueMonth: monthStr,
                createdAt: new Date(startDate).toISOString(),
                updatedAt: new Date().toISOString(),
                isArrear: true,
            };

            dispatch({
                type: 'ADD_ARREAR_MANUAL',
                payload: newTx
            });

            showToast('Data tunggakan berhasil ditambahkan', 'success');
            onClose();
        } catch (error) {
            console.error("Error saving arrears:", error);
            showToast('Gagal menyimpan data (System Error)', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="card-glass w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-1">Tambah Tunggakan Manual</h2>
                <p className="text-slate-400 text-sm mb-6">Input data hutang lama yang belum lunas.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Borrower Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Nama Peminjam</label>
                        <div className="flex gap-2">
                            {!isNewBorrower ? (
                                <select
                                    value={borrowerId}
                                    onChange={(e) => setBorrowerId(e.target.value)}
                                    className="input-field flex-1"
                                    required={!isNewBorrower}
                                >
                                    <option value="">-- Pilih Nama --</option>
                                    {state.borrowers.map((b: Borrower) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="relative flex-1">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={borrowerName}
                                        onChange={(e) => setBorrowerName(e.target.value)}
                                        placeholder="Ketik nama peminjam baru..."
                                        className="input-field pl-9 w-full"
                                        required={isNewBorrower}
                                    />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsNewBorrower(!isNewBorrower);
                                    setBorrowerId('');
                                    setBorrowerName('');
                                }}
                                className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                            >
                                {isNewBorrower ? 'Pilih Lama' : 'Baru +'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Tanggal Mulai Tunggakan</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field pl-9"
                                required
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

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Simpan Data Tunggakan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
