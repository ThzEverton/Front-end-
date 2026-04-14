'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import DisparoEmMassa from '@/components/DisparoEmMassa'
import {
  formatDate,
  statusAgendamentoLabel,
  podeCancelarRemarcar,
  todayISO,
} from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2,
  RefreshCw,
  XCircle,
  X,
  MessageCircle,
  Clock,
  CalendarDays,
  ChevronRight,
} from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────

function extrairPayload(response) {
  return response?.data ?? response
}

function normalizarStatus(status) {
  const s = String(status || '').toLowerCase()
  const map = {
    confirmado: 'AGENDADO',
    agendado: 'AGENDADO',
    pendente: 'PENDENTE',
    concluido: 'CONCLUIDO',
    cancelado: 'CANCELADO',
    remarcado: 'REMARCADO',
  }
  return map[s] || String(status || '').toUpperCase()
}

function statusParaApi(status) {
  const map = {
    AGENDADO: 'confirmado',
    PENDENTE: 'pendente',
    CONCLUIDO: 'concluido',
    CANCELADO: 'cancelado',
    REMARCADO: 'remarcado',
  }
  return map[status] || status
}

function montarDataHora(data, hora) {
  if (!data && !hora) return ''
  if (data && hora) {
    const dataLimpa = String(data).includes('T') ? String(data).split('T')[0] : String(data)
    return `${dataLimpa}T${hora}`
  }
  return data || hora || ''
}

function formatarHorarioSeguro(valor) {
  if (!valor) return '-'
  if (typeof valor === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(valor)) {
    return valor.slice(0, 5)
  }
  try {
    const data = new Date(valor)
    if (Number.isNaN(data.getTime())) return '-'
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '-'
  }
}

function normalizarTelefoneBR(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

function extrairDataISO(dataHora) {
  if (!dataHora) return ''
  const s = String(dataHora)
  if (s.includes('T')) return s.split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  try {
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch { /* empty */ }
  return ''
}
function normalizarAgendamento(item) {
  const participante = item?.participante || null
  const criador      = item?.criadoPor    || null
  const cliente      = participante || criador

  return {
    ...item,
    cliente,
    clienteId:    participante?.id       || criador?.id       || null,
    clienteNome:  participante?.nome     || criador?.nome     || '-',
    clienteEmail: participante?.email    || criador?.email    || '',
    telefone:     participante?.telefone || criador?.telefone || '',
    servicoNome:  item?.servico?.nome    || '-',
    horario:      item?.horaInicio       || '',
    dataHora:     montarDataHora(item?.data, item?.horaInicio),
    status:       normalizarStatus(item?.status),
    tipo:         item?.tipo             || 'individual',
  }
}
function pertenceAoUsuario(agendamento, user) {
  if (!user) return true
  const userId    = user?.id
  const userEmail = String(user?.email || '').toLowerCase()

  const ids = [
    agendamento?.participante?.id,  // ← prioridade
    agendamento?.clienteId,
    agendamento?.criadoPor?.id,
  ].filter(Boolean)

  const emails = [
    agendamento?.participante?.email,
    agendamento?.clienteEmail,
    agendamento?.criadoPor?.email,
  ].filter(Boolean).map(e => String(e).toLowerCase())

  if (userId && ids.includes(userId)) return true
  if (userEmail && emails.includes(userEmail)) return true
  return false
}

function filtrarPorPeriodo(lista, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return lista
  return lista.filter((a) => {
    const dataItem = extrairDataISO(a?.dataHora || a?.data)
    if (!dataItem) return true
    if (dataInicio && dataItem < dataInicio) return false
    if (dataFim && dataItem > dataFim) return false
    return true
  })
}

function statusBadge(status) {
  const map = {
    AGENDADO: 'bg-accent text-primary',
    PENDENTE: 'bg-yellow-100 text-yellow-700',
    CONCLUIDO: 'bg-green-100 text-green-700',
    CANCELADO: 'bg-destructive/10 text-destructive',
    REMARCADO: 'bg-yellow-100 text-yellow-700',
  }
  return `text-xs px-2 py-0.5 rounded-full font-body ${map[status] || 'bg-muted text-muted-foreground'}`
}

function erroApi(error, fallback) {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  )
}

// ─── DetalheModal ─────────────────────────────────────────────────────────────

function DetalheModal({ agendamento, isGerente, onClose, onRemarcar, onCancelar }) {
  const [novaData, setNovaData] = useState('')
  const [novoHorario, setNovoHorario] = useState('')
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [loadingRe, setLoadingRe] = useState(false)
  const [loadingCan, setLoadingCan] = useState(false)

  const referenciaDataHora =
    agendamento?.dataHora ||
    montarDataHora(agendamento?.data, agendamento?.horario || agendamento?.horaInicio)

  const podeAlterar = podeCancelarRemarcar(referenciaDataHora)

  const nomeCliente =
    agendamento?.clienteNome || agendamento?.cliente?.nome || agendamento?.usuario?.nome || 'cliente'
  const nomeServico = agendamento?.servicoNome || agendamento?.servico?.nome || 'seu atendimento'

  const telefoneBruto =
    agendamento?.telefone ||
    agendamento?.cliente?.telefone ||
    agendamento?.usuario?.telefone ||
    agendamento?.criadoPor?.telefone ||
    agendamento?.CriadoPor?.telefone ||
    ''

  const dataAgendamento = formatDate(agendamento?.dataHora || agendamento?.data)
  const horarioAgendamento = formatarHorarioSeguro(
    agendamento?.horario || agendamento?.horaInicio || agendamento?.dataHora
  )

  const statusAtual = agendamento?.status
  const mostrarAcoes = podeAlterar && statusAtual !== 'CANCELADO' && statusAtual !== 'CONCLUIDO'

  async function fetchHorariosDisponiveis(data) {
    if (!data) {
      setHorariosDisponiveis([])
      return
    }

    let dataFormatada = null

    if (data instanceof Date) {
      dataFormatada = data.toISOString().split('T')[0]
    } else if (typeof data === 'string' && data.includes('/')) {
      const [dia, mes, ano] = data.split('/')
      dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    } else if (typeof data === 'string' && data.includes('-')) {
      dataFormatada = data
    }

    if (!dataFormatada) {
      setHorariosDisponiveis([])
      toast.error('Data inválida')
      return
    }

    setLoadingHorarios(true)

    try {
      const response = await apiClient.get(`/agenda/slots?date=${dataFormatada}`)

      const payload = extrairPayload(response)

      const lista = Array.isArray(payload)
        ? payload
        : payload?.slots || payload?.horarios || payload?.data || []

      const horarioAtual = formatarHorarioSeguro(
        agendamento?.horario || agendamento?.horaInicio || agendamento?.dataHora
      )

      const livres = lista
        .filter((i) =>
          typeof i === 'string'
            ? true
            : i?.bloqueado !== true && i?.ocupado !== true
        )
        .map((i) =>
          typeof i === 'string'
            ? formatarHorarioSeguro(i)
            : formatarHorarioSeguro(i?.slot)
        )
        .filter((h) => h && h !== '-' && h !== horarioAtual)

      setHorariosDisponiveis([...new Set(livres)])
    } catch (error) {
      setHorariosDisponiveis([])
      toast.error(erroApi(error, 'Não foi possível carregar os horários.'))
    } finally {
      setLoadingHorarios(false)
    }
  }

  async function handleRemarcar(e) {
    e.preventDefault()
    if (!novaData || !novoHorario) { toast.error('Selecione nova data e horário.'); return }
    setLoadingRe(true)
    try {
      const ok = await onRemarcar(agendamento.id, { novaData, novoHorario })
      if (ok) onClose()
    } finally { setLoadingRe(false) }
  }

  async function handleCancelar() {
    setLoadingCan(true)
    try {
      const ok = await onCancelar(agendamento.id)
      if (ok) onClose()
    } finally { setLoadingCan(false) }
  }

  function handleWhatsApp() {
    const tel = normalizarTelefoneBR(telefoneBruto)
    if (!tel) { toast.error('Telefone do cliente não encontrado.'); return }
    const msg = encodeURIComponent(
      `Olá, ${nomeCliente}! Passando para lembrar do seu agendamento de ${nomeServico} no dia ${dataAgendamento} às ${horarioAgendamento}.`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }


<DisparoEmMassa />
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Detalhes do Agendamento</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm font-body mb-4">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Cliente</span>
            <span>{nomeCliente}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Serviço</span>
            <span>{nomeServico}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Data</span>
            <span>{dataAgendamento}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Horário</span>
            <span>{horarioAgendamento}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Tipo</span>
            <span className="capitalize">{agendamento?.tipo || 'individual'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Status</span>
            <span>{statusAgendamentoLabel(agendamento?.status)}</span>
          </div>
        </div>

        {isGerente && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full border border-green-600 text-green-700 py-2 rounded-lg text-sm font-body hover:bg-green-50 flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle size={14} /> Enviar lembrete no WhatsApp
          </button>
        )}

        {!podeAlterar && statusAtual !== 'CANCELADO' && (
          <p className="text-xs text-destructive font-body bg-destructive/10 rounded-lg px-3 py-2 mb-4">
            Prazo de cancelamento/remarcação expirado (D-2).
          </p>
        )}

        {mostrarAcoes && (
          <>
            <form onSubmit={handleRemarcar} className="flex flex-col gap-3 mb-4">
              <p className="text-sm font-medium font-body">Remarcar para:</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) return
                    setNovaData(val)
                    setNovoHorario('')
                    fetchHorariosDisponiveis(val)
                  }}
                  min={todayISO()}
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
                <select
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  disabled={!novaData || loadingHorarios || horariosDisponiveis.length === 0}
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body disabled:opacity-60"
                >
                  <option value="">
                    {loadingHorarios ? 'Carregando...' : !novaData ? 'Selecione a data' : horariosDisponiveis.length === 0 ? 'Sem horários' : 'Selecione o horário'}
                  </option>
                  {horariosDisponiveis.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingRe || !novaData || !novoHorario}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loadingRe && <Loader2 size={14} className="animate-spin" />}
                <RefreshCw size={14} /> Remarcar
              </button>
            </form>

            <button
              type="button"
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

// ─── SlotsDoDia (gerente only) ────────────────────────────────────────────────

function SlotsDoDia() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataSelecionada, setDataSelecionada] = useState(todayISO())

  const fetchSlots = useCallback(async (data) => {
    setLoading(true)
    try {
      // ✅ FIX: API espera ?date=
      const response = await apiClient.get(`/agenda/slots?date=${data}`)
      const payload = extrairPayload(response)
      const lista = Array.isArray(payload)
        ? payload
        : payload?.slots || payload?.horarios || payload?.data || []

      const normalizados = lista
        .map((item) =>
          typeof item === 'string'
            ? { horario: formatarHorarioSeguro(item), livre: true }
            : { horario: formatarHorarioSeguro(item?.slot || item?.horario), livre: item?.bloqueado !== true && item?.ocupado !== true }
        )
        .filter((s) => s.horario && s.horario !== '-')

      setSlots(normalizados)
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSlots(dataSelecionada) }, [dataSelecionada, fetchSlots])

  const livres = slots.filter((s) => s.livre)
  const ocupados = slots.filter((s) => !s.livre)

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Clock size={16} className="text-primary" />
          <span className="font-sans font-semibold text-sm text-foreground">Horários do Dia</span>
          {!loading && slots.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              {livres.length} livre{livres.length !== 1 ? 's' : ''} · {ocupados.length} ocupado{ocupados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-body">Carregando horários...</span>
        </div>
      ) : slots.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body py-1">Nenhum horário cadastrado para este dia.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <span
              key={s.horario}
              className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${s.livre
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-muted text-muted-foreground border border-border line-through'
                }`}
            >
              {s.horario}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AgendamentosPage ─────────────────────────────────────────────────────────

export default function AgendamentosPage() {
  const { isGerente, user } = useUser()

  const [todosAgendamentos, setTodosAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)

  const [filtroData, setFiltroData] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modoPeriodo, setModoPeriodo] = useState(false)

  const temFiltro = filtroData || filtroDataInicio || filtroDataFim || filtroStatus || filtroTipo

  function limparFiltros() {
    setFiltroData('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setFiltroStatus('')
    setFiltroTipo('')
  }

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (!modoPeriodo && filtroData) params.set('data', filtroData)
      if (filtroStatus) params.set('status', statusParaApi(filtroStatus))
      if (filtroTipo) params.set('tipo', filtroTipo)

      const url = `/agendamentos${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiClient.get(url)
      const payload = extrairPayload(response)

      const listaBruta = Array.isArray(payload)
        ? payload
        : payload?.agendamentos ||
        payload?.agendamento ||
        payload?.items ||
        payload?.rows ||
        payload?.result ||
        payload?.results ||
        payload?.data?.agendamentos ||
        payload?.data?.items ||
        payload?.data?.rows ||
        payload?.data ||
        []

      const listaNormalizada = Array.isArray(listaBruta)
        ? listaBruta.map(normalizarAgendamento)
        : []

      const listaFinal = isGerente
        ? listaNormalizada
        : listaNormalizada.filter((item) => pertenceAoUsuario(item, user))

      setTodosAgendamentos(listaFinal)
    } catch (error) {
      setTodosAgendamentos([])
      // ✅ FIX: prioriza msg do backend
      toast.error(erroApi(error, 'Erro ao carregar agendamentos.'))
    } finally {
      setLoading(false)
    }
  }, [filtroData, filtroStatus, filtroTipo, modoPeriodo, isGerente, user])

  useEffect(() => { fetchAgendamentos() }, [fetchAgendamentos])

  const agendamentos = useMemo(() => {
    if (!modoPeriodo) return todosAgendamentos
    return filtrarPorPeriodo(todosAgendamentos, filtroDataInicio, filtroDataFim)
  }, [todosAgendamentos, modoPeriodo, filtroDataInicio, filtroDataFim])

  async function handleRemarcar(id, { novaData, novoHorario }) {
    try {
      await apiClient.patch(`/agendamentos/${id}`, { novaData, novoHorario })
      toast.success('Agendamento remarcado!')
      await fetchAgendamentos()
      setSelecionado((atual) =>
        atual?.id === id
          ? { ...atual, data: novaData, horario: novoHorario, horaInicio: novoHorario, dataHora: montarDataHora(novaData, novoHorario), status: 'REMARCADO' }
          : atual
      )
      return true
    } catch (error) {
      // ✅ FIX: prioriza msg do backend
      toast.error(erroApi(error, 'Não foi possível remarcar.'))
      return false
    }
  }

  async function handleCancelar(id) {
    try {
      await apiClient.patch(`/agendamentos/${id}/cancelar`)
      toast.success('Agendamento cancelado.')
      await fetchAgendamentos()
      setSelecionado((atual) => atual?.id === id ? { ...atual, status: 'CANCELADO' } : atual)
      return true
    } catch (error) {
      // ✅ FIX: prioriza msg do backend
      toast.error(erroApi(error, 'Não foi possível cancelar.'))
      return false
    }
  }

  const tituloDescricao = useMemo(() => {
    if (isGerente) return { titulo: 'Agendamentos', descricao: 'Gerencie todos os agendamentos' }
    return { titulo: 'Meus Agendamentos', descricao: 'Acompanhe seus agendamentos' }
  }, [isGerente])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold text-foreground">{tituloDescricao.titulo}</h1>
        <p className="text-muted-foreground font-body mt-1 text-sm">{tituloDescricao.descricao}</p>
      </div>

      {isGerente && <SlotsDoDia />}

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">

          <div>
            <label className="block text-xs font-body text-muted-foreground mb-1">Modo</label>
            <div className="flex rounded-lg overflow-hidden border border-input text-sm font-body">
              <button
                type="button"
                onClick={() => { setModoPeriodo(false); setFiltroDataInicio(''); setFiltroDataFim('') }}
                className={`px-3 py-2 transition-colors ${!modoPeriodo ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
              >
                Data
              </button>
              <button
                type="button"
                onClick={() => { setModoPeriodo(true); setFiltroData('') }}
                className={`px-3 py-2 transition-colors ${modoPeriodo ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
              >
                Período
              </button>
            </div>
          </div>

          {!modoPeriodo ? (
            <div>
              <label className="block text-xs font-body text-muted-foreground mb-1">Data</label>
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">De</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  max={filtroDataFim || undefined}
                  className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <div className="flex items-end pb-2.5">
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">Até</label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  min={filtroDataInicio || undefined}
                  className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-body text-muted-foreground mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="">Todos</option>
              <option value="AGENDADO">Agendado</option>
              <option value="PENDENTE">Pendente</option>
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

          {temFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-body pb-0.5"
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <CalendarDays size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground font-body">
            {isGerente ? 'Nenhum agendamento encontrado.' : 'Você ainda não possui agendamentos.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  {isGerente && <th className="px-4 py-3 font-medium">Cliente</th>}
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium">Data/Hora</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((a, i) => (
                  <tr key={a?.id || i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {isGerente && <td className="px-4 py-3">{a?.clienteNome || '-'}</td>}
                    <td className="px-4 py-3">{a?.servicoNome || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a?.dataHora || a?.data)}{' '}
                      {formatarHorarioSeguro(a?.horario || a?.horaInicio || a?.dataHora)}
                    </td>
                    <td className="px-4 py-3 capitalize">{a?.tipo || 'individual'}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(a?.status)}>
                        {statusAgendamentoLabel(a?.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
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
          isGerente={isGerente}
          onClose={() => setSelecionado(null)}
          onRemarcar={handleRemarcar}
          onCancelar={handleCancelar}
        />
      )}
    </div>
  )
}