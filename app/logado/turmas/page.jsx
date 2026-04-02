'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { useUser } from '@/context/userContext'
import { toast } from 'sonner'
import {
  Loader2,
  Users,
  CalendarDays,
  X,
  Check,
  Ban,
  Copy,
  KeyRound,
  ArrowRight,
  UserPlus,
  Pencil,
} from 'lucide-react'

function formatarData(data) {
  if (!data) return '—'
  const s = String(data)
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
}

function formatarHora(hora) {
  if (!hora) return '—'
  return String(hora).slice(0, 5)
}

function getQuantidadeParticipantes(turma, participantes = null) {
  if (Array.isArray(participantes)) return participantes.length
  return Number(
    turma?.quantidadeParticipantes ??
      turma?.qtdParticipantes ??
      turma?.qtd_participantes ??
      turma?.participantesCount ??
      turma?.totalParticipantes ??
      0
  ) || 0
}

function getCapacidadeMaxima(turma) {
  return Number(turma?.capacidadeMaxima ?? turma?.capacidade_maxima ?? 5) || 5
}

function getParticipanteId(p) {
  return p?.user_id ?? p?.usuarioId ?? p?.usuario?.id ?? p?.id ?? null
}

function getParticipanteNome(p) {
  return p?.nome_no_momento ?? p?.nomeNoMomento ?? p?.usuario?.nome ?? p?.nome ?? '—'
}

function getParticipanteEmail(p) {
  return p?.email ?? p?.usuario?.email ?? '—'
}

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
    <span className={`text-xs px-2 py-1 rounded-full font-body ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {label[status] || status}
    </span>
  )
}

// ─── Modal: Editar turma ─────────────────────────────────────────────────────
function EditarTurmaModal({ turma, onClose, onAtualizar }) {
  const [form, setForm] = useState({
    data: turma?.data ? String(turma.data).slice(0, 10) : '',
    horaInicio: turma?.horaInicio ? String(turma.horaInicio).slice(0, 5) : '',
    horaFim: turma?.horaFim ? String(turma.horaFim).slice(0, 5) : '',
    capacidadeMaxima: turma?.capacidadeMaxima ?? 5,
  })
  const [loading, setLoading] = useState(false)

  async function handleSalvar() {
    setLoading(true)
    try {
      await apiClient.put(`/turmas/${turma.id}`, {
        data: form.data,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
        capacidadeMaxima: Number(form.capacidadeMaxima),
      })
      toast.success('Turma atualizada!')
      await onAtualizar()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao atualizar turma.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Editar turma</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Data</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-body mb-1 block">Hora início</label>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground font-body mb-1 block">Hora fim</label>
              <input
                type="time"
                value={form.horaFim}
                onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">
              Capacidade máxima (2–5)
            </label>
            <input
              type="number"
              min={2}
              max={5}
              value={form.capacidadeMaxima}
              onChange={(e) => setForm((f) => ({ ...f, capacidadeMaxima: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
          <button onClick={onClose} className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Adicionar participante ───────────────────────────────────────────
function AdicionarParticipanteModal({ turma, participantesAtuais, onClose, onAtualizar }) {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(null)

  useEffect(() => {
    async function fetchClientes() {
      try {
        const data = await apiClient.get('/users')
        const lista = Array.isArray(data) ? data : []
        const idsNaTurma = new Set(participantesAtuais.map((p) => getParticipanteId(p)))
        setClientes(
          lista.filter((u) => u.perfil === 'cliente' && u.ativo && !idsNaTurma.has(u.id))
        )
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar clientes.')
      } finally {
        setLoading(false)
      }
    }
    fetchClientes()
  }, [])

  async function handleAdicionar(userId) {
    setAdicionando(userId)
    try {
      await apiClient.post(`/turmas/${turma.id}/participantes`, { userId })
      toast.success('Participante adicionado!')
      await onAtualizar()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || 'Erro ao adicionar participante.')
    } finally {
      setAdicionando(null)
    }
  }

  const capacidadeMaxima = getCapacidadeMaxima(turma)
  const quantidadeAtual = getQuantidadeParticipantes(turma, participantesAtuais)
  const turmaCheia = quantidadeAtual >= capacidadeMaxima

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-sans text-lg font-bold text-card-foreground">Adicionar participante</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Vagas: {quantidadeAtual}/{capacidadeMaxima}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {turmaCheia ? (
          <div className="text-center py-8 text-muted-foreground font-body text-sm">
            Turma já está com a capacidade máxima atingida.
          </div>
        ) : (
          <>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-body mb-4"
              autoFocus
            />

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-body py-8">
                {busca ? 'Nenhum cliente encontrado.' : 'Todos os clientes já estão na turma.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <button
                      onClick={() => handleAdicionar(c.id)}
                      disabled={adicionando === c.id}
                      className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {adicionando === c.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <UserPlus size={12} />
                      }
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal: Detalhes da turma ────────────────────────────────────────────────
function DetalhesTurmaModal({ turmaId, onClose, isGerente, onAtualizar }) {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState(null)
  const [showEditar, setShowEditar] = useState(false)
  const [showAdicionar, setShowAdicionar] = useState(false)

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
    if (turmaId) fetchDetalhes()
  }, [turmaId])

  async function handleRemover(userId) {
    if (!userId) { toast.error('Não foi possível identificar o participante.'); return }
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

  const turma = dados?.turma ?? dados ?? null
  const participantes = dados?.participantes ?? turma?.participantes ?? turma?.listaParticipantes ?? []
  const quantidadeParticipantes = getQuantidadeParticipantes(turma, participantes)
  const capacidadeMaxima = getCapacidadeMaxima(turma)
  const turmaCheia = quantidadeParticipantes >= capacidadeMaxima

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-fade-in max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-sans text-lg font-bold text-card-foreground">Detalhes da turma</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : !turma ? (
            <div className="text-center py-8 text-muted-foreground font-body">Turma não encontrada.</div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Info da turma */}
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-card-foreground">{turma?.servico?.nome || 'Serviço'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatarData(turma?.data)} · {formatarHora(turma?.horaInicio)} às {formatarHora(turma?.horaFim)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: <span className="font-medium">{turma?.status}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Participantes: {quantidadeParticipantes}/{capacidadeMaxima}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {turma?.codigoConvite && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground font-body">Código</span>
                        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                          <span className="font-mono font-bold text-sm tracking-widest">{turma.codigoConvite}</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(turma.codigoConvite); toast.success('Código copiado!') }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {isGerente && (
                      <button
                        onClick={() => setShowEditar(true)}
                        className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    )}
                  </div>
                </div>

                {turma?.observacao && (
                  <p className="text-sm mt-2 text-muted-foreground">{turma.observacao}</p>
                )}
              </div>

              {/* Participantes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-sans text-base font-semibold">
                    Participantes ({quantidadeParticipantes})
                  </h4>

                  {isGerente && !turmaCheia && (
                    <button
                      onClick={() => setShowAdicionar(true)}
                      className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
                    >
                      <UserPlus size={12} /> Adicionar
                    </button>
                  )}
                  {isGerente && turmaCheia && (
                    <span className="text-xs text-muted-foreground font-body">Turma cheia</span>
                  )}
                </div>

                {participantes.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">Nenhum participante ainda.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {participantes.map((p, i) => {
                      const participanteId = getParticipanteId(p)
                      return (
                        <div
                          key={participanteId || i}
                          className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{getParticipanteNome(p)}</p>
                            <p className="text-xs text-muted-foreground">{getParticipanteEmail(p)}</p>
                          </div>
                          {isGerente && (
                            <button
                              onClick={() => handleRemover(participanteId)}
                              disabled={!participanteId}
                              className="text-xs text-destructive hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditar && turma && (
        <EditarTurmaModal
          turma={turma}
          onClose={() => setShowEditar(false)}
          onAtualizar={async () => { await fetchDetalhes(); await onAtualizar() }}
        />
      )}

      {showAdicionar && turma && (
        <AdicionarParticipanteModal
          turma={turma}
          participantesAtuais={participantes}
          onClose={() => setShowAdicionar(false)}
          onAtualizar={async () => { await fetchDetalhes(); await onAtualizar() }}
        />
      )}
    </>
  )
}

// ─── Modal: Entrar por código ────────────────────────────────────────────────
function EntrarPorCodigoModal({ onClose, onEntrou }) {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const cod = codigo.trim().toUpperCase()
    if (!cod) { toast.error('Digite o código de convite.'); return }
    setLoading(true)
    try {
      await apiClient.post(`/turmas/convites/${cod}/aceitar`)
      toast.success('Você entrou na turma!')
      await onEntrou()
      onClose()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Erro ao entrar na turma.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Entrar por código</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Digite o código de convite da turma que você deseja participar.
        </p>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Ex: AB12CD34"
          maxLength={8}
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono tracking-widest mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Entrar
          </button>
          <button onClick={onClose} className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estado vazio para cliente sem turmas ────────────────────────────────────
function ClienteSemTurmas({ onEntrou }) {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const cod = codigo.trim().toUpperCase()
    if (!cod) { toast.error('Digite o código de convite.'); return }
    setLoading(true)
    try {
      await apiClient.post(`/turmas/convites/${cod}/aceitar`)
      toast.success('Você entrou na turma!')
      await onEntrou()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Código inválido ou turma não encontrada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Users size={28} className="text-muted-foreground opacity-60" />
      </div>
      <h2 className="font-sans text-xl font-semibold text-foreground mb-2 text-center">
        Você ainda não está em nenhuma turma
      </h2>
      <p className="text-sm text-muted-foreground font-body text-center max-w-sm mb-8">
        Para participar de uma turma, insira o código de convite que você recebeu.
      </p>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={15} className="text-primary" />
          <span className="text-sm font-medium text-card-foreground font-sans">Entrar por código</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ex: AB12CD34"
            maxLength={8}
            autoFocus
            className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !codigo.trim()}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 transition-opacity"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Entrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TurmaCard ───────────────────────────────────────────────────────────────
function TurmaCard({ turma, isGerente, onVerDetalhes, onEntrar, onSair, onAprovar, onRecusar }) {
  const [showMotivo, setShowMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')

  const isPendente = turma?.status === 'pendente_aprovacao'
  const isAprovado = turma?.status === 'aprovado'
  const participando = turma?.participando === true
  const quantidadeParticipantes = getQuantidadeParticipantes(turma)
  const capacidadeMaxima = getCapacidadeMaxima(turma)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="font-sans text-lg font-semibold text-card-foreground">
            {turma?.servico?.nome || 'Turma'}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-2">
            <CalendarDays size={14} />
            {formatarData(turma?.data)} · {formatarHora(turma?.horaInicio)} às {formatarHora(turma?.horaFim)}
          </p>
        </div>
        <StatusBadge status={turma?.status} />
      </div>

      <p className="text-sm text-muted-foreground font-body mb-3">
        Participantes: {quantidadeParticipantes}/{capacidadeMaxima}
      </p>

      {isGerente && turma?.codigoConvite && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-body">Código:</span>
          <span className="font-mono font-bold text-sm tracking-widest">{turma.codigoConvite}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(turma.codigoConvite); toast.success('Código copiado!') }}
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
        <button onClick={onVerDetalhes} className="text-sm text-primary hover:underline font-body">
          Ver detalhes
        </button>

        {!isGerente && isAprovado && !participando && (
          <button onClick={onEntrar} className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90">
            Entrar
          </button>
        )}

        {!isGerente && isAprovado && participando && (
          <button onClick={onSair} className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted">
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
              onClick={() => { onRecusar(motivo); setShowMotivo(false); setMotivo('') }}
              className="text-sm bg-destructive text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setShowMotivo(false); setMotivo('') }}
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function TurmasPage() {
  const { isGerente } = useUser()

  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalhesId, setDetalhesId] = useState(null)
  const [showCodigo, setShowCodigo] = useState(false)

  async function fetchTurmas() {
    setLoading(true)
    try {
      const data = await apiClient.get(isGerente ? '/turmas/admin' : '/turmas')
      const lista = Array.isArray(data) ? data : data?.turmas || []
      setTurmas(lista)
    } catch (error) {
      console.error(error)
      setTurmas([])
      toast.error(error?.response?.data?.msg || 'Erro ao listar turmas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTurmas() }, [isGerente])

  async function handleAprovar(id) {
    try {
      await apiClient.patch(`/turmas/${id}/status`, { status: 'aprovado' })
      toast.success('Turma aprovada!')
      await fetchTurmas()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Erro ao aprovar turma.')
    }
  }

  async function handleRecusar(id, motivo) {
    try {
      await apiClient.patch(`/turmas/${id}/status`, { status: 'recusado', motivo: motivo || null })
      toast.success('Turma recusada.')
      await fetchTurmas()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Erro ao recusar turma.')
    }
  }

  async function handleEntrar(id) {
    try {
      await apiClient.post(`/turmas/${id}/participantes`)
      toast.success('Você entrou na turma!')
      await fetchTurmas()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Erro ao entrar na turma.')
    }
  }

  async function handleSair(id) {
    try {
      await apiClient.delete(`/turmas/${id}/participantes/me`)
      toast.success('Você saiu da turma.')
      await fetchTurmas()
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Erro ao sair da turma.')
    }
  }

  function renderConteudo() {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )
    }

    if (turmas.length === 0 && isGerente) {
      return (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Users size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhuma turma encontrada.</p>
        </div>
      )
    }

    if (turmas.length === 0 && !isGerente) {
      return <ClienteSemTurmas onEntrou={fetchTurmas} />
    }

    return (
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
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            {isGerente ? 'Gerencie as turmas e seus participantes' : 'Veja as turmas abertas e participe'}
          </p>
        </div>

        {!isGerente && turmas.length > 0 && (
          <button
            onClick={() => setShowCodigo(true)}
            className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted self-start sm:self-auto"
          >
            <KeyRound size={15} />
            Entrar por código
          </button>
        )}
      </div>

      {renderConteudo()}

      {detalhesId && (
        <DetalhesTurmaModal
          turmaId={detalhesId}
          onClose={() => setDetalhesId(null)}
          isGerente={isGerente}
          onAtualizar={fetchTurmas}
        />
      )}

      {showCodigo && (
        <EntrarPorCodigoModal
          onClose={() => setShowCodigo(false)}
          onEntrou={fetchTurmas}
        />
      )}
    </div>
  )
}