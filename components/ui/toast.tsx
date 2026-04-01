'use client'

import { useApp } from '@/components/providers/app-provider'

export function Toast() {
  const { toast } = useApp()

  return (
    <div className={`toast${toast ? ' show' : ''}`}>
      <span className="toast-icon">{toast?.icon || '✓'}</span>
      <span className="toast-msg">{toast?.msg || ''}</span>
    </div>
  )
}
