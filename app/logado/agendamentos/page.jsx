'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import {
  formatDate,
  formatTime,
  statusAgendamentoLabel,
  podeCancelarRemarcar,
  todayISO,
} from '@/utils/helpers'
import { toast } from 'sonner'
import { Loader2, RefreshCw, XCircle, Filter, X } from 'lucide-react'

/**
 * TODO: Confirme os endpoints de agendamentos com seu backend.
 * Atualmente assumindo:
 *   GET /agendamentos          — lista (aceita ?data=, ?status=, ?tipo=)
 *   GET /agendamentos/:id
 *   PATCH /agendamentos/:id    — remarcar / cancelar
 */

function DetalheModal({ agendamento, onClose, onRemarcar, onCancelar }) {
  const [novaData, setNovaData] = useState('')
  const [novoHorario, setNovoHorario] = useState('')
  const [loadingRe, setLoadingRe] = useState(false)
  const [loadingCan, setLoadingCan] = useState(false)
  const podeAlterar = podeCancelarRemarcar(agendamento?.dataHora || agendamento?.horario)

  async function handleRemarcar(e) {
    e.preventDefault()
    if (!novaData || !novoHorario) {
      toast.error('Informe nova data e horário.')
      return
    }
    setLoadingRe(true)
    try {
      await onRemarcar(agendamento.id, { novaData, novoHorario })
      onClose()
    } finally {
      setLoadingRe(false)
    }
  }

  async function handleCancelar() {
    setLoadingCan(true)
    try {
      await onCancelar(agendamento.id)
      onClose()
    } finally {
      setLoadingCan(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Detalhes do Agendamento
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm font-body mb-4">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Cliente
            </span>
            <span>{agendamento?.cliente?.nome || agendamento?.clienteNome || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Serviço
            </span>
            <span>{agendamento?.servico?.nome || agendamento?.servicoNome || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Data
            </span>
            <span>{formatDate(agendamento?.dataHora || agendamento?.data)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Horário
            </span>
            <span>{formatTime(agendamento?.dataHora || agendamento?.horario)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Tipo
            </span>
            <span className="capitalize">{agendamento?.tipo || 'individual'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Status
            </span>
            <span>{statusAgendamentoLabel(agendamento?.status)}</span>
          </div>
        </div>

        {!podeAlterar && agendamento?.status !== 'CANCELADO' && (
          <p className="text-xs text-destructive font-body bg-destructive/10 rounded-lg px-3 py-2 mb-4">
            Prazo de cancelamento/remarcação expirado (D-2).
          </p>
        )}

        {podeAlterar && agendamento?.status !== 'CANCELADO' && agendamento?.status !== 'CONCLUIDO' && (
          <>
            <form onSubmit={handleRemarcar} className="flex flex-col gap-3 mb-4">
              <p className="text-sm font-medium font-body">Remarcar para:</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  min={todayISO()}
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
                <input
                  type="time"
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <button
                type="submit"
                disabled={loadingRe}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loadingRe && <Loader2 size={14} className="animate-spin" />}
                <RefreshCw size={14} /> Remarcar
              </button>
            </form>
            <button
              onClick={handleCancelar}
              disabled={loadingCan}
              className="w-full border border-destructive text-destructive py-2 rounded-lg text-sm font-body hover:bg-destructive/10 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loadingCan && <Loader2 size={14} className="animate-spin" />}
              <XCircle size={14} /> Cancelar agendamento
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AgendamentosPage() {
  const { isGerente } = useUser()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)

  // Filtros
  const [filtroData, setFiltroData] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  async function fetchAgendamentos() {
    setLoading(true)
    try {
      let url = '/agendamentos'
      const params = new URLSearchParams()
      if (filtroData) params.set('data', filtroData)
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (params.toString()) url += `?${params.toString()}`

      const data = await apiClient.get(url)
      setAgendamentos(Array.isArray(data) ? data : data?.agendamentos || data?.data || [])
    } catch {
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroData, filtroStatus, filtroTipo])

  async function handleRemarcar(id, { novaData, novoHorario }) {
    await apiClient.patch(`/agendamentos/${id}`, {
      status: 'REMARCADO',
      novaData,
      novoHorario,
    })
    toast.success('Agendamento remarcado!')
    fetchAgendamentos()
  }

  async function handleCancelar(id) {
    await apiClient.patch(`/agendamentos/${id}`, { status: 'CANCELADO' })
    toast.success('Agendamento cancelado.')
    fetchAgendamentos()
  }

  function statusBadge(status) {
    const map = {
      AGENDADO: 'bg-accent text-primary',
      CONCLUIDO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-destructive/10 text-destructive',
      REMARCADO: 'bg-yellow-100 text-yellow-700',
    }
    return `text-xs px-2 py-0.5 rounded-full font-body ${map[status] || 'bg-muted text-muted-foreground'}`
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold text-foreground">Agendamentos</h1>
        <p className="text-muted-foreground font-body mt-1 text-sm">
          Gerencie todos os agendamentos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Data</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          >
            <option value="">Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="REMARCADO">Remarcado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          >
            <option value="">Todos</option>
            <option value="individual">Individual</option>
            <option value="turma">Turma</option>
          </select>
        </div>
        {(filtroData || filtroStatus || filtroTipo) && (
          <button
            onClick={() => {
              setFiltroData('')
              setFiltroStatus('')
              setFiltroTipo('')
            }}
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
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground font-body">Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium">Data/Hora</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((a, i) => (
                  <tr
                    key={a?.id || i}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {a?.cliente?.nome || a?.clienteNome || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {a?.servico?.nome || a?.servicoNome || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a?.dataHora || a?.data)}{' '}
                      {formatTime(a?.dataHora || a?.horario)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {a?.tipo || 'individual'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(a?.status)}>
                        {statusAgendamentoLabel(a?.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelecionado(a)}
                        className="text-primary hover:underline text-xs font-body"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selecionado && (
        <DetalheModal
          agendamento={selecionado}
          onClose={() => setSelecionado(null)}
          onRemarcar={handleRemarcar}
          onCancelar={handleCancelar}
        />
      )}
    </div>
  )
}
