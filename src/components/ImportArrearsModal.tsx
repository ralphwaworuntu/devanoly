import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { X, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/loanCalculator';
import { generateId } from '../utils/idGenerator';
import { LoanCategory } from '../types';

interface ImportArrearsModalProps {
    onClose: () => void;
}

export default function ImportArrearsModal({ onClose }: ImportArrearsModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setPreviewData(data);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = () => {
        setIsProcessing(true);
        let importedCount = 0;

        try {
            previewData.forEach((row: any) => {
                // Expected Columns: Nama, Kategori, Nominal, Bulan
                const name = row['Nama'] || row['nama'] || row['Name'];
                const categoryRaw = row['Kategori'] || row['kategori'] || 'Gaji';
                const amount = row['Nominal'] || row['nominal'] || row['Amount'] || row['Total'] || 0;
                const month = row['Bulan'] || row['bulan'] || row['Month'] || '-';

                if (name && amount > 0) {
                    const category = categoryRaw.toString().toLowerCase().includes('remon') ? 'Remon' : 'Gaji';

                    // Find or Create Borrower
                    let borrowerId = state.borrowers.find(b => b.name.toLowerCase() === name.toLowerCase())?.id;
                    if (!borrowerId) {
                        borrowerId = generateId();
                        dispatch({
                            type: 'ADD_BORROWER',
                            payload: {
                                id: borrowerId,
                                name: name,
                                limit: 3000000
                            }
                        });
                    }

                    // Add Transaction
                    const newTx = {
                        id: generateId(),
                        borrowerId: borrowerId,
                        borrowerName: name,
                        category: category as LoanCategory,
                        totalPrincipal: Number(amount),
                        totalDue: Number(amount),
                        paidAmount: 0,
                        status: 'Belum Lunas' as const,
                        entries: [],
                        installments: [],
                        dueMonth: month.toString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isArrear: true,
                    };

                    dispatch({
                        type: 'ADD_ARREAR_MANUAL',
                        payload: newTx
                    });
                    importedCount++;
                }
            });

            showToast(`${importedCount} data tunggakan berhasil diimport`, 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Gagal memproses file Excel', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="card-glass w-full max-w-2xl p-6 relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <FileSpreadsheet className="text-emerald-400" />
                    Import Tunggakan Excel
                </h2>
                <p className="text-slate-400 text-sm mb-6">Upload file Excel (.xlsx) dengan kolom: <strong>Nama, Kategori, Pokok, Total, Bulan</strong></p>

                {!previewData.length ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/50 rounded-xl p-12 bg-slate-800/20 hover:bg-slate-800/50 transition-colors">
                        <Upload size={48} className="text-slate-500 mb-4" />
                        <label className="btn-primary cursor-pointer">
                            Pilih File Excel
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">Format yang didukung: .xlsx, .xls</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-auto border rounded-xl border-slate-700 mb-4 bg-slate-900/50">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-800 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Nama</th>
                                        <th className="px-4 py-2">Kategori</th>
                                        <th className="px-4 py-2">Pokok</th>
                                        <th className="px-4 py-2">Total Tagihan</th>
                                        <th className="px-4 py-2">Bulan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {previewData.slice(0, 10).map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2">{row['Nama'] || row['nama']}</td>
                                            <td className="px-4 py-2">{row['Kategori'] || row['kategori'] || 'Gaji'}</td>
                                            <td className="px-4 py-2">{formatCurrency(row['Pokok'] || row['pokok'] || row['Nominal'] || 0)}</td>
                                            <td className="px-4 py-2">{formatCurrency(row['Total'] || row['total'] || row['Tagihan'] || row['tagihan'] || row['Nominal'] || 0)}</td>
                                            <td className="px-4 py-2">{row['Bulan'] || row['bulan']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && (
                                <p className="text-xs text-center p-2 text-slate-500">...dan {previewData.length - 10} baris lainnya</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                            <button
                                onClick={() => setPreviewData([])}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {isProcessing ? 'Memproses...' : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Import {previewData.length} Data
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
