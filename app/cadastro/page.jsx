'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import apiClient from '@/utils/apiClient'

/**
 * Cadastro de cliente.
 * TODO: Confirme o endpoint correto para criação de usuário na sua API.
 * Atualmente usando POST /users conforme documentação.
 * Se o endpoint for diferente, ajuste abaixo.
 */
export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    interesseConsultora: false,
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.senha !== form.confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      // TODO: confirme os campos esperados pelo seu backend para criação de usuário
      await apiClient.post('/users', {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
        perfil: 'cliente',
        // Se tiver interesse em ser consultora, pode enviar flag ou tratar separado
        // interesseConsultora: form.interesseConsultora,
      })
      toast.success('Cadastro realizado! Faça login para acessar.')
      router.push('/login')
    } catch {
      // toast já exibido pelo apiClient
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-sans text-3xl font-bold text-primary">
            Sala Rosa
          </Link>
          <p className="text-muted-foreground mt-2 font-body text-sm">
            Crie sua conta e comece a se cuidar
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="font-sans text-2xl font-bold text-card-foreground mb-6">
            Criar conta
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Nome completo
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Maria Silva"
                required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(00) 90000-0000"
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Senha
              </label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Confirmar senha
              </label>
              <input
                type="password"
                name="confirmarSenha"
                value={form.confirmarSenha}
                onChange={handleChange}
                placeholder="Repita a senha"
                required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="interesseConsultora"
                checked={form.interesseConsultora}
                onChange={handleChange}
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm text-muted-foreground font-body leading-relaxed">
                Tenho interesse em me tornar uma consultora da Sala Rosa
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 font-body"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Cadastrando...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
