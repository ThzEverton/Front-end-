'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/userContext'
import Sidebar from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'

export default function LogadoLayout({ children }) {
  const { isAuthenticated, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-body">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Offset para sidebar desktop */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Mobile top spacing */}
        <div className="md:hidden h-14" />
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
