import { LoanTransaction, FinancialSummary } from '../types';

export const calculateTotalDue = (principal: number, interestRate: number): number => {
    return principal + (principal * interestRate / 100);
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const getStatusColor = (status: LoanTransaction['status']) => {
    switch (status) {
        case 'Lunas': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'Cicil': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        default: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
};

export const calculateFinancialSummary = (transactions: LoanTransaction[]): FinancialSummary => {
    return transactions.reduce((acc, curr) => {
        return {
            totalModal: acc.totalModal + curr.totalPrincipal,
            totalPiutang: acc.totalPiutang + curr.totalDue,
            profitProjection: acc.profitProjection + (curr.totalDue - curr.totalPrincipal),
            totalPaid: acc.totalPaid + curr.paidAmount,
            outstanding: acc.outstanding + (curr.totalDue - curr.paidAmount),
            category: 'All'
        };
    }, {
        totalModal: 0,
        totalPiutang: 0,
        profitProjection: 0,
        totalPaid: 0,
        outstanding: 0,
        category: 'All'
    });
};
