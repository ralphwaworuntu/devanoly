import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

interface LoginPageProps {
    onBack: () => void;
    onLoginSuccess: () => void;
}

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate loading for UX feel
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = login(username, password);

        if (result.success) {
            showToast('Login berhasil! Selamat datang, Admin 👋', 'success');
            onLoginSuccess();
        } else {
            setError(result.error || 'Login gagal');
            showToast(result.error || 'Login gagal', 'error');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-20 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
            >
                <ArrowLeft size={18} />
                Kembali
            </button>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in duration-500">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 mx-auto mb-4">
                        <ShieldCheck size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Login Admin</h1>
                    <p className="text-slate-400 text-sm mt-1">Masuk ke dashboard pengelolaan</p>
                </div>

                {/* Form Card */}
                <div className="card-glass p-8 border border-slate-700/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                                <User size={14} className="text-slate-500" />
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                placeholder="Masukkan username"
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                                <Lock size={14} className="text-slate-500" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pr-10"
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-sm font-medium animate-in fade-in duration-200">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={16} />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Hint */}
                    <div className="mt-6 pt-5 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 text-center mb-3">Gunakan Akun Demo</p>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('admin');
                                setPassword('admin123');
                                showToast('Kredensial demo berhasil diisi', 'info');
                            }}
                            className="w-full relative overflow-hidden group rounded-lg transition-all hover:ring-2 hover:ring-blue-500/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="bg-slate-800/80 rounded-lg p-3 space-y-1 relative border border-slate-700/50 group-hover:border-blue-500/30 transition-colors">
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300 pointer-events-none">
                                    <span className="text-xs font-bold uppercase tracking-wider">Isi Otomatis</span>
                                    <Zap size={14} className="fill-blue-500" />
                                </div>

                                <div className="flex justify-between text-xs pr-20 relative z-10 transition-transform group-hover:-translate-x-2 duration-300">
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Username</span>
                                    <code className="text-blue-400 font-mono font-bold tracking-tight">admin</code>
                                </div>
                                <div className="flex justify-between text-xs pr-20 relative z-10 transition-transform group-hover:-translate-x-2 duration-300">
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Password</span>
                                    <code className="text-blue-400 font-mono font-bold tracking-tight">admin123</code>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
