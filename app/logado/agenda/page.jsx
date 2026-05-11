
'use client'

import { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react'
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
  HelpCircle,
  Check,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDateOnly(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
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
  const status = String(slot?.status || '').toLowerCase().trim()
  return (
    slot?.ocupado === true ||
    slot?.ocupado === 1 ||
    slot?.ocupado === '1' ||
    slot?.ocupado === 'true' ||
    ['ocupado', 'ativo', 'confirmado', 'agendado'].includes(status)
  )
}

// ─── TourTooltip ─────────────────────────────────────────────────────────────
//
// Tooltip do tour que se ancora no elemento via getBoundingClientRect.
// Usa position: fixed para funcionar tanto fora quanto dentro de modais
// (escapa do stacking context do z-index do modal).

// Largura fixa do tooltip — usada pelo cálculo de posição para
// evitar depender de offsetWidth antes do primeiro paint.
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

    // Tenta 3x: imediato, após 160ms (modal abrindo) e 320ms (garantia)
    calcPosition()
    const t1 = setTimeout(calcPosition, 160)
    const t2 = setTimeout(calcPosition, 320)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  if (!step || !pos) return null

  const { targetRect } = pos

  return (
    <>
      {/* Overlay escurecido com "furo" destacando o elemento alvo */}
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
          {/* Borda de destaque ao redor do elemento */}
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
          width: TOOLTIP_W,
        }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-4 animate-fade-in"
      >
        {/* Cabeçalho */}
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

        {/* Corpo */}
        <p className="text-xs text-muted-foreground font-body mb-4 leading-relaxed">
          {step.body}
        </p>

        {/* Rodapé: progresso + navegação */}
        <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
          {/* Indicadores de passo */}
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full transition-all shrink-0 ${i === index
                    ? 'w-4 h-1.5 bg-primary'
                    : 'w-1.5 h-1.5 bg-border'
                  }`}
              />
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-2 shrink-0">
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
//
// Hook que controla o tour via estado React.
// Cada passo pode ter:
//   onEnter: ação disparada ao entrar no passo ('openAgendarModal' | 'openConfigModal')
//   onLeave:  ação disparada ao sair do passo  ('closeAgendarModal' | 'closeConfigModal')
//   insideModal: indicativo de que o elemento alvo está dentro de um modal
//                (usado para documentação; o posicionamento é automático via getBoundingClientRect)

function buildSteps(isGerente) {
  const steps = [
    {
      id: 'tour-agenda-titulo',
      title: '📅 Bem-vindo à Agenda',
      body: 'Aqui você visualiza e gerencia todos os horários disponíveis. Vamos conhecer cada funcionalidade!',
    },
    {
      id: 'tour-agenda-navegacao',
      title: '📆 Navegação de datas',
      body: 'Use as setas para avançar ou voltar um dia, ou clique no campo de data para escolher um dia específico.',
    },
    {
      id: 'tour-agenda-legenda',
      title: '🎨 Legenda de status',
      body: 'Verde = disponível para agendamento. Azul = horário já ocupado. Cinza = bloqueado.',
    },
    {
      id: 'tour-agenda-slots',
      title: '🕐 Horários disponíveis',
      body: 'Clique em qualquer slot verde para agendar. Vamos ver como o formulário funciona!',
      onLeave: 'openAgendarModal',
    },
    // Passos dentro do modal de agendamento
    {
      id: 'tour-modal-servico',
      title: '💆 Escolha o serviço',
      body: 'Selecione aqui qual serviço deseja agendar neste horário.',
      insideModal: 'agendar',
    },
    {
      id: 'tour-modal-tipo',
      title: '👥 Tipo de atendimento',
      body: 'Individual = só você. Turma = grupo de alunos. Turmas ocupam 2 slots consecutivos.',
      insideModal: 'agendar',
    },
    {
      id: 'tour-modal-acoes',
      title: '✅ Confirmar ou cancelar',
      body: 'Quando estiver pronto, clique em Confirmar. O slot ficará ocupado imediatamente.',
      insideModal: 'agendar',
      onLeave: 'closeAgendarModal',
    },
    // Passos exclusivos para gerentes
    ...(isGerente
      ? [
        {
          id: 'tour-agenda-config',
          title: '⚙️ Configurar agenda',
          body: 'Como gerente, você define horários de funcionamento e a duração de cada slot. Veja como!',
          onLeave: 'openConfigModal',
        },
        {
          id: 'tour-config-semana',
          title: '📅 Dias úteis',
          body: 'Defina o início e fim do atendimento de segunda a sexta-feira.',
          insideModal: 'config',
        },
        {
          id: 'tour-config-fimdesemana',
          title: '🏖️ Fim de semana',
          body: 'Opcional. Deixe em branco se não atender aos sábados e domingos.',
          insideModal: 'config',
        },
        {
          id: 'tour-config-duracao',
          title: '⏱️ Duração do slot',
          body: 'Múltiplo de 15 min. Ex: 30, 45 ou 60. Isso define de quantos em quantos minutos aparecem os horários.',
          insideModal: 'config',
          onLeave: 'closeConfigModal',
        },
        {
          id: 'tour-agenda-slots',
          title: '🔒 Bloquear / Liberar horários',
          body: 'Como gerente você vê os botões Bloquear e Liberar em cada slot. Use para reservar horários para folgas ou reuniões.',
        },
      ]
      : []),
  ]

  return steps
}

function useTour({ isGerente, setTourAgendarOpen, setTourConfigOpen }) {
  const [stepIndex, setStepIndex] = useState(-1)
  const steps = buildSteps(isGerente)
  const tourActive = stepIndex >= 0 && stepIndex < steps.length

  const runActions = useCallback(
    (s, direction) => {
      const hook = direction === 'enter' ? s?.onEnter : s?.onLeave
      if (!hook) return
      if (hook === 'openAgendarModal') setTourAgendarOpen(true)
      if (hook === 'closeAgendarModal') setTourAgendarOpen(false)
      if (hook === 'openConfigModal') setTourConfigOpen(true)
      if (hook === 'closeConfigModal') setTourConfigOpen(false)
    },
    [setTourAgendarOpen, setTourConfigOpen]
  )

  const start = useCallback(() => {
    setStepIndex(0)
    // onEnter do passo 0 (se houver) — neste caso não há, mas fica genérico
    setTimeout(() => runActions(steps[0], 'enter'), 0)
  }, [steps, runActions])

  const next = useCallback(() => {
    const current = steps[stepIndex]
    runActions(current, 'leave')

    const nextIdx = stepIndex + 1
    if (nextIdx >= steps.length) {
      setStepIndex(-1)
      return
    }
    setStepIndex(nextIdx)
    // Aguarda o modal abrir (transição CSS ~150ms) antes de disparar onEnter
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
    start,
    next,
    prev,
    stop,
  }
}

// ─── ConfigModal ─────────────────────────────────────────────────────────────

function ConfigModal({ config, isTour = false, onClose, onSave }) {
  const [inicioSemana, setInicioSemana] = useState(config?.horaInicioSemana?.slice(0, 5) || '08:00')
  const [fimSemana, setFimSemana] = useState(config?.horaFimSemana?.slice(0, 5) || '18:00')
  const [inicioFimSemana, setInicioFimSemana] = useState(config?.horaInicioFimSemana?.slice(0, 5) || '')
  const [fimFimSemana, setFimFimSemana] = useState(config?.horaFimFimSemana?.slice(0, 5) || '')
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
    if (timeToMinutes(fimSemana) <= timeToMinutes(inicioSemana)) {
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
    const preencheuInicio = !!inicioFimSemana && inicioFimSemana !== '00:00'
    const preencheuFim = !!fimFimSemana && fimFimSemana !== '00:00'

    if ((preencheuInicio && !preencheuFim) || (!preencheuInicio && preencheuFim)) {
      toast.error('Para configurar fim de semana, preencha início e fim.')
      return false
    }

    if (preencheuInicio && preencheuFim) {
      if (timeToMinutes(fimFimSemana) <= timeToMinutes(inicioFimSemana)) {
        toast.error('No fim de semana, o horário de fim deve ser maior que o horário de início.')
        return false
      }
    }
    return true
  }

  async function handleSave() {
    if (isTour) return // bloqueia submit acidental durante o tour
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
          <h3 className="font-sans text-lg font-bold text-card-foreground">Configurar Agenda</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Segunda a sexta — id para o tour */}
          <div id="tour-config-semana" className="border border-border rounded-xl p-4">
            <p className="text-sm font-semibold font-body mb-3 text-card-foreground">Segunda a sexta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Horário de início</label>
                <input
                  type="time"
                  value={inicioSemana}
                  onChange={(e) => setInicioSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Horário de fim</label>
                <input
                  type="time"
                  value={fimSemana}
                  onChange={(e) => setFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>
          </div>

          {/* Fim de semana — id para o tour */}
          <div id="tour-config-fimdesemana" className="border border-border rounded-xl p-4">
            <p className="text-sm font-semibold font-body mb-1 text-card-foreground">Sábado e domingo</p>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Deixe vazio caso não atenda no fim de semana.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Horário de início</label>
                <input
                  type="time"
                  value={inicioFimSemana}
                  onChange={(e) => setInicioFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Horário de fim</label>
                <input
                  type="time"
                  value={fimFimSemana}
                  onChange={(e) => setFimFimSemana(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>
          </div>

          {/* Duração — id para o tour */}
          <div id="tour-config-duracao">
            <label className="block text-sm font-medium font-body mb-1.5">Duração do slot (minutos)</label>
            <input
              type="number"
              min="15"
              step="15"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
            <p className="text-xs text-muted-foreground font-body mt-1">Use valores como 15, 30, 45 ou 60.</p>
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
            disabled={loading || isTour}
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

// ─── AgendarModal ─────────────────────────────────────────────────────────────

function AgendarModal({ slot, data, servicos, slots, isGerente, isTour = false, onClose, onConfirm }) {
  const [servicoId, setServicoId] = useState('')
  const [tipo, setTipo] = useState('individual')
  const [passo, setPasso] = useState(1)
  const [subTipo, setSubTipo] = useState('')
  const [codigoConvite, setCodigo] = useState('')
  const [paraUserId, setParaUserId] = useState('')
  const [clientes, setClientes] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isGerente) return
    setLoadingClientes(true)
    apiClient
      .get('/users')
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.users || []
        setClientes(
          lista.filter((u) => {
            const ativo = u.ativo !== false && u.ativo !== 0
            const cliente = (u.perfil || 'cliente') === 'cliente'
            return ativo && cliente
          })
        )
      })
      .catch(() => setClientes([]))
      .finally(() => setLoadingClientes(false))
  }, [isGerente])

  function proximoSlotDisponivel() {
    const horaAtual = getHoraSlot(slot)
    const idx = slots.findIndex((s) => getHoraSlot(s) === horaAtual)
    if (idx === -1 || idx + 1 >= slots.length) return false
    const proximo = slots[idx + 1]
    return proximo?.status === 'disponivel'
  }

  function handleProximo(e) {
    e.preventDefault()
    if (isTour) return // bloqueia submit acidental durante o tour
    if (!servicoId) { toast.error('Selecione um serviço.'); return }
    if (tipo === 'turma') {
      if (!proximoSlotDisponivel()) {
        toast.error('Turmas ocupam 2 horários consecutivos. O próximo horário não está disponível.')
        return
      }
      setPasso(2)
      return
    }
    handleSubmit()
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await onConfirm({ slot, data, servicoId, tipo, subTipo, codigoConvite, paraUserId })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarTurma(e) {
    e.preventDefault()
    if (isTour) return
    if (!subTipo) { toast.error('Escolha uma opção.'); return }
    if (subTipo === 'codigo' && !codigoConvite.trim()) { toast.error('Informe o código da turma.'); return }
    await handleSubmit()
  }

  const turmaIndisponivel = tipo === 'turma' && !proximoSlotDisponivel()

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

        {passo === 1 && (
          <form onSubmit={handleProximo} className="flex flex-col gap-4">
            {isGerente && (
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Agendar para</label>
                {loadingClientes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-body py-2">
                    <Loader2 size={14} className="animate-spin" /> Carregando clientes...
                  </div>
                ) : (
                  <select
                    value={paraUserId}
                    onChange={(e) => setParaUserId(e.target.value)}
                    className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                  >
                    <option value="">Mim mesmo</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Serviço — id para o tour */}
            <div id="tour-modal-servico">
              <label className="block text-sm font-medium font-body mb-1.5">Serviço</label>
              <select
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
                required={!isTour}
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              >
                <option value="">Selecione um serviço...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* Tipo — id para o tour */}
            <div id="tour-modal-tipo">
              <label className="block text-sm font-medium font-body mb-1.5">Tipo de atendimento</label>
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
              {turmaIndisponivel && (
                <p className="text-xs text-destructive font-body mt-2 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                  O próximo horário não está disponível. Turmas ocupam 2 slots consecutivos.
                </p>
              )}
            </div>

            {/* Botões — id para o tour apontar no último passo do modal */}
            <div id="tour-modal-acoes" className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isTour}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {tipo === 'turma' ? 'Próximo →' : 'Confirmar'}
              </button>
            </div>
          </form>
        )}

        {passo === 2 && (
          <form onSubmit={handleConfirmarTurma} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium font-body mb-2">O que deseja fazer?</label>
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

            {subTipo === 'nova' && (
              <p className="text-xs text-muted-foreground font-body bg-muted px-3 py-2 rounded-lg">
                A turma terá duração de 2 horas. Ficará pendente até a gerente aprovar.
              </p>
            )}

            {subTipo === 'codigo' && (
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">Código da turma</label>
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
                disabled={loading || !subTipo || isTour}
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

// ─── AgendaPage ───────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { isGerente } = useUser()
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [slots, setSlots] = useState([])
  const [config, setConfig] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [agendarSlot, setAgendarSlot] = useState(null)

  // Estados controlados exclusivamente pelo tour para abrir modais
  const [tourAgendarOpen, setTourAgendarOpen] = useState(false)
  const [tourConfigOpen, setTourConfigOpen] = useState(false)

  // Slot fictício usado quando o tour abre o modal de agendamento
  const TOUR_SLOT = { slot: '09:00', status: 'disponivel' }

  const { tourActive, currentStep, stepIndex, totalSteps, start, next, prev, stop } = useTour({
    isGerente,
    setTourAgendarOpen,
    setTourConfigOpen,
  })

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchSlots(date) {
    setLoading(true)
    try {
      const slotsData = await apiClient.get(`/agenda/slots?date=${date}`)
      const slotsArray = Array.isArray(slotsData) ? slotsData : slotsData?.slots || []

      const slotsFormatados = slotsArray.map((slot) => {
        const hora = getHoraSlot(slot)
        const bloqueado = isBloqueado(slot)
        const ocupado = isOcupado(slot)

        let status = 'disponivel'
        if (bloqueado) status = 'bloqueado'
        else if (ocupado) status = 'ocupado'

        return { ...slot, slot: hora, bloqueado, ocupado, status }
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

  // ── Handlers ───────────────────────────────────────────────────────────────

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
            typeof resp?.bloqueado === 'boolean' ? resp.bloqueado : !isBloqueado(item)
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

  async function handleAgendar({ slot, data, servicoId, tipo, subTipo, codigoConvite, paraUserId }) {
    try {
      const servicoIdNum = Number(servicoId)

      if (!servicoId || isNaN(servicoIdNum) || servicoIdNum <= 0) {
        toast.error('Selecione um serviço válido.')
        return
      }

      if (tipo === 'turma') {
        if (subTipo === 'nova') {
          const resp = await apiClient.post('/turmas', {
            servicoId: servicoIdNum,
            data,
            horaInicio: getHoraSlot(slot),
          })
          toast.success(`Turma criada! Código: ${resp.codigoConvite} — aguardando aprovação.`)
        } else if (subTipo === 'codigo') {
          if (!codigoConvite?.trim()) { toast.error('Informe o código da turma.'); return }
          await apiClient.post(`/turmas/convites/${codigoConvite.trim().toUpperCase()}/aceitar`)
          toast.success('Você entrou na turma com sucesso!')
        }
      } else {
        if (isGerente && paraUserId) {
          await apiClient.post('/agendamentos/gerente', {
            data,
            horaInicio: getHoraSlot(slot),
            servicoId: servicoIdNum,
            paraUserId: Number(paraUserId),
          })
        } else {
          await apiClient.post('/agendamentos', {
            data,
            horaInicio: getHoraSlot(slot),
            servicoId: servicoIdNum,
          })
        }
      }

      fetchSlots(selectedDate)
    } catch (error) {
      const msg = error?.response?.data?.msg || error?.message || 'Erro ao realizar agendamento.'
      console.error(msg)
      toast.error(msg)
    }
  }

  function slotColor(slot) {
    if (isBloqueado(slot)) return 'bg-muted text-muted-foreground border-border'
    if (isOcupado(slot)) return 'bg-primary/10 text-primary border-primary/20'
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer'
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div id="tour-agenda-titulo">
          <h1 className="font-sans text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Visualize e gerencie os horários disponíveis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de ajuda — inicia o tour */}
          <button
            id="tour-agenda-ajuda"
            onClick={start}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors text-muted-foreground"
            title="Ver tour guiado"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Ajuda</span>
          </button>

          {isGerente && (
            <button
              id="tour-agenda-config"
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <Settings size={16} /> Configurar agenda
            </button>
          )}
        </div>
      </div>

      {/* Navegação de datas */}
      <div id="tour-agenda-navegacao" className="flex items-center gap-3 mb-6">
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

      {/* Legenda */}
      <div id="tour-agenda-legenda" className="flex flex-wrap gap-4 mb-6 text-xs font-body">
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

      {/* Grid de slots */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground font-body">Nenhum slot configurado para esta data.</p>
        </div>
      ) : (
        <div
          id="tour-agenda-slots"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {slots.map((slot, i) => {
            const bloqueado = slot?.status === 'bloqueado'
            const ocupado = slot?.status === 'ocupado'
            const disponivel = slot?.status === 'disponivel'
            const hora = getHoraSlot(slot)

            return (
              <div
                key={i}
                className={`border rounded-xl px-3 py-3 flex flex-col items-center gap-2 transition-colors text-sm font-body ${slotColor(slot)}`}
                onClick={() => { if (disponivel) setAgendarSlot(slot) }}
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
                    onClick={(e) => { e.stopPropagation(); handleToggleBloqueio(slot) }}
                    className="mt-1 text-xs flex items-center gap-1 underline opacity-70 hover:opacity-100"
                  >
                    {bloqueado ? <><Unlock size={10} /> Liberar</> : <><Lock size={10} /> Bloquear</>}
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

      {/* ── Modais ─────────────────────────────────────────────────────────── */}

      {/* Config: abre via botão normal OU pelo tour */}
      {(showConfig || tourConfigOpen) && (
        <ConfigModal
          config={config}
          isTour={tourConfigOpen && !showConfig}
          onClose={() => { setShowConfig(false); setTourConfigOpen(false) }}
          onSave={handleSaveConfig}
        />
      )}

      {/* Agendar: abre via clique no slot OU pelo tour */}
      {(agendarSlot || tourAgendarOpen) && (
        <AgendarModal
          slot={agendarSlot || TOUR_SLOT}
          data={selectedDate}
          servicos={servicos}
          slots={slots}
          isGerente={isGerente}
          isTour={tourAgendarOpen && !agendarSlot}
          onClose={() => { setAgendarSlot(null); setTourAgendarOpen(false) }}
          onConfirm={handleAgendar}
        />
      )}

      {/* ── Tour tooltip ───────────────────────────────────────────────────── */}
      {/* Renderizado no final do DOM para garantir z-index acima de tudo */}
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
