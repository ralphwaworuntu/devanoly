import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateFinancialSummary, formatCurrency } from '../utils/loanCalculator';
import { Wallet, TrendingUp, PiggyBank, Calendar, ArrowDownRight, Star, PieChart, Briefcase, AlertCircle } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

interface FinancialSummaryProps {
    selectedMonth?: string;
    selectedYear?: string;
}

export default function FinancialSummary({ selectedMonth, selectedYear }: FinancialSummaryProps) {
    const { state } = useApp();
    const [view, setView] = useState<'All' | 'Gaji' | 'Remon' | 'Tunggakan'>('All');
    const [isPriorityView, setIsPriorityView] = useState(false);

    // Filter transactions based on view and priority
    const filteredTransactions = state.transactions.filter(t => {
        // 0a. Month Filter
        if (selectedMonth && t.dueMonth !== selectedMonth) return false;

        // 0b. Year Filter
        if (selectedYear && !t.dueMonth.includes(selectedYear)) return false;

        if (view === 'Tunggakan') {
            return !!t.isArrear && (isPriorityView ? !!t.isPriority : true);
        }

        // For All, Gaji, Remon -> Exclude Arrears
        if (t.isArrear) return false;

        // Priority Filter
        if (isPriorityView && !t.isPriority) return false;

        return view === 'All' ? true : t.category === view;
    });

    const summary = calculateFinancialSummary(filteredTransactions);

    const activeMonth = selectedMonth
        ? selectedMonth
        : selectedYear
            ? `Tahun ${selectedYear}`
            : (view === 'Gaji' ? state.config.activeMonthGaji
                : view === 'Remon' ? state.config.activeMonthRemon
                    : view === 'Tunggakan' ? 'Semua Periode'
                        : `${state.config.activeMonthGaji} & ${state.config.activeMonthRemon}`);

    const cards = [
        {
            title: view === 'Tunggakan' ? 'Total Tunggakan Awal' : 'Total Modal Keluar',
            value: summary.totalModal,
            icon: <Wallet className="text-blue-400" size={24} />,
            color: 'bg-blue-500/10 border-blue-500/20',
            textColor: 'text-blue-400',
            glowColor: 'shadow-blue-500/5'
        },
        {
            title: view === 'Tunggakan' ? 'Sisa Tunggakan' : 'Tagihan Masuk (Outstanding)',
            value: summary.outstanding,
            icon: <ArrowDownRight className="text-amber-400" size={24} />,
            color: 'bg-amber-500/10 border-amber-500/20',
            textColor: 'text-amber-400',
            glowColor: 'shadow-amber-500/5'
        },
        {
            title: view === 'Tunggakan' ? 'Target Pengembalian' : 'Proyeksi Profit',
            value: summary.profitProjection, // For arrears, profit might be 0 unless interest added. Logic handles totalDue - totalPrincipal.
            icon: <TrendingUp className="text-emerald-400" size={24} />,
            color: 'bg-emerald-500/10 border-emerald-500/20',
            textColor: 'text-emerald-400',
            glowColor: 'shadow-emerald-500/5'
        },
        {
            title: 'Total Terbayar',
            value: summary.totalPaid,
            icon: <PiggyBank className="text-purple-400" size={24} />,
            color: 'bg-purple-500/10 border-purple-500/20',
            textColor: 'text-purple-400',
            glowColor: 'shadow-purple-500/5'
        }
    ];

    // Calculate payment progress
    const paymentProgress = summary.totalPiutang > 0
        ? Math.min((summary.totalPaid / summary.totalPiutang) * 100, 100)
        : 0;

    return (
        <div className="space-y-6 mb-8">
            {/* View Selector Tabs */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Category Filter Tabs - Responsive Layout */}
                <div className="bg-slate-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm w-full sm:w-auto">
                    <div className="grid grid-cols-4 gap-1 w-full sm:flex sm:w-auto">
                        <button
                            onClick={() => setView('All')}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-300 sm:min-w-[100px] ${view === 'All'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <PieChart size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="truncate">Gabungan</span>
                        </button>
                        <button
                            onClick={() => setView('Gaji')}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-300 sm:min-w-[100px] ${view === 'Gaji'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="truncate">Gaji</span>
                        </button>
                        <button
                            onClick={() => setView('Remon')}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-300 sm:min-w-[100px] ${view === 'Remon'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <Briefcase size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="truncate">Remon</span>
                        </button>
                        <button
                            onClick={() => setView('Tunggakan')}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-300 sm:min-w-[100px] ${view === 'Tunggakan'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="truncate">Tunggakan</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setIsPriorityView(!isPriorityView)}
                    className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl border transition-all text-sm font-bold w-full sm:w-auto justify-center ${isPriorityView
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-amber-500/30 hover:text-amber-400'
                        }`}
                >
                    <Star size={16} className={isPriorityView ? 'fill-amber-400' : ''} />
                    {isPriorityView ? 'Prioritas Mode' : 'Mode Prioritas'}
                </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar size={16} />
                <span>Periode: <b className="text-white">{activeMonth}</b></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`card-glass p-5 border ${card.color} card-hover shadow-lg ${card.glowColor}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                                <h4 className={`text-2xl font-bold ${card.textColor}`}>
                                    <AnimatedNumber
                                        value={card.value}
                                        formatter={(v) => formatCurrency(v)}
                                    />
                                </h4>
                            </div>
                            <div className={`p-2 rounded-lg ${card.color}`}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Progress Bar */}
            {summary.totalPiutang > 0 && (
                <div className="card-glass p-4 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400 font-medium">Progress Pelunasan ({view === 'All' ? 'Gabungan' : view})</span>
                        <span className="text-sm font-bold text-emerald-400">
                            {paymentProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${paymentProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>Terbayar: {formatCurrency(summary.totalPaid)}</span>
                        <span>Target: {formatCurrency(summary.totalPiutang)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
