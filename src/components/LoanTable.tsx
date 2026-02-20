import { useState, ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { LoanTransaction } from '../types';
import { formatCurrency, getStatusColor } from '../utils/loanCalculator';
import PaymentModal from './PaymentModal';
import EditLoanModal from './EditLoanModal';
import ExportButton from './ExportButton';
import ArrearsInputModal from './ArrearsInputModal';
import ImportArrearsModal from './ImportArrearsModal';
import EditArrearsModal from './EditArrearsModal';
import ImportHistoryModal from './ImportHistoryModal';
import ConfirmationModal from './ConfirmationModal';
import { Search, FileText, Trash2, Edit2, Plus, Upload, Star, History, MoreVertical } from 'lucide-react';

type StatusFilter = 'Semua' | 'Belum Lunas' | 'Cicil' | 'Lunas';
type CategoryFilter = 'Semua' | 'Gaji' | 'Remon';


interface LoanTableProps {
    viewMode?: 'active' | 'arrears' | 'all';
    selectedMonth?: string;
    selectedYear?: string;
}

export default function LoanTable({ viewMode = 'all', selectedMonth, selectedYear }: LoanTableProps) {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [editTxId, setEditTxId] = useState<string | null>(null);
    const [showArrearsInput, setShowArrearsInput] = useState(false);
    const [showImportArrears, setShowImportArrears] = useState(false);
    const [showImportHistory, setShowImportHistory] = useState(false);
    const [search, setSearch] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Semua');
    const [isPriorityFilter, setIsPriorityFilter] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'name' | 'priority'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    } | null>(null);

    const filteredTransactions = state.transactions
        .filter((t: LoanTransaction) => {
            // 0a. Month Filter
            if (selectedMonth && t.dueMonth !== selectedMonth) return false;

            // 0b. Year Filter
            if (selectedYear && !t.dueMonth.includes(selectedYear)) return false;

            // 1. Search Filter
            if (!t.borrowerName.toLowerCase().includes(search.toLowerCase())) return false;

            // 2. Status Filter
            if (statusFilter !== 'Semua' && t.status !== statusFilter) return false;

            // 3. Category Filter
            if (categoryFilter !== 'Semua' && t.category !== categoryFilter) return false;

            // 4. Priority Filter
            if (isPriorityFilter && !t.isPriority) return false;

            // 5. View Mode Filter
            if (viewMode === 'arrears') {
                return !!t.isArrear;
            }

            // For ALL other modes ('active', 'all'), EXCLUDE arrears
            if (t.isArrear) return false;

            if (viewMode === 'active') {
                const activeMonth = t.category === 'Gaji' ? state.config.activeMonthGaji : state.config.activeMonthRemon;
                return t.dueMonth === activeMonth;
            }

            // viewMode === 'all' -> Show everything else
            return true;
        })
        .sort((a: LoanTransaction, b: LoanTransaction) => {
            if (sortConfig.key === 'priority') {
                const pA = a.isPriority ? 1 : 0;
                const pB = b.isPriority ? 1 : 0;
                if (pA !== pB) {
                    return sortConfig.direction === 'desc' ? pB - pA : pA - pB;
                }
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            } else if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.borrowerName.localeCompare(b.borrowerName)
                    : b.borrowerName.localeCompare(a.borrowerName);
            } else {
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

    const statusFilters: StatusFilter[] = ['Semua', 'Belum Lunas', 'Cicil', 'Lunas'];

    const getTitle = () => {
        if (selectedMonth) return `Data: ${selectedMonth}`;
        if (selectedYear) return `Data: Tahun ${selectedYear}`;
        if (viewMode === 'arrears') return 'Daftar Tunggakan';
        if (viewMode === 'active') return 'Transaksi Bulan Ini';
        return 'Semua Transaksi';
    };

    const getDescription = () => {
        if (selectedMonth) return `Detail pinjaman bulan ${selectedMonth}.`;
        if (selectedYear) return `Akumulasi tahun ${selectedYear}.`;
        return 'Kelola data pinjaman nasabah.';
    };

    return (
        <>
            <div className="card-glass p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 space-y-6">
                    {/* Header: Title & Main Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {getTitle()}
                                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                    {filteredTransactions.length} Data
                                </span>
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">{getDescription()}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Cari nasabah..."
                                    value={search}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="input-field pl-9 py-2 text-base font-medium w-full"
                                />
                            </div>

                            {/* Action Menu Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="btn-secondary p-3 aspect-square flex items-center justify-center bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700 transition-all rounded-xl"
                                    title="Menu Data"
                                >
                                    <MoreVertical size={24} />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 z-20 overflow-hidden py-3 animate-in fade-in zoom-in-95 duration-200">
                                            {viewMode === 'arrears' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setShowArrearsInput(true);
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-6 py-4 text-base font-semibold text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-4 transition-colors"
                                                    >
                                                        <Plus size={20} className="text-blue-400" />
                                                        Tambah Manual
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowImportArrears(true);
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-6 py-4 text-base font-semibold text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-4 transition-colors"
                                                    >
                                                        <Upload size={20} className="text-emerald-400" />
                                                        Import Tunggakan
                                                    </button>
                                                    <div className="h-px bg-slate-700 my-1" />
                                                </>
                                            )}

                                            <div className="px-4 pt-2 pb-1">
                                                <button
                                                    onClick={() => {
                                                        setShowImportHistory(true);
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="btn-secondary w-full flex items-center justify-start px-5 py-4 text-base font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-700/50"
                                                >
                                                    <div className="bg-purple-500/10 p-2 rounded-lg mr-3">
                                                        <History size={20} className="text-purple-400" />
                                                    </div>
                                                    Import History
                                                </button>
                                            </div>

                                            <div className="px-4 py-2 space-y-2">
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Export Data</div>
                                                <ExportButton />
                                            </div>

                                            {(selectedMonth || selectedYear) && filteredTransactions.length > 0 && (
                                                <>
                                                    <div className="h-px bg-slate-700 my-1" />
                                                    <div className="h-px bg-slate-700 my-2 mx-4" />
                                                    <button
                                                        onClick={() => {
                                                            setIsMenuOpen(false);
                                                            setConfirmModal({
                                                                isOpen: true,
                                                                title: 'Hapus Data Masal?',
                                                                message: `Yakin ingin menghapus ${filteredTransactions.length} data yang ditampilkan? Data yang dihapus TIDAK BISA DIKEMBALIKAN.`,
                                                                type: 'danger',
                                                                onConfirm: () => {
                                                                    const idsToDelete = filteredTransactions.map(t => t.id);
                                                                    dispatch({ type: 'DELETE_TRANSACTIONS_BATCH', payload: idsToDelete });
                                                                    showToast(`${idsToDelete.length} data berhasil dihapus`, 'warning');
                                                                }
                                                            });
                                                        }}
                                                        className="w-full text-left px-6 py-4 text-base font-semibold text-rose-400 hover:bg-rose-900/20 flex items-center gap-4 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                        Hapus Data Tampil
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filters Section - Unified Style */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 space-y-4 xl:space-y-0 xl:flex xl:items-center xl:justify-between xl:gap-6">
                        {/* Status Filters - Grid on Mobile */}
                        <div className="flex flex-col gap-2 w-full xl:w-auto">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center xl:text-left">Status</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:flex xl:gap-2">
                                {statusFilters.map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setStatusFilter(filter)}
                                        className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all border shadow-sm flex items-center justify-center ${statusFilter === filter
                                            ? filter === 'Belum Lunas' ? 'bg-rose-500/10 text-rose-400 border-rose-500/50'
                                                : filter === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
                                                    : filter === 'Cicil' ? 'bg-amber-500/10 text-amber-400 border-amber-500/50'
                                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/50'
                                            : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-8 bg-slate-700 hidden xl:block" />

                        {/* Category & Sorting - Grid on Mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex items-center gap-4 w-full xl:w-auto">
                            {/* Category Tabs */}
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center xl:hidden">Kategori</span>
                                <div className="flex items-center gap-2 xl:w-auto w-full">
                                    <span className="text-sm font-bold text-slate-400 mr-2 uppercase tracking-wide hidden xl:block">Kategori:</span>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full xl:w-auto">
                                        {(['Semua', 'Gaji', 'Remon'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategoryFilter(cat)}
                                                className={`flex items-center justify-center px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${categoryFilter === cat
                                                    ? cat === 'Gaji' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : cat === 'Remon' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                                            : 'bg-slate-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Priority & Sort Container */}
                            <div className="flex gap-2 w-full xl:w-auto">
                                {/* Priority Toggle */}
                                <button
                                    onClick={() => setIsPriorityFilter(!isPriorityFilter)}
                                    className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border shadow-sm ${isPriorityFilter
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/50'
                                        : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Star size={16} className={isPriorityFilter ? 'fill-amber-400' : ''} />
                                    Prioritas
                                </button>

                                {/* Sort Dropdown */}
                                <div className="relative flex-1 xl:flex-none">
                                    <select
                                        value={`${sortConfig.key}-${sortConfig.direction}`}
                                        onChange={(e) => {
                                            const [key, direction] = e.target.value.split('-');
                                            setSortConfig({ key: key as 'date' | 'name' | 'priority', direction: direction as 'asc' | 'desc' });
                                        }}
                                        className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-lg pl-4 pr-10 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-slate-750"
                                    >
                                        <option value="date-desc">Terbaru</option>
                                        <option value="date-asc">Terlama</option>
                                        <option value="name-asc">Nama A-Z</option>
                                        <option value="name-desc">Nama Z-A</option>
                                        <option value="priority-desc">Prioritas (Ya)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar" style={{ transform: 'rotateX(180deg)' }}>
                    <table className="w-full text-left" style={{ transform: 'rotateX(180deg)' }}>
                        <thead className="bg-slate-800/80 text-slate-300 text-sm font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-5 whitespace-nowrap">Nasabah</th>
                                {viewMode !== 'arrears' && <th className="px-6 py-5 whitespace-nowrap">Kategori</th>}
                                {viewMode === 'arrears' && <th className="px-6 py-5 whitespace-nowrap">Tanggal Mulai</th>}
                                <th className="px-6 py-5 whitespace-nowrap">{viewMode === 'arrears' ? 'Tunggakan Pokok' : 'Total Pinjam'}</th>
                                <th className="px-6 py-5 whitespace-nowrap">{viewMode === 'arrears' ? 'Harus Diganti' : 'Total Tagihan'}</th>

                                {viewMode === 'arrears' && (
                                    <>
                                        <th className="px-6 py-5 whitespace-nowrap">Terbayar</th>
                                        <th className="px-6 py-5 whitespace-nowrap">Sisa</th>
                                        <th className="px-6 py-5 whitespace-nowrap">Tgl Bayar</th>
                                    </>
                                )}

                                {viewMode !== 'arrears' && <th className="px-6 py-5 whitespace-nowrap">Progress</th>}
                                {viewMode !== 'arrears' && <th className="px-6 py-5 whitespace-nowrap">Sisa</th>}
                                {viewMode !== 'arrears' && <th className="px-6 py-5 whitespace-nowrap">Status</th>}
                                <th className="px-6 py-5 text-right whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredTransactions.map((tx: LoanTransaction) => {
                                const progress = tx.totalDue > 0 ? (tx.paidAmount / tx.totalDue) * 100 : 0;
                                const remaining = tx.totalDue - tx.paidAmount;

                                return (
                                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg ${tx.category === 'Gaji' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-purple-600 shadow-purple-500/20'
                                                    }`}>
                                                    {tx.borrowerName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-200 flex items-center gap-2 text-base">
                                                        {tx.borrowerName}
                                                        {tx.isPriority && <Star size={14} className="text-amber-400 fill-amber-400" />}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-500 mt-1">
                                                        {viewMode === 'arrears'
                                                            ? tx.dueMonth
                                                            : (
                                                                <div className="flex flex-col">
                                                                    {(() => {
                                                                        // Get unique dates from entries
                                                                        const dates = new Set(
                                                                            tx.entries?.map(e =>
                                                                                new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                            ) || [new Date(tx.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })]
                                                                        );

                                                                        // If no entries (legacy data), fallback to updatedAt or createdAt
                                                                        if (dates.size === 0) {
                                                                            dates.add(new Date(tx.updatedAt || tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
                                                                        }

                                                                        return Array.from(dates).map((date, idx) => (
                                                                            <span key={idx}>{date}</span>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {
                                            viewMode !== 'arrears' && (
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded text-xs uppercase font-bold border whitespace-nowrap tracking-wide ${tx.category === 'Gaji'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        }`}>
                                                        {tx.category} {tx.dueMonth}
                                                    </span>
                                                </td>
                                            )
                                        }
                                        {
                                            viewMode === 'arrears' && (
                                                <td className="px-6 py-4 text-slate-400 text-sm font-medium">
                                                    <div className="flex flex-col">
                                                        {(() => {
                                                            const dates = new Set(
                                                                tx.entries?.map(e =>
                                                                    new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                ) || [new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })]
                                                            );

                                                            // Fallback
                                                            if (dates.size === 0) {
                                                                dates.add(new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                                                            }

                                                            return Array.from(dates).map((date, idx) => (
                                                                <span key={idx} className="whitespace-nowrap">{date}</span>
                                                            ));
                                                        })()}
                                                    </div>
                                                </td>
                                            )
                                        }
                                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-medium">{formatCurrency(tx.totalPrincipal)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-200 whitespace-nowrap text-base">
                                            {formatCurrency(tx.totalDue)}
                                        </td>

                                        {
                                            viewMode === 'arrears' && (
                                                <>
                                                    <td className="px-6 py-4 text-emerald-400 font-bold whitespace-nowrap">
                                                        {formatCurrency(tx.paidAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-rose-400 font-bold whitespace-nowrap text-base">
                                                        {formatCurrency(remaining)}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                                        <div className="flex flex-col gap-2">
                                                            {(() => {
                                                                if (!tx.installments || tx.installments.length === 0) return <span className="text-slate-600">-</span>;

                                                                return tx.installments.map((inst, idx) => (
                                                                    <div key={idx} className="flex justify-between gap-2 min-w-[120px]">
                                                                        <span>{new Date(inst.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                                        <span className="font-medium text-slate-300">{formatCurrency(inst.amount)}</span>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </td>
                                                </>
                                            )
                                        }

                                        {
                                            viewMode !== 'arrears' && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3 min-w-[120px]">
                                                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' :
                                                                        progress > 0 ? 'bg-amber-500' : 'bg-slate-700'
                                                                        }`}
                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-400 tabular-nums w-10 text-right">
                                                                {progress.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-rose-400 font-bold whitespace-nowrap text-base">
                                                        {formatCurrency(tx.totalDue - tx.paidAmount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(tx.status)}`}>
                                                                {tx.status}
                                                            </span>
                                                            {(tx.status === 'Lunas' || tx.status === 'Cicil') && tx.installments && tx.installments.length > 0 && (
                                                                <span className="text-xs font-medium text-slate-500 mt-0.5">
                                                                    {new Date(tx.installments[tx.installments.length - 1].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </>
                                            )
                                        }
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedTxId(tx.id)}
                                                    className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2 rounded-lg border border-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                                                // disabled={tx.status === 'Lunas'} // Allow opening to view history
                                                >
                                                    {tx.status === 'Lunas' ? 'Detail' : 'Bayar'}
                                                </button>
                                                <button
                                                    onClick={() => setEditTxId(tx.id)}
                                                    className="text-slate-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-all"
                                                    title="Edit"
                                                // disabled={tx.status === 'Lunas'} // Allow editing even if Lunas
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setConfirmModal({
                                                            isOpen: true,
                                                            title: 'Hapus Transaksi?',
                                                            message: `Hapus transaksi ${tx.borrowerName}? Data tidak dapat dikembalikan.`,
                                                            type: 'danger',
                                                            onConfirm: () => {
                                                                dispatch({ type: 'DELETE_TRANSACTION', payload: tx.id });
                                                                showToast(`Transaksi ${tx.borrowerName} berhasil dihapus`, 'warning');
                                                            }
                                                        });
                                                    }}
                                                    className="text-slate-500 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={48} className="text-slate-700" />
                                            <p className="text-slate-500 font-bold text-lg">Tidak ada transaksi ditemukan</p>
                                            <p className="text-slate-600">
                                                Coba ubah filter atau tambah transaksi baru
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div >
            </div >

            {selectedTxId && (
                <PaymentModal
                    transactionId={selectedTxId}
                    onClose={() => setSelectedTxId(null)}
                />
            )
            }
            {
                editTxId && (
                    <>
                        {/* Check if it's an arrear or regular loan to choose Modal */}
                        {/* We can check state here or pass down. Accessing state to check isArrear */}
                        {(() => {
                            const tx = state.transactions.find(t => t.id === editTxId);
                            if (tx?.isArrear) {
                                return <EditArrearsModal transactionId={editTxId} onClose={() => setEditTxId(null)} />;
                            } else {
                                return <EditLoanModal transactionId={editTxId} onClose={() => setEditTxId(null)} />;
                            }
                        })()}
                    </>
                )
            }
            {
                showArrearsInput && (
                    <ArrearsInputModal onClose={() => setShowArrearsInput(false)} />
                )
            }
            {
                showImportArrears && (
                    <ImportArrearsModal onClose={() => setShowImportArrears(false)} />
                )
            }
            {
                showImportHistory && (
                    <ImportHistoryModal onClose={() => setShowImportHistory(false)} />
                )
            }
            {confirmModal && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.type}
                />
            )}
        </>
    );
}
