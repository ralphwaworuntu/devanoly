import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { generateId } from '../utils/idGenerator';
import { X, FileSpreadsheet, Upload, Download, AlertCircle } from 'lucide-react';

// Use XLSX from global window object (loaded via CDN)
declare global {
    interface Window {
        XLSX: any;
    }
}

interface ExcelImportModalProps {
    onClose: () => void;
}

export default function ExcelImportModal({ onClose }: ExcelImportModalProps) {
    const { dispatch } = useApp();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.XLSX) {
            showToast('Library Excel belum dimuat. Periksa koneksi internet.', 'error');
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = window.XLSX.utils.sheet_to_json(ws);

                // Validate Data
                const validData = data.filter((row: any) => row.Nama && row.Limit).map((row: any) => ({
                    id: generateId(),
                    name: row.Nama,
                    limit: Number(row.Limit) || 0
                }));

                setPreviewData(validData);
                if (validData.length === 0) {
                    showToast('Format Excel tidak sesuai. Pastikan ada kolom "Nama" dan "Limit"', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Gagal membaca file Excel', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleImport = () => {
        if (previewData.length === 0) return;

        let count = 0;
        previewData.forEach(borrower => {
            dispatch({ type: 'ADD_BORROWER', payload: borrower });
            count++;
        });

        showToast(`Berhasil mengimport ${count} data peminjam`, 'success');
        onClose();
    };

    const downloadTemplate = () => {
        if (!window.XLSX) return;
        const ws = window.XLSX.utils.json_to_sheet([
            { Nama: 'Contoh Nama 1', Limit: 5000000 },
            { Nama: 'Contoh Nama 2', Limit: 10000000 }
        ]);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Template");
        window.XLSX.writeFile(wb, "Template_Import_Peminjam.xlsx");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Import Data Peminjam</h3>
                            <p className="text-sm text-slate-400">Upload file Excel (.xlsx) untuk import massal.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={downloadTemplate}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all group"
                            >
                                <div className="p-2 rounded-full bg-slate-700 group-hover:bg-slate-600 transition-colors">
                                    <Download size={20} className="text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300">Download Template</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all group"
                            >
                                <div className="p-2 rounded-full bg-slate-700 group-hover:bg-slate-600 transition-colors">
                                    <Upload size={20} className="text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300">Upload Excel</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                        </div>

                        {/* Preview Area */}
                        {previewData.length > 0 && (
                            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                                <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-300">Preview ({previewData.length} Data)</h4>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                    {previewData.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800/50">
                                            <span className="text-slate-200 font-medium">{item.name}</span>
                                            <span className="text-slate-400">Limit: {item.limit?.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {previewData.length === 0 && !isLoading && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-slate-400">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>Pastikan file Excel memiliki header kolom <strong>Nama</strong> dan <strong>Limit</strong>.</p>
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={previewData.length === 0 || isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileSpreadsheet size={18} />
                            {isLoading ? 'Memproses...' : 'Import Data Sekarang'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
