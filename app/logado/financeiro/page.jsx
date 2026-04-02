'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate, statusPagamentoLabel, exportCSV } from '@/utils/helpers'
import { Loader2, Download, Wallet, X } from 'lucide-react'

/**
 * Financeiro
 * TODO: Confirme o endpoint de financeiro com seu backend.
 * Atualmente assumindo GET /financeiro e PATCH /financeiro/:id para atualizar status.
 * Ajuste se necessário.
 */

export default function FinanceiroPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')

  async function fetchFinanceiro() {
    setLoading(true)
    try {
      let url = '/financeiro'
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroInicio) params.set('inicio', filtroInicio)
      if (filtroFim) params.set('fim', filtroFim)
      if (params.toString()) url += `?${params.toString()}`
      const data = await apiClient.get(url)
      setRegistros(Array.isArray(data) ? data : data?.registros || data?.data || [])
    } catch {
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }
function erroApi(error, fallback) {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  )
}
  useEffect(() => {
    fetchFinanceiro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroInicio, filtroFim])

  // RN23: relatórios apenas com pagamentos pagos
  const pagos = registros.filter((r) => r?.status === 'PAGO')
  const totalPago = pagos.reduce((acc, r) => acc + Number(r?.valor || 0), 0)
  const totalPendente = registros
    .filter((r) => r?.status === 'PENDENTE')
    .reduce((acc, r) => acc + Number(r?.valor || 0), 0)

  async function marcarPago(id) {
    try {
      await apiClient.patch(`/financeiro/${id}`, { status: 'PAGO' })
      fetchFinanceiro()
    } catch {}
  }

  function handleExportCSV() {
    if (pagos.length === 0) {
      return
    }
    exportCSV(
      pagos.map((r) => ({
        Data: formatDate(r?.data || r?.createdAt),
        Descricao: r?.descricao || r?.referencia || '-',
        Valor: r?.valor,
        Forma: r?.formaPagamento || '-',
        Status: r?.status,
      })),
      'financeiro_sala_rosa.csv'
    )
  }

  function formaBadge(forma) {
    const map = {
      dinheiro: 'bg-green-100 text-green-700',
      cartao: 'bg-blue-100 text-blue-700',
      pix: 'bg-purple-100 text-purple-700',
    }
    return `text-xs px-2 py-0.5 rounded-full font-body ${map[forma?.toLowerCase()] || 'bg-muted text-muted-foreground'}`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Pagamentos e receitas da Sala Rosa
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-body mb-1">
            Total pago
          </p>
          <p className="font-sans text-2xl font-bold text-primary">
            {formatCurrency(totalPago)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{pagos.length} registro(s)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-body mb-1">
            Total pendente
          </p>
          <p className="font-sans text-2xl font-bold text-foreground">
            {formatCurrency(totalPendente)}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {registros.filter((r) => r?.status === 'PENDENTE').length} registro(s)
          </p>
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
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
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
        {(filtroStatus || filtroInicio || filtroFim) && (
          <button
            onClick={() => { setFiltroStatus(''); setFiltroInicio(''); setFiltroFim('') }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-body"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

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
                  <th className="px-4 py-3 font-medium">Forma</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={r?.id || i} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(r?.data || r?.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {r?.descricao || r?.referencia || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {r?.formaPagamento ? (
                        <span className={formaBadge(r.formaPagamento)}>
                          {r.formaPagamento}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatCurrency(r?.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-body ${
                          r?.status === 'PAGO'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {statusPagamentoLabel(r?.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r?.status === 'PENDENTE' && (
                        <button
                          onClick={() => marcarPago(r.id)}
                          className="text-xs text-primary hover:underline font-body"
                        >
                          Marcar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
