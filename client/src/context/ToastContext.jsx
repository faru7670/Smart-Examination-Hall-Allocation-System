import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

let id = 0
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const add = useCallback((message, type = 'success') => {
        const tid = ++id
        setToasts(t => [...t, { id: tid, message, type }])
        setTimeout(() => setToasts(t => t.filter(x => x.id !== tid)), 3500)
    }, [])

    const toast = {
        success: (m) => add(m, 'success'),
        error: (m) => add(m, 'error'),
        warning: (m) => add(m, 'warning'),
        info: (m) => add(m, 'info'),
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
    const colors = {
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        error: 'border-red-500/40 bg-red-500/10 text-red-300',
        warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        info: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`animate-slide-right flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl pointer-events-auto min-w-[240px] max-w-[360px] ${colors[t.type]}`}>
                        <span className="text-lg flex-shrink-0">{icons[t.type]}</span>
                        <span className="text-sm font-medium">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
