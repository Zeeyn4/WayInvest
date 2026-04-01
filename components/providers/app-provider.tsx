'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

type ToastData = { msg: string; icon: string } | null

interface AppContextType {
  activeModal: string | null
  openModal: (id: string) => void
  closeModal: (id?: string) => void
  toast: ToastData
  showToast: (msg: string, icon?: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openModal = useCallback((id: string) => setActiveModal(id), [])
  const closeModal = useCallback(() => setActiveModal(null), [])

  const showToast = useCallback((msg: string, icon = '✓') => {
    setToast({ msg, icon })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return (
    <AppContext.Provider value={{ activeModal, openModal, closeModal, toast, showToast }}>
      {children}
    </AppContext.Provider>
  )
}
