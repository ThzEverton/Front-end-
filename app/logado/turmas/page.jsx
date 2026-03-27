'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { useUser } from '@/context/userContext'
import { formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2,
  Users,
  CalendarDays,
  X,
  Check,
  Ban,
  Copy,
} from 'lucide-react'

// ── Modal: detalhes da turma ────────────────────────────────────────────────
function DetalhesTurmaModal({ turmaId, onClose, isGerente, onAtualizar }) {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState(null)

  async function fetchDetalhes() {
    setLoading(true)
    try {
      const data = await apiClient.get(`/turmas/${turmaId}`)
      setDados(data)
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao buscar detalhes da turma.')
      setDados(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (turmaId) {
      fetchDetalhes()
    }
  }, [turmaId])

  async function handleRemover(userId) {
    try {
      await apiClient.delete(`/turmas/${turmaId}/participantes/${userId}`)
      toast.success('Participante removido!')
      await fetchDetalhes()
      await onAtualizar()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao remover participante.')
    }
  }

  const turma = dados?.turma
  const participantes = dados?.participantes || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-fade-in max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Detalhes da turma
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : !turma ? (
          <div className="text-center py-8 text-muted-foreground font-body">
            Turma não encontrada.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-card-foreground">
                    {turma?.servico?.nome || 'Serviço'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {turma?.data?.slice(8, 10)}/{turma?.data?.slice(5, 7)}/{turma?.data?.slice(0, 4)} ·{' '}
                    {turma?.horaInicio?.slice(0, 5)} às {turma?.horaFim?.slice(0, 5)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status: <span className="font-medium">{turma?.status}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Capacidade: {turma?.qtdParticipantes ?? 0}/{turma?.capacidadeMaxima ?? 5}
                  </p>
                </div>

                {turma?.codigoConvite && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground font-body">Código</span>
                    <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                      <span className="font-mono font-bold text-sm tracking-widest">
                        {turma.codigoConvite}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(turma.codigoConvite)
                          toast.success('Código copiado!')
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {turma?.observacao && (
                <p className="text-sm mt-2 text-muted-foreground">{turma.observacao}</p>
              )}
            </div>

            <div>
              <h4 className="font-sans text-base font-semibold mb-3">
                Participantes ({participantes.length})
              </h4>

              {participantes.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">
                  Nenhum participante ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {participantes.map((p, i) => (
                    <div
                      key={p?.id || i}
                      className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{p?.nome_no_momento || '-'}</p>
                        <p className="text-xs text-muted-foreground">{p?.email || '-'}</p>
                      </div>

                      {isGerente && (
                        <button
                          onClick={() => handleRemover(p.user_id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Badge de status ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pendente_aprovacao: 'bg-yellow-100 text-yellow-700',
    aprovado: 'bg-green-100 text-green-700',
    recusado: 'bg-destructive/10 text-destructive',
    confirmado: 'bg-accent text-primary',
    cancelado: 'bg-muted text-muted-foreground',
    concluido: 'bg-muted text-muted-foreground',
  }

  const label = {
    pendente_aprovacao: 'Pendente',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    concluido: 'Concluído',
  }

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-body ${
        map[status] || 'bg-muted text-muted-foreground'
      }`}
    >
      {label[status] || status}
    </span>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function TurmasPage() {
  const { isGerente } = useUser()

  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalhesId, setDetalhesId] = useState(null)

  async function fetchTurmas() {
    setLoading(true)
    try {
      const data = await apiClient.get(isGerente ? '/turmas/admin' : '/turmas')
      setTurmas(Array.isArray(data) ? data : data?.turmas || [])
    } catch (error) {
      console.error(error)
      setTurmas([])
      toast.error(error?.response?.data?.msg || 'Erro ao listar turmas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTurmas()
  }, [isGerente])

  async function handleAprovar(id) {
    try {
      await apiClient.patch(`/turmas/${id}/status`, { status: 'aprovado' })
      toast.success('Turma aprovada!')
      await fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao aprovar turma.')
    }
  }

  async function handleRecusar(id, motivo) {
    try {
      await apiClient.patch(`/turmas/${id}/status`, {
        status: 'recusado',
        motivo: motivo || null,
      })
      toast.success('Turma recusada.')
      await fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao recusar turma.')
    }
  }

  async function handleEntrar(id) {
    try {
      await apiClient.post(`/turmas/${id}/participantes`)
      toast.success('Você entrou na turma!')
      await fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao entrar na turma.')
    }
  }

  async function handleSair(id) {
    try {
      await apiClient.delete(`/turmas/${id}/participantes/me`)
      toast.success('Você saiu da turma.')
      await fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao sair da turma.')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            {isGerente
              ? 'Gerencie as turmas e seus participantes'
              : 'Veja as turmas abertas e participe'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Users size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhuma turma encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {turmas.map((turma, i) => (
            <TurmaCard
              key={turma?.id || i}
              turma={turma}
              isGerente={isGerente}
              onVerDetalhes={() => setDetalhesId(turma.id)}
              onEntrar={() => handleEntrar(turma.id)}
              onSair={() => handleSair(turma.id)}
              onAprovar={() => handleAprovar(turma.id)}
              onRecusar={(motivo) => handleRecusar(turma.id, motivo)}
            />
          ))}
        </div>
      )}

      {detalhesId && (
        <DetalhesTurmaModal
          turmaId={detalhesId}
          onClose={() => setDetalhesId(null)}
          isGerente={isGerente}
          onAtualizar={fetchTurmas}
        />
      )}
    </div>
  )
}

// ── Card de turma ───────────────────────────────────────────────────────────
function TurmaCard({
  turma,
  isGerente,
  onVerDetalhes,
  onEntrar,
  onSair,
  onAprovar,
  onRecusar,
}) {
  const [showMotivo, setShowMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')

  const isPendente = turma?.status === 'pendente_aprovacao'
  const isAprovado = turma?.status === 'aprovado'
  const participando = turma?.participando === true

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="font-sans text-lg font-semibold text-card-foreground">
            {turma?.servico?.nome || 'Turma'}
          </h2>

          <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-2">
            <CalendarDays size={14} /> {formatDate(turma?.data)}
          </p>

          <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-2">
            {turma?.data?.slice(8, 10)}/{turma?.data?.slice(5, 7)}/{turma?.data?.slice(0, 4)} ·{' '}
            {turma?.horaInicio?.slice(0, 5)} às {turma?.horaFim?.slice(0, 5)}
          </p>
        </div>

        <StatusBadge status={turma?.status} />
      </div>

      <p className="text-sm text-muted-foreground font-body mb-3">
        Participantes: {turma?.qtdParticipantes ?? 0}/{turma?.capacidadeMaxima ?? 5}
      </p>

      {isGerente && turma?.codigoConvite && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-body">Código:</span>
          <span className="font-mono font-bold text-sm tracking-widest">
            {turma.codigoConvite}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(turma.codigoConvite)
              toast.success('Código copiado!')
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy size={13} />
          </button>
        </div>
      )}

      {turma?.observacao && (
        <p className="text-sm font-body mb-3 text-muted-foreground">{turma.observacao}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onVerDetalhes}
          className="text-sm text-primary hover:underline font-body"
        >
          Ver detalhes
        </button>

        {!isGerente && isAprovado && !participando && (
          <button
            onClick={onEntrar}
            className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            Entrar
          </button>
        )}

        {!isGerente && isAprovado && participando && (
          <button
            onClick={onSair}
            className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            Sair
          </button>
        )}

        {isGerente && isPendente && !showMotivo && (
          <>
            <button
              onClick={onAprovar}
              className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              <Check size={13} /> Aprovar
            </button>

            <button
              onClick={() => setShowMotivo(true)}
              className="flex items-center gap-1 text-sm border border-destructive text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10"
            >
              <Ban size={13} /> Recusar
            </button>
          </>
        )}

        {isGerente && isPendente && showMotivo && (
          <div className="w-full flex gap-2 mt-1">
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              className="flex-1 border border-input rounded-lg px-3 py-1.5 text-sm bg-background font-body"
            />

            <button
              onClick={() => {
                onRecusar(motivo)
                setShowMotivo(false)
                setMotivo('')
              }}
              className="text-sm bg-destructive text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              Confirmar
            </button>

            <button
              onClick={() => {
                setShowMotivo(false)
                setMotivo('')
              }}
              className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}