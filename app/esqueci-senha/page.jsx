'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/utils/apiClient'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.post('/autenticacao/esqueci-senha', { email })
      setEnviado(true)
      toast.success('Se o e-mail estiver cadastrado, enviaremos as instruções.')
    } catch {
      // toast exibido pelo apiClient
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-sans text-3xl font-bold text-primary">
            Sala Rosa
          </Link>
          <p className="text-muted-foreground mt-2 font-body text-sm">
            Recuperação de acesso
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail size={20} />
          </div>

          <h1 className="font-sans text-2xl font-bold text-card-foreground mb-2">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Informe o e-mail cadastrado para receber o link de redefinição.
          </p>

          {enviado ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground font-body">
              Verifique sua caixa de entrada e também a pasta de spam. O link expira em alguns minutos.
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 font-body"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium font-body"
          >
            <ArrowLeft size={16} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
