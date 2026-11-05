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
  error: <AlertTriangle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const BORDERS = {
  success: "border-l-green-500",
  warning: "border-l-yellow-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
}

function Toast({ message, onRemove }: { message: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(message.id), message.duration || 1000)
    return () => clearTimeout(timer)
  }, [message.id, message.duration, onRemove])

  return (
    <div
      role={message.type === "error" || message.type === "warning" ? "alert" : "status"}
      className={`bg-white border-l-4 ${BORDERS[message.type]} shadow-lg rounded-r-lg p-4 mb-3 animate-in slide-in-from-right duration-300`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{ICONS[message.type]}</div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{message.title}</p>
          <p className="text-sm text-gray-600 mt-1 break-words">{message.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(message.id)}
          aria-label="Fechar aviso"
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
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
