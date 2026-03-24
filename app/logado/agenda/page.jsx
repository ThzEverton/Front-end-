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

function normalizeDateOnly(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (value instanceof Date) {
    const ano = value.getFullYear()
    const mes = String(value.getMonth() + 1).padStart(2, '0')
    const dia = String(value.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  return String(value).slice(0, 10)
}

function normalizeTime(value) {
  if (!value) return ''
  return String(value).slice(0, 8)
}

function getHoraSlot(slot) {
  return normalizeTime(slot?.slot || slot?.horario || slot?.hora || slot)
}

function isBloqueado(slot) {
  return (
    slot?.bloqueado === true ||
    slot?.bloqueado === 1 ||
    slot?.bloqueado === '1' ||
    slot?.bloqueado === 'true' ||
    slot?.status === 'bloqueado'
  )
}

function isOcupado(slot) {
  return (
    slot?.ocupado === true ||
    slot?.ocupado === 1 ||
    slot?.ocupado === '1' ||
    slot?.ocupado === 'true' ||
    slot?.status === 'ocupado'
  )
}

function ConfigModal({ config, onClose, onSave }) {
  const [inicioSemana, setInicioSemana] = useState(config?.horaInicioSemana?.slice(0, 5) || '08:00')
  const [fimSemana, setFimSemana] = useState(config?.horaFimSemana?.slice(0, 5) || '18:00')
  const [inicioFimSemana, setInicioFimSemana] = useState(
    config?.horaInicioFimSemana?.slice(0, 5) || ''
  )
  const [fimFimSemana, setFimFimSemana] = useState(
    config?.horaFimFimSemana?.slice(0, 5) || ''
  )
  const [duracao, setDuracao] = useState(config?.duracaoSlotMinutos || 60)
  const [loading, setLoading] = useState(false)

  function timeToMinutes(value) {
    if (!value) return null
    const [hora, minuto] = value.split(':').map(Number)
    return hora * 60 + minuto
  }

  function validar() {
    if (!inicioSemana || !fimSemana) {
      toast.error('Preencha o horário de início e fim dos dias úteis.')
      return false
    }

    const inicioSemanaMin = timeToMinutes(inicioSemana)
    const fimSemanaMin = timeToMinutes(fimSemana)

    if (fimSemanaMin <= inicioSemanaMin) {
      toast.error('Nos dias úteis, o horário de fim deve ser maior que o horário de início.')
      return false
    }

    const duracaoNumero = Number(duracao)

    if (!duracaoNumero || duracaoNumero < 15) {
      toast.error('A duração do slot deve ser de no mínimo 15 minutos.')
      return false
    }

    if (duracaoNumero % 15 !== 0) {
      toast.error('A duração do slot deve ser múltipla de 15 minutos.')
      return false
    }

    const preencheuInicioFimSemana = !!inicioFimSemana
    const preencheuFimFimSemana = !!fimFimSemana

    if ((preencheuInicioFimSemana && !preencheuFimFimSemana) || (!preencheuInicioFimSemana && preencheuFimFimSemana)) {
      toast.error('Para configurar fim de semana, preencha início e fim.')
      return false
    }

    if (preencheuInicioFimSemana && preencheuFimFimSemana) {
      const inicioFimSemanaMin = timeToMinutes(inicioFimSemana)
      const fimFimSemanaMin = timeToMinutes(fimFimSemana)

      if (fimFimSemanaMin <= inicioFimSemanaMin) {
        toast.error('No fim de semana, o horário de fim deve ser maior que o horário de início.')
        return false
      }
    }

    return true
  }

  async function handleSave() {
    if (!validar()) return

    setLoading(true)
    try {
      await onSave({
        horaInicioSemana: inicioSemana + ':00',
        horaFimSemana: fimSemana + ':00',
        horaInicioFimSemana: inicioFimSemana ? inicioFimSemana + ':00' : null,
        horaFimFimSemana: fimFimSemana ? fimFimSemana + ':00' : null,
        duracaoSlotMinutos: Number(duracao),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Configurar Agenda
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="border border-border rounded-xl p-4">
            <p className="text-sm font-semibold font-body mb-3 text-card-foreground">
              Segunda a sexta
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Horário de início
                </label>
                <input
                  type="time"
                  value={inicioSemana}
                  onChange={(e) => setInicioSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Horário de fim
                </label>
                <input
                  type="time"
                  value={fimSemana}
                  onChange={(e) => setFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4">
            <p className="text-sm font-semibold font-body mb-1 text-card-foreground">
              Sábado e domingo
            </p>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Deixe vazio caso não atenda no fim de semana.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Horário de início
                </label>
                <input
                  type="time"
                  value={inicioFimSemana}
                  onChange={(e) => setInicioFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Horário de fim
                </label>
                <input
                  type="time"
                  value={fimFimSemana}
                  onChange={(e) => setFimFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>
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
            <p className="text-xs text-muted-foreground font-body mt-1">
              Use valores como 15, 30, 45 ou 60.
            </p>
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
  const [passo, setPasso] = useState(1)   // 1 = escolha, 2 = turma
  const [subTipo, setSubTipo] = useState('')  // 'nova' | 'codigo'
  const [horaFim, setHoraFim] = useState('')
  const [codigoConvite, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)

  function handleProximo(e) {
    e.preventDefault()

    if (!servicoId) {
      toast.error('Selecione um serviço.')
      return
    }

    if (tipo === 'turma') {
      setPasso(2)
      return
    }

    handleSubmit()
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await onConfirm({
        slot,
        data,
        servicoId,
        tipo,
        horaFim: horaFim || null,
        subTipo,
        codigoConvite,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarTurma(e) {
    e.preventDefault()

    if (!subTipo) {
      toast.error('Escolha uma opção.')
      return
    }

    if (subTipo === 'codigo' && !codigoConvite.trim()) {
      toast.error('Informe o código da turma.')
      return
    }

    // Removida validação de horaFim — calculado automaticamente no handleAgendar
    await handleSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            {passo === 1 ? 'Agendar horário' : 'Entrar em turma'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-body mb-4">
          {formatDate(data)} às {getHoraSlot(slot)}
        </p>

        {/* ── PASSO 1: serviço + tipo ── */}
        {passo === 1 && (
          <form onSubmit={handleProximo} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Serviço</label>
              <select
                value={servicoId}
               onChange={(e) => setServicoId(Number(e.target.value))}
                required
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              >
                <option value="">Selecione um serviço...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium font-body mb-1.5">
                Tipo de atendimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['individual', 'turma'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`py-2.5 rounded-lg border text-sm font-body transition-colors capitalize
                      ${tipo === t
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {t === 'individual' ? 'Individual' : 'Turma'}
                  </button>
                ))}
              </div>
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
                {tipo === 'turma' ? 'Próximo →' : 'Confirmar'}
              </button>
            </div>
          </form>
        )}

        {/* ── PASSO 2: opções de turma ── */}
        {passo === 2 && (
          <form onSubmit={handleConfirmarTurma} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium font-body mb-2">
                O que deseja fazer?
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'nova', label: 'Criar nova turma', desc: 'Vai para aprovação da gerente' },
                  { val: 'codigo', label: 'Entrar com código de convite', desc: 'Informe o código que recebeu' },
                ].map((op) => (
                  <button
                    key={op.val}
                    type="button"
                    onClick={() => setSubTipo(op.val)}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-body transition-colors
                      ${subTipo === op.val
                        ? 'border-primary bg-primary/5 text-card-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <p className="font-medium text-card-foreground">{op.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{op.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Campo extra: hora fim (nova turma) */}
            {subTipo === 'nova' && (
              <p className="text-xs text-muted-foreground font-body bg-muted px-3 py-2 rounded-lg">
                A turma terá duração de 2 horas. Ficará pendente até a gerente aprovar.
              </p>
            )}

            {/* Campo extra: código (entrar por código) */}
            {subTipo === 'codigo' && (
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Código da turma
                </label>
                <input
                  type="text"
                  value={codigoConvite}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex: A1B2C3D4"
                  maxLength={8}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body tracking-widest uppercase"
                />
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setPasso(1); setSubTipo('') }}
                className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={loading || !subTipo}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Confirmar
              </button>
            </div>
          </form>
        )}
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
    const [slotsData, bloqueiosData, excecoesData] = await Promise.all([
      apiClient.get(`/agenda/slots?date=${date}`),
      apiClient.get('/agenda/bloqueios'),
      apiClient.get('/agenda/excecoes'),
    ])

    const slotsArray = Array.isArray(slotsData) ? slotsData : slotsData?.slots || []
    const bloqueiosArray = Array.isArray(bloqueiosData) ? bloqueiosData : bloqueiosData?.bloqueios || []
    const excecoesArray = Array.isArray(excecoesData) ? excecoesData : excecoesData?.excecoes || []

    const diaSemana = new Date(date).getDay()

    const slotsFormatados = slotsArray.map((slot) => {
      const horaSlot = getHoraSlot(slot)

      const bloqueado = bloqueiosArray.some((b) => {
        return normalizeDateOnly(b?.data) === date && normalizeTime(b?.slot) === horaSlot
      })

      const ocupada = isOcupado(slot)

      // ✅ verifica se está dentro de alguma exceção do dia ou recorrente
      const dentroDaExcecao = excecoesArray.some((ex) => {
        const exData = normalizeDateOnly(ex.data)
        const diasRecorrentes = ex?.diasSemana?.split(',').map(Number) || []
        const inicioEx = normalizeTime(ex?.horaInicioExcecao)
        const fimEx = normalizeTime(ex?.horaFimExcecao)

        const aplicaData = exData ? exData === date : diasRecorrentes.includes(diaSemana)
        return aplicaData && inicioEx && fimEx && horaSlot >= inicioEx && horaSlot < fimEx
      })

      return {
        ...slot,
        bloqueado: bloqueado || dentroDaExcecao,
        ocupado: ocupada,
        status: bloqueado || dentroDaExcecao ? 'bloqueado' : ocupada ? 'ocupado' : 'disponivel',
      }
    })

    setSlots(slotsFormatados)
  } catch (error) {
    console.error('Erro ao buscar slots:', error)
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
    const [ano, mes, dia] = selectedDate.split('-').map(Number)
    const d = new Date(ano, mes - 1, dia)
    d.setDate(d.getDate() + delta)

    const novoAno = d.getFullYear()
    const novoMes = String(d.getMonth() + 1).padStart(2, '0')
    const novoDia = String(d.getDate()).padStart(2, '0')

    setSelectedDate(`${novoAno}-${novoMes}-${novoDia}`)
  }

  async function handleToggleBloqueio(slot) {
    try {
      const horaSlot = getHoraSlot(slot)

      const resp = await apiClient.post('/agenda/bloqueios/toggle', {
        data: selectedDate,
        slot: horaSlot,
      })

      setSlots((prev) =>
        prev.map((item) => {
          if (getHoraSlot(item) !== horaSlot) return item

          const ocupado = isOcupado(item)

          const bloqueado =
            typeof resp?.bloqueado === 'boolean'
              ? resp.bloqueado
              : !isBloqueado(item)

          return {
            ...item,
            bloqueado,
            status: bloqueado ? 'bloqueado' : ocupado ? 'ocupado' : 'disponivel',
          }
        })
      )

      toast.success(resp?.msg || 'Horário atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar bloqueio:', error)
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

  async function handleAgendar({ slot, data, servicoId, tipo, subTipo, codigoConvite }) {
  console.log({ slot, data, servicoId, tipo, subTipo, codigoConvite });

  try {
   
    const servicoIdNum = Number(servicoId);

    if (!servicoId || isNaN(servicoIdNum) || servicoIdNum <= 0) {
      toast.error('Selecione um serviço válido.');
      return;
    }

    if (tipo === 'turma') {
      if (subTipo === 'nova') {
        const horaInicio = getHoraSlot(slot);

        const [h, m, s] = horaInicio.split(':').map(Number);
        const base = new Date(1970, 0, 1, h, m, s || 0);
        base.setHours(base.getHours() + 2);
        const horaFim = base.toTimeString().slice(0, 8);

        const resp = await apiClient.post('/turmas', {
          servicoId: servicoIdNum,
          data,
          horaInicio,
          horaFim,
        });

        toast.success(`Turma criada! Código: ${resp.codigoConvite} — aguardando aprovação.`);

      } else if (subTipo === 'codigo') {

        if (!codigoConvite?.trim()) {
          toast.error('Informe o código da turma.');
          return;
        }

        await apiClient.post(`/turmas/convites/${codigoConvite.trim().toUpperCase()}/aceitar`);
        toast.success('Você entrou na turma com sucesso!');
      }

    } else {
      await apiClient.post('/agendamentos', {
        data,
        horaInicio: getHoraSlot(slot),
        servicoId: servicoIdNum,
      });

      toast.success('Agendamento realizado!');
    }

    fetchSlots(selectedDate);

  } catch (error) {
    console.error(error);

    const msg =
      error?.response?.data?.msg ||
      error?.message ||
      'Erro ao realizar agendamento.';

    toast.error(msg);
  }
}
  function slotColor(slot) {
    if (isBloqueado(slot)) {
      return 'bg-muted text-muted-foreground border-border'
    }

    if (isOcupado(slot)) {
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
            const bloqueado = isBloqueado(slot)
            const ocupado = isOcupado(slot)
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