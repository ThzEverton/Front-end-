'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/context/userContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, senha)
    } catch {
      // toast já exibido pelo context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-sans text-3xl font-bold text-primary">
            Sala Rosa
          </Link>
          <p className="text-muted-foreground mt-2 font-body text-sm">
            Bem-vinda de volta!
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="font-sans text-2xl font-bold text-card-foreground mb-6">
            Entrar na sua conta
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring pr-10 font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 font-body"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-primary hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
