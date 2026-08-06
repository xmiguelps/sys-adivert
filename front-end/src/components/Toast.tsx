import { useState, useEffect } from 'react'

type ToastItem = { id: number; message: string; type: 'success' | 'error' | 'info'; exiting: boolean }

let _addToast: ((message: string, type?: ToastItem['type']) => void) | null = null

export function showToast(message: string, type: ToastItem['type'] = 'success') {
    _addToast?.(message, type)
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    useEffect(() => {
        _addToast = (message, type = 'success') => {
            const id = Date.now() + Math.random()
            setToasts(prev => [...prev, { id, message, type, exiting: false }])

            setTimeout(() => {
                setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id))
                }, 420)
            }, 3000)
        }
        return () => { _addToast = null }
    }, [])

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`toast toast--${t.type} ${t.exiting ? 'toast--exit' : 'toast--enter'}`}
                >
                    <span className="toast-icon">
                        {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    )
}
