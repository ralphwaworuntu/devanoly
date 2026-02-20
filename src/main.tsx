import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppProvider } from './context/AppContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import ToastContainer from './components/Toast.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ToastProvider>
            <AuthProvider>
                <AppProvider>
                    <App />
                    <ToastContainer />
                </AppProvider>
            </AuthProvider>
        </ToastProvider>
    </React.StrictMode>,
)
