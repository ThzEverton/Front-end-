'use client'

import { useEffect, useMemo, useState, useCallback, useLayoutEffect, useRef } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import DisparoEmMassa from '@/components/DisparoEmMassa'
import { useRelatorio } from '@/components/Relatorios'
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
  ChevronLeft,
  Download,
  HelpCircle,
  Check,
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
  const criador = item?.criadoPor || null
  const cliente = participante || criador

  return {
    ...item,
    cliente,
    clienteId: participante?.id || criador?.id || null,
    clienteNome: participante?.nome || criador?.nome || '-',
    clienteEmail: participante?.email || criador?.email || '',
    telefone: participante?.telefone || criador?.telefone || '',
    servicoNome: item?.servico?.nome || '-',
    horario: item?.horaInicio || '',
    dataHora: montarDataHora(item?.data, item?.horaInicio),
    status: normalizarStatus(item?.status),
    tipo: item?.tipo || 'individual',
  }
}

function pertenceAoUsuario(agendamento, user) {
  if (!user) return true
  const userId = user?.id
  const userEmail = String(user?.email || '').toLowerCase()

  const ids = [
    agendamento?.participante?.id,
    agendamento?.clienteId,
    agendamento?.criadoPor?.id,
  ].filter(Boolean)

  const emails = [
    agendamento?.participante?.email,
    agendamento?.clienteEmail,
    agendamento?.criadoPor?.email,
  ].filter(Boolean).map((e) => String(e).toLowerCase())

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

// ─── TourTooltip ──────────────────────────────────────────────────────────────
//
// Tooltip do tour que se ancora no elemento via getBoundingClientRect.
// Usa position: fixed para funcionar dentro de modais (escapa do stacking context).

const TOOLTIP_W = 272
const TOUR_GAP = 14
const TOUR_MARGIN = 12

function TourTooltip({ step, index, total, onNext, onPrev, onStop }) {
  const [pos, setPos] = useState(null)
  const tooltipRef = useRef()
  const isLast = index === total - 1

  useLayoutEffect(() => {
    if (!step?.id) return

    function calcPosition() {
      const el = document.getElementById(step.id)
      if (!el) return

      const rect = el.getBoundingClientRect()
      const tipH = tooltipRef.current?.offsetHeight || 150
      const vp = { w: window.innerWidth, h: window.innerHeight }

      // Vertical: prefere abaixo, sobe se não couber
      let top = rect.bottom + TOUR_GAP
      if (top + tipH > vp.h - TOUR_MARGIN) top = rect.top - tipH - TOUR_GAP
      if (top < TOUR_MARGIN) top = TOUR_MARGIN

      // Horizontal: alinha com esquerda do elemento, clamp para não sair da tela
      let left = rect.left
      if (left + TOOLTIP_W > vp.w - TOUR_MARGIN) left = vp.w - TOOLTIP_W - TOUR_MARGIN
      if (left < TOUR_MARGIN) left = TOUR_MARGIN

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setPos({ top, left, targetRect: rect })
    }

    calcPosition()
    const t1 = setTimeout(calcPosition, 160)
    const t2 = setTimeout(calcPosition, 320)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  if (!step || !pos) return null

  const { targetRect } = pos

  return (
  <>
    {/* Overlay escurecido com furo destacando o elemento alvo */}
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%">
        <defs>
          <mask id="tour-highlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 20}
              y={targetRect.top - 20}
              width={targetRect.width + 40}
              height={targetRect.height + 40}
              rx="10"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.48)"
          mask="url(#tour-highlight-mask)"
        />
        <rect
          x={targetRect.left - 20}
          y={targetRect.top - 20}
          width={targetRect.width + 40}
          height={targetRect.height + 40}
          rx="10"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2"
        />
      </svg>
    </div>

    {/* Card do tooltip */}
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="false"
      aria-label={step.title}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 'min(90vw, 320px)',       // ✅ largura responsiva
        maxWidth: 'calc(100vw - 24px)',  // ✅ evita estourar tela
      }}
      className="bg-card border border-border rounded-2xl shadow-2xl p-4 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-sans font-bold text-sm text-card-foreground leading-snug">
          {step.title}
        </p>
        <button
          onClick={onStop}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          aria-label="Fechar tour"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-xs text-muted-foreground font-body mb-4 leading-relaxed">
        {step.body}
      </p>

      {/* 🔥 RODAPÉ CORRIGIDO */}
      <div className="flex flex-col gap-3">
        {/* Indicadores */}
        <div className="flex items-center gap-1 overflow-hidden">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`inline-block rounded-full transition-all shrink-0 ${
                i === index ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2">
          {index > 0 && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 text-xs border border-border px-2.5 py-1.5 rounded-lg font-body hover:bg-muted transition-colors whitespace-nowrap"
            >
              <ChevronLeft size={12} /> Anterior
            </button>
          )}

          <button
            onClick={onNext}
            className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg font-body hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {isLast ? (
              <><Check size={12} /> Entendi!</>
            ) : (
              <>Próximo <ChevronRight size={12} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  </>
)
}

// ─── useTour ──────────────────────────────────────────────────────────────────

function buildSteps(isGerente) {
  return [
    {
      id: 'tour-ag-titulo',
      title: '📋 Bem-vindo aos Agendamentos',
      body: 'Aqui você acompanha todos os agendamentos. Vamos conhecer cada parte da página!',
    },
    // Slots do dia — só gerente vê esse bloco
    ...(isGerente ? [
      {
        id: 'tour-ag-slots',
        title: '🕐 Horários do dia',
        body: 'Veja de forma rápida quais slots estão livres e ocupados. Troque a data para consultar outro dia.',
      },
      {
        id: 'tour-ag-disparo',
        title: '📣 Disparo em massa',
        body: 'Envie lembretes via WhatsApp para vários clientes de uma vez. Muito útil antes de um dia cheio.',
      },
      {
        id: 'tour-ag-relatorio',
        title: '📥 Relatório',
        body: 'Exporte todos os agendamentos filtrados para CSV — prático para planilhas e análises.',
      },
    ] : []),
    {
      id: 'tour-ag-filtros',
      title: '🔍 Filtros',
      body: 'Filtre por data exata ou período, status (Agendado, Cancelado…) e tipo (Individual ou Turma). Clique em Limpar para resetar.',
    },
    {
      id: 'tour-ag-tabela',
      title: '📊 Lista de agendamentos',
      body: 'Cada linha é um agendamento. Clique em "Detalhes" para ver informações completas, remarcar ou cancelar.',
      onLeave: 'openDetalheModal',
    },
    // Passos dentro do modal de detalhes
    {
      id: 'tour-ag-modal-info',
      title: '👤 Informações do agendamento',
      body: 'Aqui ficam cliente, serviço, data, horário, tipo e status — tudo num só lugar.',
      insideModal: 'detalhe',
    },
    ...(isGerente ? [
      {
        id: 'tour-ag-modal-whatsapp',
        title: '💬 Lembrete no WhatsApp',
        body: 'Abre o WhatsApp com uma mensagem de lembrete pré-preenchida para o cliente.',
        insideModal: 'detalhe',
      },
    ] : []),
    {
      id: 'tour-ag-modal-remarcar',
      title: '🔄 Remarcar',
      body: 'Escolha nova data e horário disponíveis. O sistema carrega automaticamente os slots livres.',
      insideModal: 'detalhe',
    },
    {
      id: 'tour-ag-modal-cancelar',
      title: '❌ Cancelar agendamento',
      body: 'Cancela o agendamento. Só disponível até D-2 antes da data marcada.',
      insideModal: 'detalhe',
      onLeave: 'closeDetalheModal',
    },
  ]
}

function useTour({ isGerente, setTourDetalheOpen }) {
  const [stepIndex, setStepIndex] = useState(-1)
  const steps = useMemo(() => buildSteps(isGerente), [isGerente])
  const tourActive = stepIndex >= 0 && stepIndex < steps.length

  const runActions = useCallback((s, direction) => {
    const hook = direction === 'enter' ? s?.onEnter : s?.onLeave
    if (!hook) return
    if (hook === 'openDetalheModal')  setTourDetalheOpen(true)
    if (hook === 'closeDetalheModal') setTourDetalheOpen(false)
  }, [setTourDetalheOpen])

  const start = useCallback(() => {
    setStepIndex(0)
    setTimeout(() => runActions(steps[0], 'enter'), 0)
  }, [steps, runActions])

  const next = useCallback(() => {
    runActions(steps[stepIndex], 'leave')
    const nextIdx = stepIndex + 1
    if (nextIdx >= steps.length) { setStepIndex(-1); return }
    setStepIndex(nextIdx)
    setTimeout(() => runActions(steps[nextIdx], 'enter'), 60)
  }, [stepIndex, steps, runActions])

  const prev = useCallback(() => {
    const prevIdx = stepIndex - 1
    if (prevIdx < 0) return
    runActions(steps[stepIndex], 'leave')
    setStepIndex(prevIdx)
    setTimeout(() => runActions(steps[prevIdx], 'enter'), 60)
  }, [stepIndex, steps, runActions])

  const stop = useCallback(() => {
    runActions(steps[stepIndex], 'leave')
    setStepIndex(-1)
  }, [stepIndex, steps, runActions])

  return {
    tourActive,
    currentStep: steps[stepIndex] ?? null,
    stepIndex,
    totalSteps: steps.length,
    start, next, prev, stop,
  }
}

// ─── DetalheModal ─────────────────────────────────────────────────────────────

function DetalheModal({ agendamento, isGerente, isTour = false, onClose, onRemarcar, onCancelar }) {
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
  const mostrarAcoes = isTour || (podeAlterar && statusAtual !== 'CANCELADO' && statusAtual !== 'CONCLUIDO')

  async function fetchHorariosDisponiveis(data) {
    if (!data) { setHorariosDisponiveis([]); return }

    let dataFormatada = null
    if (data instanceof Date) {
      dataFormatada = data.toISOString().split('T')[0]
    } else if (typeof data === 'string' && data.includes('/')) {
      const [dia, mes, ano] = data.split('/')
      dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    } else if (typeof data === 'string' && data.includes('-')) {
      dataFormatada = data
    }

    if (!dataFormatada) { setHorariosDisponiveis([]); toast.error('Data inválida'); return }

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
        .filter((i) => typeof i === 'string' ? true : i?.bloqueado !== true && i?.ocupado !== true)
        .map((i) => typeof i === 'string' ? formatarHorarioSeguro(i) : formatarHorarioSeguro(i?.slot))
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
    if (isTour) return
    if (!novaData || !novoHorario) { toast.error('Selecione nova data e horário.'); return }
    setLoadingRe(true)
    try {
      const ok = await onRemarcar(agendamento.id, { novaData, novoHorario })
      if (ok) onClose()
    } finally {
      setLoadingRe(false)
    }
  }

  async function handleCancelar() {
    if (isTour) return
    setLoadingCan(true)
    try {
      const ok = await onCancelar(agendamento.id)
      if (ok) onClose()
    } finally {
      setLoadingCan(false)
    }
  }

  function handleWhatsApp() {
    if (isTour) return
    const tel = normalizarTelefoneBR(telefoneBruto)
    if (!tel) { toast.error('Telefone do cliente não encontrado.'); return }
    const msg = encodeURIComponent(
      `Olá, ${nomeCliente}! Passando para lembrar do seu agendamento de ${nomeServico} no dia ${dataAgendamento} às ${horarioAgendamento}.`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Detalhes do Agendamento</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Informações — id para o tour apontar */}
        <div id="tour-ag-modal-info" className="grid grid-cols-2 gap-3 text-sm font-body mb-4">
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

        {/* WhatsApp — id para o tour (gerente) */}
        {isGerente && (
          <div id="tour-ag-modal-whatsapp">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full border border-green-600 text-green-700 py-2 rounded-lg text-sm font-body hover:bg-green-50 flex items-center justify-center gap-2 mb-4"
            >
              <MessageCircle size={14} /> Enviar lembrete no WhatsApp
            </button>
          </div>
        )}

        {!podeAlterar && !isTour && statusAtual !== 'CANCELADO' && (
          <p className="text-xs text-destructive font-body bg-destructive/10 rounded-lg px-3 py-2 mb-4">
            Prazo de cancelamento/remarcação expirado (D-2).
          </p>
        )}

        {mostrarAcoes && (
          <>
            {/* Remarcar — id para o tour */}
            <form id="tour-ag-modal-remarcar" onSubmit={handleRemarcar} className="flex flex-col gap-3 mb-4">
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
                  {horariosDisponiveis.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingRe || (!isTour && (!novaData || !novoHorario))}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loadingRe && <Loader2 size={14} className="animate-spin" />}
                <RefreshCw size={14} /> Remarcar
              </button>
            </form>

            {/* Cancelar — id para o tour */}
            <button
              id="tour-ag-modal-cancelar"
              type="button"
              onClick={handleCancelar}
              disabled={loadingCan || isTour}
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
      const response = await apiClient.get(`/agenda/slots?date=${data}`)
      const payload = extrairPayload(response)
      const lista = Array.isArray(payload)
        ? payload
        : payload?.slots || payload?.horarios || payload?.data || []

      const normalizados = lista
        .map((item) =>
          typeof item === 'string'
            ? { horario: formatarHorarioSeguro(item), livre: true }
            : {
                horario: formatarHorarioSeguro(item?.slot || item?.horario),
                livre: item?.bloqueado !== true && item?.ocupado !== true,
              }
        )
        .filter((s) => s.horario && s.horario !== '-')

      setSlots(normalizados)
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots(dataSelecionada)
  }, [dataSelecionada, fetchSlots])

  const livres = slots.filter((s) => s.livre)
  const ocupados = slots.filter((s) => !s.livre)

  return (
    // id para o tour apontar
    <div id="tour-ag-slots" className="bg-card border border-border rounded-xl p-4 mb-6">
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
        <p className="text-xs text-muted-foreground font-body py-1">
          Nenhum horário cadastrado para este dia.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <span
              key={s.horario}
              className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${
                s.livre
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
  const { abrirRelatorio } = useRelatorio()
  const [todosAgendamentos, setTodosAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)

  const [filtroData, setFiltroData] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modoPeriodo, setModoPeriodo] = useState(false)

  // Estado controlado pelo tour para abrir o modal de detalhes com dados fictícios
  const [tourDetalheOpen, setTourDetalheOpen] = useState(false)

  const TOUR_AGENDAMENTO = {
    id: 'tour-fake',
    clienteNome: 'Ana Paula Silva',
    servicoNome: 'Massagem Relaxante',
    data: todayISO(),
    horaInicio: '10:00',
    horario: '10:00',
    dataHora: `${todayISO()}T10:00`,
    tipo: 'individual',
    status: 'AGENDADO',
    telefone: '11999990000',
  }

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
      toast.error(erroApi(error, 'Erro ao carregar agendamentos.'))
    } finally {
      setLoading(false)
    }
  }, [filtroData, filtroStatus, filtroTipo, modoPeriodo, isGerente, user])

  useEffect(() => {
    fetchAgendamentos()
  }, [fetchAgendamentos])

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
      toast.error(erroApi(error, 'Não foi possível remarcar.'))
      return false
    }
  }

  async function handleCancelar(id) {
    try {
      await apiClient.put(`/agendamentos/${id}/cancelar`)
      toast.success('Agendamento cancelado.')
      await fetchAgendamentos()
      setSelecionado((atual) => atual?.id === id ? { ...atual, status: 'CANCELADO' } : atual)
      return true
    } catch (error) {
      toast.error(erroApi(error, 'Não foi possível cancelar.'))
      return false
    }
  }

  function handleRelatorio() {
    abrirRelatorio({
      registros: agendamentos.map((a) => ({
        dataRef: a?.dataHora || a?.data,
        descricao: `${a?.servicoNome} — ${a?.clienteNome}`,
        formaPagto: '-',
        valor: 0,
        status: a?.status?.toLowerCase(),
        tipo: 'RECEITA',
      })),
      titulo: 'Relatório de Agendamentos',
      eyebrow: 'Sala Rosa · Agenda',
      statusFiltro: '',
      tipo: 'TODOS',
      accentColor: '#d4537e',
      nomeArquivo: 'agendamentos_sala_rosa.csv',
    })
  }

  const { tourActive, currentStep, stepIndex, totalSteps, start, next, prev, stop } = useTour({
    isGerente,
    setTourDetalheOpen,
  })

  const tituloDescricao = useMemo(() => {
    if (isGerente) return { titulo: 'Agendamentos', descricao: 'Gerencie todos os agendamentos' }
    return { titulo: 'Meus Agendamentos', descricao: 'Acompanhe seus agendamentos' }
  }, [isGerente])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div id="tour-ag-titulo">
          <h1 className="font-sans text-3xl font-bold text-foreground">{tituloDescricao.titulo}</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">{tituloDescricao.descricao}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de ajuda — inicia o tour */}
          <button
            onClick={start}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors text-muted-foreground"
            title="Ver tour guiado"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Ajuda</span>
          </button>

          {isGerente && (
            <button
              id="tour-ag-relatorio"
              onClick={handleRelatorio}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <Download size={16} /> Relatório
            </button>
          )}
        </div>
      </div>

      {/* Slots do dia (gerente) */}
      {isGerente && <SlotsDoDia />}

      {/* Disparo em massa (gerente) */}
      {isGerente && (
        <div id="tour-ag-disparo">
          <DisparoEmMassa />
        </div>
      )}

      {/* Filtros */}
      <div id="tour-ag-filtros" className="bg-card border border-border rounded-xl p-4 mb-6">
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

      {/* Lista */}
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
        <div id="tour-ag-tabela" className="bg-card border border-border rounded-xl overflow-hidden">
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
                  <tr
                    key={a?.id || i}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
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

      {/* Modal de detalhes — abre via clique na tabela OU pelo tour */}
      {(selecionado || tourDetalheOpen) && (
        <DetalheModal
          agendamento={selecionado || TOUR_AGENDAMENTO}
          isGerente={isGerente}
          isTour={tourDetalheOpen && !selecionado}
          onClose={() => { setSelecionado(null); setTourDetalheOpen(false) }}
          onRemarcar={handleRemarcar}
          onCancelar={handleCancelar}
        />
      )}

      {/* Tour tooltip — renderizado no final do DOM para z-index acima de tudo */}
      {tourActive && (
        <TourTooltip
          step={currentStep}
          index={stepIndex}
          total={totalSteps}
          onNext={next}
          onPrev={prev}
          onStop={stop}
        />
      )}
    </div>
  )
}