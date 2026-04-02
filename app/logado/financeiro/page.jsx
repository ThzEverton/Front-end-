'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate, exportCSV } from '@/utils/helpers'
import { Loader2, Download, Wallet, X, TrendingUp, ShoppingBag, CalendarCheck } from 'lucide-react'

// status vem em minúsculo do repo: "pago", "pendente", "cancelado", "estornado"
const STATUS_CONFIG = {
  pago:      { label: 'Pago',      cls: 'bg-green-100 text-green-700' },
  pendente:  { label: 'Pendente',  cls: 'bg-yellow-100 text-yellow-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
  estornado: { label: 'Estornado', cls: 'bg-gray-100 text-gray-500' },
}

// formaPagto vem em minúsculo do repo
const FORMA_CONFIG = {
  dinheiro: 'bg-green-100 text-green-700',
  cartao:   'bg-blue-100 text-blue-700',
  pix:      'bg-purple-100 text-purple-700',
}

export default function FinanceiroPage() {
  const [registros, setRegistros] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')

  async function fetchFinanceiro() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroInicio) params.set('inicio', filtroInicio)
      if (filtroFim) params.set('fim', filtroFim)

      const url = `/financeiro${params.toString() ? `?${params}` : ''}`
      const data = await apiClient.get(url)

      setRegistros(data?.registros || [])
      setResumo(data?.resumo || null)
    } catch {
      setRegistros([])
      setResumo(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceiro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroInicio, filtroFim])

  async function marcarPago(id) {
    try {
      await apiClient.patch(`/financeiro/${id}`, { status: 'pago' })
      fetchFinanceiro()
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Erro ao atualizar status.'
      alert(msg)
    }
  }

  function handleExportCSV() {
    const pagos = registros.filter((r) => r?.status === 'pago')
    if (pagos.length === 0) return
    exportCSV(
      pagos.map((r) => ({
        Data:      formatDate(r?.dataRef),
        Descricao: r?.descricao || '-',
        Tipo:      'RECEITA',
        Forma:     r?.formaPagto || '-',
        Valor:     r?.valor,
        Status:    r?.status,
      })),
      'financeiro_sala_rosa.csv'
    )
  }

  const temFiltro = filtroStatus || filtroInicio || filtroFim

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Receitas de vendas e atendimentos da Sala Rosa
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors"
        >
          <Download size={16} /> Exportar CSV (pagos)
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-body">Total recebido</p>
          </div>
          <p className="font-sans text-2xl font-bold text-primary">
            {formatCurrency(resumo?.totalPago ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {registros.filter((r) => r?.status === 'pago').length} registro(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-yellow-500" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-body">A receber</p>
          </div>
          <p className="font-sans text-2xl font-bold text-foreground">
            {formatCurrency(resumo?.totalPendente ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {registros.filter((r) => r?.status === 'pendente').length} pendente(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={14} className="text-blue-500" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-body">De vendas</p>
          </div>
          <p className="font-sans text-2xl font-bold text-foreground">
            {formatCurrency(resumo?.totalVendas ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">pagos</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck size={14} className="text-purple-500" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-body">De atendimentos</p>
          </div>
          <p className="font-sans text-2xl font-bold text-foreground">
            {formatCurrency(resumo?.totalAtendimentos ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">pagos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          >
            <option value="">Todos</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="cancelado">Cancelado</option>
            <option value="estornado">Estornado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">De</label>
          <input
            type="date"
            value={filtroInicio}
            onChange={(e) => setFiltroInicio(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Até</label>
          <input
            type="date"
            value={filtroFim}
            onChange={(e) => setFiltroFim(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>
        {temFiltro && (
          <button
            onClick={() => { setFiltroStatus(''); setFiltroInicio(''); setFiltroFim('') }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-body"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Wallet size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhum registro financeiro encontrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Forma</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => {
                  const statusCfg = STATUS_CONFIG[r?.status] ?? { label: r?.status, cls: 'bg-muted text-muted-foreground' }
                  const formaCls  = FORMA_CONFIG[r?.formaPagto?.toLowerCase()] ?? 'bg-muted text-muted-foreground'

                  return (
                    <tr key={r?.id || i} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(r?.dataRef)}
                      </td>
                      <td className="px-4 py-3">
                        {r?.descricao || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-body">
                          RECEITA
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r?.formaPagto ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-body ${formaCls}`}>
                            {r.formaPagto}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary whitespace-nowrap">
                        {formatCurrency(r?.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r?.status === 'pendente' && (
                          <button
                            onClick={() => marcarPago(r.id)}
                            className="text-xs text-primary hover:underline font-body"
                          >
                            Marcar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}