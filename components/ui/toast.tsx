"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react"

export interface ToastMessage {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  duration?: number
}

type ShowToast = (toast: Omit<ToastMessage, "id">) => void

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  error: <AlertTriangle className="w-5 h-5 text-destructive" />,
  info: <Info className="w-5 h-5 text-link" />,
}

const ICON_BG = {
  success: "bg-green-500/12",
  warning: "bg-yellow-500/15",
  error: "bg-destructive/12",
  info: "bg-link/12",
}

function Toast({ message, onRemove }: { message: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(message.id), message.duration || 1000)
    return () => clearTimeout(timer)
  }, [message.id, message.duration, onRemove])

  return (
    <div
      role={message.type === "error" || message.type === "warning" ? "alert" : "status"}
      className="mb-3 rounded-2xl border-2 bg-background p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] animate-in slide-in-from-right duration-300"
    >
      <div className="flex items-start">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${ICON_BG[message.type]}`}>
          {ICONS[message.type]}
        </div>
        <div className="ml-3 min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-extrabold text-foreground">{message.title}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-muted-foreground break-words">{message.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(message.id)}
          aria-label="Fechar aviso"
          className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg text-label transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const ToastContext = createContext<{ showToast: ShowToast } | null>(null)

/** One toast stack for the whole app (store and admin). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id))
  }, [])

  const showToast = useCallback<ShowToast>((toast) => {
    const id = Math.random().toString(36).slice(2, 11)
    setMessages((prev) => [...prev, { ...toast, id }])
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto z-[60] sm:max-w-sm sm:w-full"
      >
        {messages.map((message) => (
          <Toast key={message.id} message={message} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast deve ser usado dentro de <ToastProvider>")
  return context
}
