import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

// Demo credentials
const DEMO_ACCOUNTS = [
    { username: 'admin', password: 'admin123', role: 'admin' as const }
];

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: () => ({ success: false }),
    logout: () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load session from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('wp-auth-session');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch {
                localStorage.removeItem('wp-auth-session');
            }
        }
    }, []);

    const login = useCallback((username: string, password: string) => {
        const account = DEMO_ACCOUNTS.find(
            (a) => a.username === username && a.password === password
        );

        if (account) {
            const userData: User = { username: account.username, role: account.role };
            setUser(userData);
            localStorage.setItem('wp-auth-session', JSON.stringify(userData));
            return { success: true };
        }

        return { success: false, error: 'Username atau password salah' };
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('wp-auth-session');
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
