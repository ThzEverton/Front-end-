'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/userContext'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/logado/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logado/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/logado/agendamentos', label: 'Agendamentos', icon: ClipboardList },
  { href: '/logado/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/logado/estoque', label: 'Estoque', icon: Package },
  { href: '/logado/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/logado/cadastros', label: 'Cadastros', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/logado/dashboard" className="font-sans text-xl font-bold text-primary">
          Sala Rosa
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium font-body transition-colors ${
                active
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm font-body">
              {user?.nome?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate font-body">
              {user?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate font-body capitalize">
              {user?.isConsultora ? 'Consultora' : user?.perfil || 'cliente'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-body"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border h-14 flex items-center px-4 gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-sans text-lg font-bold text-primary">Sala Rosa</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full">
            <SidebarContent />
          </div>
          <button
            className="absolute top-4 left-[17rem] text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </>
  )
}
