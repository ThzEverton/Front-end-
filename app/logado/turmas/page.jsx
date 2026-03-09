'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { useUser } from '@/context/userContext'
import { formatDate, formatTime } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Users,
  CalendarDays,
  Clock3,
  X,
} from 'lucide-react'

function CriarTurmaModal({ servicos, onClose, onSalvo }) {
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!servicoId || !data || !horaInicio || !horaFim) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/turmas', {
        servicoId: Number(servicoId),
        data,
        horaInicio: horaInicio.length === 5 ? horaInicio + ':00' : horaInicio,
        horaFim: horaFim.length === 5 ? horaFim + ':00' : horaFim,
        observacao,
      })

      toast.success('Turma criada com sucesso!')
      onSalvo()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar turma.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Nova turma
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Serviço</label>
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background"
              required
            >
              <option value="">Selecione...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Hora início</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Hora fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Observação
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background"
              placeholder="Detalhes da turma"
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
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
      toast.error('Erro ao buscar detalhes da turma.')
      setDados(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetalhes()
  }, [turmaId])

  async function handleRemoverParticipante(userId) {
    try {
      await apiClient.delete(`/turmas/${turmaId}/participantes/${userId}`)
      toast.success('Participante removido com sucesso!')
      fetchDetalhes()
      onAtualizar()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover participante.')
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
              <p className="font-medium text-card-foreground">{turma?.servico?.nome || 'Serviço'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(turma?.data)} · {formatTime(turma?.horaInicio)} às {formatTime(turma?.horaFim)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Status: {turma?.status}
              </p>
              {turma?.observacao && (
                <p className="text-sm mt-2">{turma.observacao}</p>
              )}
            </div>

            <div>
              <h4 className="font-sans text-base font-semibold mb-3">
                Participantes ({participantes.length})
              </h4>

              {participantes.length === 0 ? (
                <div className="text-sm text-muted-foreground font-body">
                  Nenhum participante ainda.
                </div>
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
                          onClick={() => handleRemoverParticipante(p.user_id)}
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

export default function TurmasPage() {
  const { isGerente } = useUser()

  const [turmas, setTurmas] = useState([])
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCriar, setShowCriar] = useState(false)
  const [detalhesId, setDetalhesId] = useState(null)

  async function fetchTurmas() {
    setLoading(true)
    try {
      const data = await apiClient.get(isGerente ? '/turmas/admin' : '/turmas')
      setTurmas(Array.isArray(data) ? data : data?.turmas || [])
    } catch (error) {
      console.error(error)
      setTurmas([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchServicos() {
    try {
      const data = await apiClient.get('/servicos')
      setServicos(Array.isArray(data) ? data : data?.servicos || [])
    } catch (error) {
      console.error(error)
      setServicos([])
    }
  }

  useEffect(() => {
    fetchTurmas()
    if (isGerente) {
      fetchServicos()
    }
  }, [isGerente])

  async function handleEntrar(id) {
    try {
      await apiClient.post(`/turmas/${id}/entrar`)
      toast.success('Você entrou na turma com sucesso!')
      fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao entrar na turma.')
    }
  }

  async function handleSair(id) {
    try {
      await apiClient.delete(`/turmas/${id}/sair`)
      toast.success('Você saiu da turma com sucesso!')
      fetchTurmas()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao sair da turma.')
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

        {isGerente && (
          <button
            onClick={() => setShowCriar(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-body hover:opacity-90"
          >
            <Plus size={16} /> Nova turma
          </button>
        )}
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
            <div
              key={turma?.id || i}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-sans text-lg font-semibold text-card-foreground">
                    {turma?.servico?.nome || 'Turma'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-2">
                    <CalendarDays size={14} />
                    {formatDate(turma?.data)}
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-2">
                    <Clock3 size={14} />
                    {formatTime(turma?.horaInicio)} às {formatTime(turma?.horaFim)}
                  </p>
                </div>

                <span className="text-xs px-2 py-1 rounded-full bg-accent text-primary font-body">
                  {turma?.status || 'confirmado'}
                </span>
              </div>

              <div className="text-sm text-muted-foreground font-body mb-4">
                Participantes: {turma?.qtdParticipantes ?? 0}/5
              </div>

              {turma?.observacao && (
                <p className="text-sm font-body mb-4">{turma.observacao}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setDetalhesId(turma.id)}
                  className="text-sm text-primary hover:underline font-body"
                >
                  Ver detalhes
                </button>

                {isGerente ? null : (
                  <>
                    <button
                      onClick={() => handleEntrar(turma.id)}
                      className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
                    >
                      Entrar
                    </button>

                    <button
                      onClick={() => handleSair(turma.id)}
                      className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
                    >
                      Sair
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCriar && (
        <CriarTurmaModal
          servicos={servicos}
          onClose={() => setShowCriar(false)}
          onSalvo={fetchTurmas}
        />
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