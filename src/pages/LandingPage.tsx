import { useAuth } from '../context/AuthContext';
import { Shield, TrendingUp, Users, Zap, ArrowRight, Lock } from 'lucide-react';

interface LandingPageProps {
    onGoToLogin: () => void;
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
    const { isAuthenticated } = useAuth();

    const features = [
        {
            icon: <TrendingUp size={28} />,
            title: 'Smart Loan Tracking',
            description: 'Kalkulasi bunga otomatis dengan smart merging untuk setiap transaksi pinjaman.',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            icon: <Users size={28} />,
            title: 'Borrower Management',
            description: 'Database lengkap nasabah dengan limit kredit dan status hutang real-time.',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20'
        },
        {
            icon: <Shield size={28} />,
            title: 'Limit Guard System',
            description: 'Proteksi otomatis mencegah pinjaman melebihi limit yang ditentukan.',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <span className="font-bold text-white text-sm">WP</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Web Pinjaman</span>
                </div>
                <button
                    onClick={onGoToLogin}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 text-sm"
                >
                    <Lock size={16} />
                    {isAuthenticated ? 'Dashboard' : 'Login'}
                </button>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
                        <Zap size={14} />
                        Loan Management System v2.0
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        Kelola Pinjaman{' '}
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            Lebih Cerdas
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Sistem manajemen pinjaman yang cepat, aman, dan akurat.
                        Kalkulasi bunga otomatis, tracking real-time, dan laporan yang lengkap.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onGoToLogin}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-xl shadow-blue-500/25 text-base"
                        >
                            Masuk ke Dashboard
                            <ArrowRight size={18} />
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-8 py-3.5 rounded-xl border border-slate-700 transition-all text-base">
                            Lihat Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 md:px-12 py-16 border-t border-slate-800/50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Fitur Utama</h2>
                    <p className="text-slate-400 text-center mb-12">Semua yang Anda butuhkan untuk mengelola pinjaman</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className={`p-6 rounded-2xl border ${feature.bg} backdrop-blur-sm card-hover transition-all`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-slate-800/50 text-center">
                <p className="text-slate-500 text-sm">
                    &copy; 2026 Web Pinjaman. Built with React & TypeScript.
                </p>
            </footer>
        </div>
    );
}
