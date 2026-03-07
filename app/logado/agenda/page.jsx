'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import { todayISO, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
  Settings,
  Plus,
  X,
} from 'lucide-react'

function getHoraSlot(slot) {
  return slot?.slot || slot?.horario || slot?.hora || slot
}

function ConfigModal({ config, onClose, onSave }) {
  const [inicio, setInicio] = useState(config?.horaInicioPadrao?.slice(0, 5) || '08:00')
  const [fim, setFim] = useState(config?.horaFimPadrao?.slice(0, 5) || '18:00')
  const [duracao, setDuracao] = useState(config?.duracaoSlotMinutos || 60)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await onSave({
        horaInicioPadrao: inicio + ':00',
        horaFimPadrao: fim + ':00',
        duracaoSlotMinutos: Number(duracao),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Configurar Agenda
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Horário de início
            </label>
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Horário de fim
            </label>
            <input
              type="time"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Duração do slot (minutos)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function AgendarModal({ slot, data, servicos, onClose, onConfirm }) {
  const [servicoId, setServicoId] = useState('')
  const [tipo, setTipo] = useState('individual')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!servicoId) {
      toast.error('Selecione um serviço.')
      return
    }

    setLoading(true)
    try {
      await onConfirm({ slot, data, servicoId, tipo })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Agendar Horário
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-body mb-4">
          {formatDate(data)} às {getHoraSlot(slot)}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Serviço
            </label>
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              required
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">
              Tipo de atendimento
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="individual">Individual</option>
              <option value="turma">Turma</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
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

export default function AgendaPage() {
  const { isGerente } = useUser()
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [slots, setSlots] = useState([])
  const [config, setConfig] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [agendarSlot, setAgendarSlot] = useState(null)

  async function fetchSlots(date) {
    setLoading(true)
    try {
      const data = await apiClient.get(`/agenda/slots?date=${date}`)
      setSlots(Array.isArray(data) ? data : data?.slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchConfig() {
    try {
      const data = await apiClient.get('/agenda/config')
      setConfig(data)
    } catch {
      setConfig(null)
    }
  }

  async function fetchServicos() {
    try {
      const data = await apiClient.get('/servicos')
      setServicos(Array.isArray(data) ? data : data?.servicos || [])
    } catch {
      setServicos([])
    }
  }

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchConfig()
    fetchServicos()
  }, [selectedDate])

  function changeDate(delta) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  async function handleToggleBloqueio(slot) {
    try {
      await apiClient.post('/agenda/bloqueios/toggle', {
        data: selectedDate,
        slot: getHoraSlot(slot),
      })
      toast.success('Horário atualizado!')
      fetchSlots(selectedDate)
    } catch {
      toast.error('Erro ao atualizar bloqueio.')
    }
  }

  async function handleSaveConfig(novoConfig) {
    try {
      await apiClient.put('/agenda/config', novoConfig)
      toast.success('Configuração salva!')
      fetchConfig()
      fetchSlots(selectedDate)
    } catch {
      toast.error('Erro ao salvar configuração.')
    }
  }

  async function handleAgendar({ slot, data, servicoId, tipo }) {
    try {
      await apiClient.post('/agendamentos', {
        data,
        horaInicio: getHoraSlot(slot),
        servicoId,
        tipo,
      })
      toast.success('Agendamento realizado!')
      fetchSlots(selectedDate)
    } catch {
      toast.error('Erro ao realizar agendamento.')
    }
  }

  function slotColor(slot) {
    if (slot?.bloqueado || slot?.status === 'bloqueado') {
      return 'bg-muted text-muted-foreground border-border'
    }

    if (slot?.ocupado || slot?.status === 'ocupado') {
      return 'bg-primary/10 text-primary border-primary/20'
    }

    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Visualize e gerencie os horários disponíveis
          </p>
        </div>

        {isGerente && (
          <button
            onClick={() => setShowConfig(true)}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors"
          >
            <Settings size={16} /> Configurar agenda
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Dia anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
        />

        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Próximo dia"
        >
          <ChevronRight size={18} />
        </button>

        <span className="text-sm text-muted-foreground font-body hidden sm:block">
          {formatDate(selectedDate)}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 text-xs font-body">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary/20 inline-block" /> Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted inline-block" /> Bloqueado
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground font-body">
            Nenhum slot configurado para esta data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot, i) => {
            const bloqueado = slot?.bloqueado || slot?.status === 'bloqueado'
            const ocupado = slot?.ocupado || slot?.status === 'ocupado'
            const disponivel = !bloqueado && !ocupado
            const hora = getHoraSlot(slot)

            return (
              <div
                key={i}
                className={`border rounded-xl px-3 py-3 flex flex-col items-center gap-2 transition-colors text-sm font-body ${slotColor(slot)}`}
                onClick={() => {
                  if (disponivel) setAgendarSlot(slot)
                }}
              >
                <span className="font-medium">{hora}</span>

                {bloqueado && (
                  <span className="text-xs flex items-center gap-1">
                    <Lock size={10} /> Bloqueado
                  </span>
                )}

                {ocupado && (
                  <span className="text-xs">
                    {slot?.clienteNome || slot?.cliente?.nome || 'Ocupado'}
                  </span>
                )}

                {isGerente && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleBloqueio(slot)
                    }}
                    className="mt-1 text-xs flex items-center gap-1 underline opacity-70 hover:opacity-100"
                  >
                    {bloqueado ? (
                      <>
                        <Unlock size={10} /> Liberar
                      </>
                    ) : (
                      <>
                        <Lock size={10} /> Bloquear
                      </>
                    )}
                  </button>
                )}

                {disponivel && !isGerente && (
                  <span className="text-xs flex items-center gap-1">
                    <Plus size={10} /> Agendar
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showConfig && (
        <ConfigModal
          config={config}
          onClose={() => setShowConfig(false)}
          onSave={handleSaveConfig}
        />
      )}

      {agendarSlot && (
        <AgendarModal
          slot={agendarSlot}
          data={selectedDate}
          servicos={servicos}
          onClose={() => setAgendarSlot(null)}
          onConfirm={handleAgendar}
        />
      )}
    </div>
  )
}