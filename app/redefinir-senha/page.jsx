'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/utils/apiClient'

function RedefinirSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!token) {
      toast.error('Link de redefinição inválido.')
      return
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/autenticacao/redefinir-senha', { token, senha })
      toast.success('Senha redefinida com sucesso.')
      router.push('/login')
    } catch {
      // toast exibido pelo apiClient
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LockKeyhole size={20} />
      </div>

      <h1 className="font-sans text-2xl font-bold text-card-foreground mb-2">
        Redefinir senha
      </h1>
      <p className="text-sm text-muted-foreground font-body mb-6">
        Escolha uma nova senha para acessar sua conta.
      </p>

      {!token && (
        <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-body">
          Link inválido ou sem token. Solicite um novo e-mail de recuperação.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
            Nova senha
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
            Confirmar senha
          </label>
          <input
            type={showSenha ? 'text' : 'password'}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a nova senha"
            required
            className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 font-body"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6 font-body">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-sans text-3xl font-bold text-primary">
            Sala Rosa
          </Link>
          <p className="text-muted-foreground mt-2 font-body text-sm">
            Nova senha de acesso
          </p>
        </div>

        <Suspense fallback={null}>
          <RedefinirSenhaContent />
        </Suspense>
      </div>
    </div>
  )
}
