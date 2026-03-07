'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, Plus, X, Package } from 'lucide-react'

/**
 * Estoque
 * GET /produtos, POST /produtos, PUT /produtos/:id
 * TODO: Confirme os endpoints de movimentações com seu backend.
 * Atualmente assumindo POST /estoque/movimentacoes (entrada, saída, ajuste).
 * Ajuste se necessário.
 */

function MovimentacaoModal({ produto, onClose, onSalvo }) {
  const [tipo, setTipo] = useState('entrada')
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    // RN18: estoque não pode ficar negativo em saída
    if (tipo === 'saida') {
      const atual = Number(produto?.estoqueAtual ?? produto?.estoque_atual ?? 0)
      if (quantidade > atual) {
        toast.error(`Estoque insuficiente. Disponível: ${atual}`)
        return
      }
    }
    setLoading(true)
    try {
      // TODO: confirme o endpoint real de movimentações com seu backend
      await apiClient.post('/estoque/movimentacoes', {
        produtoId: produto.id,
        tipo,
        quantidade: Number(quantidade),
        observacao,
      })
      toast.success('Movimentação registrada!')
      onSalvo()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Movimentação — {produto?.nome}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Quantidade</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min={1}
              required
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da movimentação"
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProdutoModal({ produto, onClose, onSalvo }) {
  const isEdit = !!produto?.id
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    preco: produto?.preco || produto?.valor || '',
    estoqueAtual: produto?.estoqueAtual ?? produto?.estoque_atual ?? '',
    estoqueMinimo: produto?.estoqueMinimo ?? produto?.estoque_minimo ?? '',
    descricao: produto?.descricao || '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await apiClient.put(`/produtos/${produto.id}`, form)
        toast.success('Produto atualizado!')
      } else {
        await apiClient.post('/produtos', form)
        toast.success('Produto cadastrado!')
      }
      onSalvo()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} required
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Preço</label>
              <input name="preco" type="number" step="0.01" value={form.preco} onChange={handleChange} required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
            </div>
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Estoque atual</label>
              <input name="estoqueAtual" type="number" value={form.estoqueAtual} onChange={handleChange} required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
            </div>
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Estoque mínimo</label>
              <input name="estoqueMinimo" type="number" value={form.estoqueMinimo} onChange={handleChange}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
            </div>
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Descrição</label>
              <input name="descricao" value={form.descricao} onChange={handleChange}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [movModal, setMovModal] = useState(null)
  const [prodModal, setProdModal] = useState(null) // null = fechado, {} = novo, {...} = editar

  async function fetchProdutos() {
    setLoading(true)
    try {
      const data = await apiClient.get('/produtos')
      setProdutos(Array.isArray(data) ? data : data?.produtos || [])
    } catch {
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  function situacao(produto) {
    const atual = Number(produto?.estoqueAtual ?? produto?.estoque_atual ?? 0)
    const minimo = Number(produto?.estoqueMinimo ?? produto?.estoque_minimo ?? 0)
    if (atual <= 0) return { label: 'Esgotado', cls: 'bg-destructive/10 text-destructive' }
    if (atual <= minimo) return { label: 'Crítico', cls: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Normal', cls: 'bg-green-100 text-green-700' }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Controle de produtos e movimentações
          </p>
        </div>
        <button
          onClick={() => setProdModal({})}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-body hover:opacity-90"
        >
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Alerta de estoque crítico */}
      {produtos.filter((p) => situacao(p).label !== 'Normal').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700 font-body">
            {produtos.filter((p) => situacao(p).label !== 'Normal').length} produto(s) com estoque abaixo do mínimo.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Package size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium text-center">Atual</th>
                  <th className="px-4 py-3 font-medium text-center">Mínimo</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 font-medium text-right">Preço</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => {
                  const sit = situacao(p)
                  return (
                    <tr key={p?.id || i} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3 text-center">
                        {p?.estoqueAtual ?? p?.estoque_atual ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {p?.estoqueMinimo ?? p?.estoque_minimo ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sit.cls}`}>
                          {sit.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-primary font-medium">
                        {formatCurrency(p?.preco || p?.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setMovModal(p)}
                            className="text-xs text-primary hover:underline font-body"
                          >
                            Movimentar
                          </button>
                          <button
                            onClick={() => setProdModal(p)}
                            className="text-xs text-muted-foreground hover:text-primary hover:underline font-body"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {movModal && (
        <MovimentacaoModal
          produto={movModal}
          onClose={() => setMovModal(null)}
          onSalvo={fetchProdutos}
        />
      )}

      {prodModal !== null && (
        <ProdutoModal
          produto={prodModal?.id ? prodModal : null}
          onClose={() => setProdModal(null)}
          onSalvo={fetchProdutos}
        />
      )}
    </div>
  )
}
