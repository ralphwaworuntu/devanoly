import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { LoanTransaction } from '../types';
import { Download, Printer, FileText } from 'lucide-react';
import ExportPdfModal from './ExportPdfModal';

export default function ExportButton() {
    const { state } = useApp();
    const { showToast } = useToast();
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const exportCSV = () => {
        if (state.transactions.length === 0) {
            showToast('Tidak ada data untuk di-export', 'warning');
            return;
        }

        const headers = ['Nama', 'Total Pinjaman', 'Total Tagihan', 'Terbayar', 'Sisa', 'Status', 'Tanggal'];
        const rows = state.transactions.map((t: LoanTransaction) => [
            t.borrowerName,
            t.totalPrincipal,
            t.totalDue,
            t.paidAmount,
            t.totalDue - t.paidAmount,
            t.status,
            new Date(t.createdAt).toLocaleDateString('id-ID')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: (string | number)[]) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const activeMonth = state.config.activeCycle === 'Gaji' ? state.config.activeMonthGaji : state.config.activeMonthRemon;
        link.download = `laporan-pinjaman-${activeMonth.replace(/\s/g, '-')}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('File CSV berhasil di-download', 'success');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <button
                onClick={exportCSV}
                className="btn-secondary w-full flex items-center justify-start px-5 py-4 text-base font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-700/50"
            >
                <div className="bg-slate-700 p-2 rounded-lg mr-3">
                    <Download size={20} className="text-blue-400" />
                </div>
                Export CSV
            </button>

            <button
                onClick={() => setIsPdfModalOpen(true)}
                className="btn-secondary w-full flex items-center justify-start px-5 py-4 text-base font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-700/50"
            >
                <div className="bg-rose-500/10 p-2 rounded-lg mr-3">
                    <FileText size={20} className="text-rose-400" />
                </div>
                Export PDF
            </button>

            <button
                onClick={handlePrint}
                className="btn-secondary w-full flex items-center justify-start px-5 py-4 text-base font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-700/50"
            >
                <div className="bg-slate-700 p-2 rounded-lg mr-3">
                    <Printer size={20} className="text-slate-400" />
                </div>
                Print Halaman
            </button>

            <ExportPdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
            />
        </div>
    );
}
