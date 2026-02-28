import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

// Default credentials if not set in localStorage
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123';

const STORAGE_KEY_CREDS = 'wp-admin-credentials';
const STORAGE_KEY_SESSION = 'wp-auth-session';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    updateCredentials: (oldPw: string, newUsername: string, newPw?: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: () => ({ success: false }),
    logout: () => { },
    updateCredentials: () => ({ success: false, error: 'Not implemented' })
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load credentials from localStorage
    const getCredentials = () => {
        const saved = localStorage.getItem(STORAGE_KEY_CREDS);
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD, role: 'admin' };
    };

    // Load session from sessionStorage (cleared on tab close)
    useEffect(() => {
        // Migration: If they had old localStorage session, maybe clear it or migrate to session
        localStorage.removeItem('wp-auth-session'); // Force remove old local storage session

        const savedSession = sessionStorage.getItem(STORAGE_KEY_SESSION);
        if (savedSession) {
            try {
                setUser(JSON.parse(savedSession));
            } catch {
                sessionStorage.removeItem(STORAGE_KEY_SESSION);
            }
        }
    }, []);

    const login = useCallback((username: string, password: string) => {
        const creds = getCredentials();

        if (creds.username === username && creds.password === password) {
            const userData: User = { username: creds.username, role: creds.role as 'admin' };
            setUser(userData);
            sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userData));
            return { success: true };
        }

        return { success: false, error: 'Username atau password salah' };
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
    }, []);

    const updateCredentials = useCallback((oldPw: string, newUsername: string, newPw?: string) => {
        const creds = getCredentials();
        if (creds.password !== oldPw) {
            return { success: false, error: 'Password lama salah!' };
        }

        const newCreds = {
            ...creds,
            username: newUsername || creds.username,
            password: newPw || creds.password
        };
        localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(newCreds));

        // Update current session if they changed username
        if (user && newUsername && newUsername !== user.username) {
            const updatedUser = { ...user, username: newUsername };
            setUser(updatedUser);
            sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedUser));
        }

        return { success: true };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateCredentials }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
