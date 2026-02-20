import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { X, Upload, CheckCircle2, History, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/loanCalculator';
import { generateId } from '../utils/idGenerator';
import { LoanCategory } from '../types';

interface ImportHistoryModalProps {
    onClose: () => void;
}

export default function ImportHistoryModal({ onClose }: ImportHistoryModalProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<LoanCategory>('Gaji');
    const [selectedMonth, setSelectedMonth] = useState<string>('Januari');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const downloadTemplate = () => {
        const headers = ['Nama', 'Tanggal Pinjam', 'Jumlah Pinjam', 'Total Ganti', 'Keterangan'];
        const sampleData = [
            ['Budi Santoso', '2024-01-15', 1000000, 1200000, 'Lunas'],
            ['Siti Rahma', '2024-01-20', 500000, 600000, 'Belum Lunas'],
            ['Ahmad Dani', '2024-02-05', 2000000, 2400000, 'Lunas']
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        XLSX.writeFile(wb, "Template_Import_Pinjaman.xlsx");
    };

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
        const newMonthsSet = new Set<string>();

        try {
            previewData.forEach((row: any) => {
                // Map Columns
                const name = row['Nama'] || row['nama'] || row['Name'];
                const dateRaw = row['Tanggal Pinjam'] || row['tanggal pinjam'] || row['Date'];
                const amount = row['Jumlah Pinjam'] || row['jumlah pinjam'] || row['Nominal'] || 0;
                const totalDue = row['Total Ganti'] || row['total ganti'] || row['Total'] || amount; // Fallback to amount if undefined
                const statusRaw = row['Keterangan'] || row['keterangan'] || 'Lunas';

                if (name && amount > 0) {
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

                    // Determine Status and Paid Amount
                    const isLunas = statusRaw.toLowerCase().includes('lunas') && !statusRaw.toLowerCase().includes('belum');
                    const status = isLunas ? 'Lunas' : 'Belum Lunas';
                    const paidAmount = isLunas ? Number(totalDue) : 0;

                    // Parse Date
                    let dateObj = new Date();
                    if (dateRaw) {
                        if (typeof dateRaw === 'number') {
                            dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                        } else {
                            const parsed = new Date(dateRaw);
                            if (!isNaN(parsed.getTime())) dateObj = parsed;
                        }
                    } else {
                        const mIndex = months.indexOf(selectedMonth);
                        dateObj = new Date(parseInt(selectedYear), mIndex, 1);
                    }

                    // Determine Due Month
                    const dueMonthStr = `${selectedMonth} ${selectedYear}`;
                    newMonthsSet.add(dueMonthStr);

                    // Create Transaction
                    const newTx = {
                        id: generateId(),
                        borrowerId: borrowerId,
                        borrowerName: name,
                        category: selectedCategory,
                        totalPrincipal: Number(amount),
                        totalDue: Number(totalDue),
                        paidAmount: Number(paidAmount),
                        status: status as 'Lunas' | 'Belum Lunas',
                        entries: [{
                            id: generateId(),
                            borrowerId,
                            category: selectedCategory,
                            amount: Number(amount),
                            interestRate: 0,
                            totalDue: Number(totalDue),
                            date: dateObj.toISOString()
                        }],
                        installments: [],
                        dueMonth: dueMonthStr,
                        createdAt: dateObj.toISOString(),
                        updatedAt: new Date().toISOString(),
                        isArrear: status !== 'Lunas',
                        isPriority: false
                    };

                    dispatch({
                        type: 'ADD_ARREAR_MANUAL',
                        payload: newTx
                    });
                    importedCount++;
                }
            });

            // Update Available Months if needed
            const currentMonths = state.config.availableMonths || [];
            const updatedMonths = [...currentMonths];
            let changed = false;

            newMonthsSet.forEach(m => {
                if (!updatedMonths.includes(m)) {
                    updatedMonths.push(m);
                    changed = true;
                }
            });

            if (changed) {
                // Sort months simply? Complex sorting might be needed but for now alphabetic/year might fail.
                // Re-use standard sorting logic if possible or just append. 
                // Ideally we sort by parsing "Month Year".
                // Sort Logic:
                updatedMonths.sort((a, b) => {
                    const [mA, yA] = a.split(' ');
                    const [mB, yB] = b.split(' ');
                    if (yA !== yB) return parseInt(yA) - parseInt(yB);
                    return months.indexOf(mA) - months.indexOf(mB);
                });

                dispatch({ type: 'UPDATE_CONFIG', payload: { availableMonths: updatedMonths } });
            }

            showToast(`${importedCount} data berhasil diimport`, 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Gagal memproses file Excel', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="card-glass w-full max-w-4xl p-6 relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <History className="text-blue-400" />
                            Import Data Pinjaman (Excel)
                        </h2>
                        <p className="text-slate-400 text-sm">Upload data pinjaman massal (Lunas/Belum Lunas).</p>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-bold transition-all border border-slate-700"
                    >
                        <Download size={16} />
                        Download Template
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Kategori Default</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as LoanCategory)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="Gaji">Gaji</option>
                            <option value="Remon">Remon</option>
                        </select>
                    </div>
                    {/* Note: Date selection is less relevant now that we parse 'Tanggal Pinjam', but kept as fallback/context */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Filter Preview Bulan</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Filter Preview Tahun</label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {!previewData.length ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/50 rounded-xl p-8 bg-slate-800/20 hover:bg-slate-800/50 transition-colors">
                        <Upload size={48} className="text-slate-500 mb-4" />
                        <label className="btn-primary cursor-pointer">
                            Pilih File Excel
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">Kolom: <strong>Nama, Tanggal Pinjam, Jumlah Pinjam, Total Ganti, Keterangan</strong></p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-auto border rounded-xl border-slate-700 mb-4 bg-slate-900/50 max-h-[400px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-800 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Nama</th>
                                        <th className="px-4 py-2">Tanggal</th>
                                        <th className="px-4 py-2">Jumlah Pinjam</th>
                                        <th className="px-4 py-2">Total Ganti</th>
                                        <th className="px-4 py-2">Keterangan</th>
                                        <th className="px-4 py-2">Status (Auto)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {previewData.slice(0, 50).map((row, idx) => {
                                        const statusRaw = row['Keterangan'] || row['keterangan'] || 'Lunas';
                                        const isLunas = statusRaw.toLowerCase().includes('lunas') && !statusRaw.toLowerCase().includes('belum');
                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">{row['Nama'] || row['nama'] || row['Name']}</td>
                                                <td className="px-4 py-2">{row['Tanggal Pinjam'] || row['tanggal pinjam'] || '-'}</td>
                                                <td className="px-4 py-2">{formatCurrency(row['Jumlah Pinjam'] || row['jumlah pinjam'] || 0)}</td>
                                                <td className="px-4 py-2">{formatCurrency(row['Total Ganti'] || row['total ganti'] || 0)}</td>
                                                <td className="px-4 py-2 text-slate-400">{statusRaw}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${isLunas ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        }`}>
                                                        {isLunas ? 'Lunas' : 'Belum Lunas'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500">
                                Menampilkan preview 50 data pertama dari {previewData.length} total baris.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPreviewData([])}
                                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={isProcessing}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
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
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
