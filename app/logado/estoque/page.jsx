'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2,
  AlertTriangle,
  X,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
} from 'lucide-react'

function getDataHoje() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function MovimentacaoModal({ produto, onClose, onSalvo }) {
  const [tipo, setTipo] = useState('entrada')
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    const qtd = Number(quantidade)
    const atual = Number(produto?.estoqueAtual ?? produto?.estoque_atual ?? 0)

    if (!qtd || qtd <= 0) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    if (tipo === 'saida' && qtd > atual) {
      toast.error(`Estoque insuficiente. Disponível: ${atual}`)
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/estoque', {
        produtoId: produto.id,
        tipo,
        quantidade: qtd,
        dataRef: getDataHoje(),
        observacao,
      })

      toast.success('Movimentação registrada com sucesso!')
      onSalvo()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar movimentação.')
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

export default function EstoquePage() {
  const [aba, setAba] = useState('produtos')
  const [produtos, setProdutos] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(true)
  const [movModal, setMovModal] = useState(null)

  async function fetchProdutos() {
    setLoadingProdutos(true)
    try {
      const data = await apiClient.get('/produtos')
      setProdutos(Array.isArray(data) ? data : data?.produtos || [])
    } catch (error) {
      console.error(error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  async function fetchMovimentacoes() {
    setLoadingMovimentacoes(true)
    try {
      const data = await apiClient.get('/estoque')
      setMovimentacoes(Array.isArray(data) ? data : data?.movimentacoes || [])
    } catch (error) {
      console.error(error)
      setMovimentacoes([])
    } finally {
      setLoadingMovimentacoes(false)
    }
  }

  async function atualizarTudo() {
    await Promise.all([fetchProdutos(), fetchMovimentacoes()])
  }

  useEffect(() => {
    atualizarTudo()
  }, [])

  function situacao(produto) {
    const atual = Number(produto?.estoqueAtual ?? produto?.estoque_atual ?? 0)
    const minimo = Number(produto?.estoqueMinimo ?? produto?.estoque_minimo ?? 0)

    if (atual <= 0) {
      return { label: 'Esgotado', cls: 'bg-destructive/10 text-destructive' }
    }

    if (atual <= minimo) {
      return { label: 'Crítico', cls: 'bg-yellow-100 text-yellow-700' }
    }

    return { label: 'Normal', cls: 'bg-green-100 text-green-700' }
  }

  function tipoMovimentacaoLabel(tipo) {
    if (tipo === 'entrada') return 'Entrada'
    if (tipo === 'saida') return 'Saída'
    if (tipo === 'ajuste') return 'Ajuste'
    return tipo
  }

  function tipoMovimentacaoClasse(tipo) {
    if (tipo === 'entrada') return 'bg-green-100 text-green-700'
    if (tipo === 'saida') return 'bg-red-100 text-red-700'
    if (tipo === 'ajuste') return 'bg-blue-100 text-blue-700'
    return 'bg-muted text-muted-foreground'
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
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setAba('produtos')}
          className={`px-4 py-2 text-sm font-body border-b-2 transition-colors ${aba === 'produtos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Produtos em estoque
        </button>

        <button
          onClick={() => setAba('movimentacoes')}
          className={`px-4 py-2 text-sm font-body border-b-2 transition-colors ${aba === 'movimentacoes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Movimentações
        </button>
      </div>

      {aba === 'produtos' && (
        <>
          {produtos.filter((p) => situacao(p).label !== 'Normal').length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700 font-body">
                {produtos.filter((p) => situacao(p).label !== 'Normal').length} produto(s) com estoque abaixo do mínimo.
              </p>
            </div>
          )}

          {loadingProdutos ? (
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
                      <th className="px-4 py-3 font-medium">Preço</th>
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

                          <td className="px-4 py-3 text-primary font-medium">
                            {formatCurrency(
                              p?.precoVenda ??
                              p?.preco_venda ??
                              p?.preco ??
                              p?.valor ??
                              0
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              onClick={() => setMovModal(p)}
                              className="text-xs text-primary hover:underline font-body"
                            >
                              Movimentar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {aba === 'movimentacoes' && (
        <>
          {loadingMovimentacoes ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : movimentacoes.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <SlidersHorizontal size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-body">Nenhuma movimentação registrada.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-muted/50">
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Produto ID</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium text-center">Quantidade</th>
                      <th className="px-4 py-3 font-medium">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.map((m, i) => (
                      <tr key={m?.id || i} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3">
                          {m?.dataRef ? formatDate(m.dataRef) : '-'}
                        </td>

                        <td className="px-4 py-3">
                          {m?.produto?.nome || '-'}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tipoMovimentacaoClasse(m?.tipo)}`}>
                            {tipoMovimentacaoLabel(m?.tipo)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {m?.quantidade ?? 0}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {m?.observacao || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {movModal && (
        <MovimentacaoModal
          produto={movModal}
          onClose={() => setMovModal(null)}
          onSalvo={atualizarTudo}
        />
      )}
    </div>
  )
}