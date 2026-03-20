'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import {
  formatDate,
  statusAgendamentoLabel,
  podeCancelarRemarcar,
  todayISO,
} from '@/utils/helpers'
import { toast } from 'sonner'
import { Loader2, RefreshCw, XCircle, X, MessageCircle } from 'lucide-react'

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

    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '-'
  }
}

function normalizarTelefoneBR(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '')
  if (!digitos) return ''
  if (digitos.startsWith('55')) return digitos
  return `55${digitos}`
}

function normalizarAgendamento(item) {
  const cliente =
    item?.cliente ||
    item?.usuario ||
    item?.aluno ||
    item?.participante ||
    item?.criadoPor ||
    item?.CriadoPor ||
    null

  return {
    ...item,
    cliente,
    clienteId:
      item?.clienteId ||
      item?.cliente?.id ||
      item?.usuario?.id ||
      item?.aluno?.id ||
      item?.participante?.id ||
      item?.criadoPor?.id ||
      item?.CriadoPor?.id ||
      null,
    clienteNome:
      item?.clienteNome ||
      item?.cliente?.nome ||
      item?.usuario?.nome ||
      item?.aluno?.nome ||
      item?.participante?.nome ||
      item?.criadoPor?.nome ||
      item?.CriadoPor?.nome ||
      '-',
    clienteEmail:
      item?.clienteEmail ||
      item?.cliente?.email ||
      item?.usuario?.email ||
      item?.aluno?.email ||
      item?.participante?.email ||
      item?.criadoPor?.email ||
      item?.CriadoPor?.email ||
      '',
    telefone:
      item?.telefone ||
      item?.cliente?.telefone ||
      item?.usuario?.telefone ||
      item?.aluno?.telefone ||
      item?.participante?.telefone ||
      item?.criadoPor?.telefone ||
      item?.CriadoPor?.telefone ||
      '',
    servicoNome: item?.servicoNome || item?.servico?.nome || '-',
    horario: item?.horario || item?.horaInicio || '',
    dataHora:
      item?.dataHora || montarDataHora(item?.data, item?.horario || item?.horaInicio),
    status: normalizarStatus(item?.status),
    tipo: item?.tipo || 'individual',
  }
}

function pertenceAoUsuario(agendamento, user) {
  if (!user) return true

  const userId = user?.id
  const userEmail = String(user?.email || '').toLowerCase()

  const idsPossiveis = [
    agendamento?.clienteId,
    agendamento?.cliente?.id,
    agendamento?.usuario?.id,
    agendamento?.aluno?.id,
    agendamento?.participante?.id,
    agendamento?.criadoPor?.id,
    agendamento?.CriadoPor?.id,
  ].filter(Boolean)

  const emailsPossiveis = [
    agendamento?.clienteEmail,
    agendamento?.cliente?.email,
    agendamento?.usuario?.email,
    agendamento?.aluno?.email,
    agendamento?.participante?.email,
    agendamento?.criadoPor?.email,
    agendamento?.CriadoPor?.email,
  ]
    .filter(Boolean)
    .map((email) => String(email).toLowerCase())

  if (userId && idsPossiveis.includes(userId)) return true
  if (userEmail && emailsPossiveis.includes(userEmail)) return true

  return false
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
    agendamento?.clienteNome ||
    agendamento?.cliente?.nome ||
    agendamento?.usuario?.nome ||
    agendamento?.aluno?.nome ||
    agendamento?.participante?.nome ||
    agendamento?.criadoPor?.nome ||
    agendamento?.CriadoPor?.nome ||
    'cliente'

  const nomeServico = agendamento?.servicoNome || agendamento?.servico?.nome || 'seu atendimento'

  const telefoneBruto =
    agendamento?.telefone ||
    agendamento?.cliente?.telefone ||
    agendamento?.usuario?.telefone ||
    agendamento?.aluno?.telefone ||
    agendamento?.participante?.telefone ||
    agendamento?.criadoPor?.telefone ||
    agendamento?.CriadoPor?.telefone ||
    ''

  const dataAgendamento = formatDate(agendamento?.dataHora || agendamento?.data)
  const horarioAgendamento = formatarHorarioSeguro(
    agendamento?.horario || agendamento?.horaInicio || agendamento?.dataHora
  )

  const statusAtual = agendamento?.status
  const mostrarAcoes = podeAlterar && statusAtual !== 'CANCELADO' && statusAtual !== 'CONCLUIDO'
async function fetchHorariosDisponiveis(dataSelecionada) {
  if (!dataSelecionada) {
    setHorariosDisponiveis([])
    return
  }

  setLoadingHorarios(true)

  try {
    const response = await apiClient.get('/agenda/slots', {
      params: {
        date: toISODate(dataSelecionada),
      },
    })

    const payload = extrairPayload(response)

    const lista = Array.isArray(payload)
      ? payload
      : payload?.slots || payload?.horarios || payload?.data || []

    const horarioAtual = formatarHorarioSeguro(
      agendamento?.horario ||
      agendamento?.horaInicio ||
      agendamento?.slot ||
      agendamento?.dataHora
    )

    const horariosLivres = lista
      .filter((item) => {
        if (typeof item === 'string') return true
        return item?.bloqueado !== true && item?.ocupado !== true
      })
      .map((item) => {
        if (typeof item === 'string') return formatarHorarioSeguro(item)
        return formatarHorarioSeguro(item?.slot)
      })
      .filter((hora) => Boolean(hora) && hora !== '-' && hora !== horarioAtual)

    setHorariosDisponiveis([...new Set(horariosLivres)])
  } catch (error) {
    console.error('Erro ao buscar slots da agenda:', error)
    console.error('Detalhes do backend:', error?.response?.data)

    setHorariosDisponiveis([])

    toast.error(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      `Erro ${error?.response?.status || ''}`.trim() ||
      'Não foi possível carregar os horários disponíveis.'
    )
  } finally {
    setLoadingHorarios(false)
  }
}

  async function handleRemarcar(e) {
    e.preventDefault()

    if (!novaData || !novoHorario) {
      toast.error('Selecione uma nova data e um horário disponível.')
      return
    }

    setLoadingRe(true)
    try {
      const ok = await onRemarcar(agendamento.id, { novaData, novoHorario })
      if (ok) onClose()
    } finally {
      setLoadingRe(false)
    }
  }

  async function handleCancelar() {
    setLoadingCan(true)
    try {
      const ok = await onCancelar(agendamento.id)
      if (ok) onClose()
    } finally {
      setLoadingCan(false)
    }
  }

  function handleWhatsApp() {
    const telefoneFinal = normalizarTelefoneBR(telefoneBruto)

    if (!telefoneFinal) {
      toast.error('Telefone do cliente não encontrado.')
      return
    }

    const mensagem = encodeURIComponent(
      `Olá, ${nomeCliente}! Passando para lembrar do seu agendamento de ${nomeServico} no dia ${dataAgendamento} às ${horarioAgendamento}.`
    )

    window.open(`https://wa.me/${telefoneFinal}?text=${mensagem}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            Detalhes do Agendamento
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm font-body mb-4">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Cliente
            </span>
            <span>{nomeCliente}</span>
          </div>

          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Serviço
            </span>
            <span>{nomeServico}</span>
          </div>

          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Data
            </span>
            <span>{dataAgendamento}</span>
          </div>

          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
              Horário
            </span>
            <span>{horarioAgendamento}</span>
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

        {isGerente && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full border border-green-600 text-green-700 py-2 rounded-lg text-sm font-body hover:bg-green-50 flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle size={14} /> Enviar lembrete no WhatsApp
          </button>
        )}

        {!podeAlterar && agendamento?.status !== 'CANCELADO' && (
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
                    const dataSelecionada = e.target.value
                    setNovaData(dataSelecionada)
                    setNovoHorario('')
                    fetchHorariosDisponiveis(dataSelecionada)
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
                    {loadingHorarios
                      ? 'Carregando horários...'
                      : !novaData
                        ? 'Selecione a data'
                        : horariosDisponiveis.length === 0
                          ? 'Sem horários disponíveis'
                          : 'Selecione o horário'}
                  </option>

                  {horariosDisponiveis.map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
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

export default function AgendamentosPage() {
  const { isGerente, user } = useUser()

  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)

  const [filtroData, setFiltroData] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  async function fetchAgendamentos() {
    setLoading(true)

    try {
      let url = '/agendamentos/'
      const params = new URLSearchParams()

      if (filtroData) params.set('data', filtroData)
      if (filtroStatus) params.set('status', statusParaApi(filtroStatus))
      if (filtroTipo) params.set('tipo', filtroTipo)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await apiClient.get(url)
      const payload = extrairPayload(response)

      const listaBruta = Array.isArray(payload)
        ? payload
        : payload?.agendamentos || payload?.data || []

      const listaNormalizada = listaBruta.map(normalizarAgendamento)

      const listaFinal = isGerente
        ? listaNormalizada
        : listaNormalizada.filter((item) => pertenceAoUsuario(item, user))

      setAgendamentos(listaFinal)
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      console.error('Detalhes do backend:', error?.response?.data)
      setAgendamentos([])
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao carregar agendamentos.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroData, filtroStatus, filtroTipo, isGerente, user?.id, user?.email])

  async function handleRemarcar(id, { novaData, novoHorario }) {
    try {
      await apiClient.patch(`/agendamentos/${id}`, {
        novaData,
        novoHorario,
      })

      toast.success('Agendamento remarcado!')
      await fetchAgendamentos()

      setSelecionado((atual) =>
        atual?.id === id
          ? {
            ...atual,
            data: novaData,
            horario: novoHorario,
            horaInicio: novoHorario,
            dataHora: montarDataHora(novaData, novoHorario),
            status: 'REMARCADO',
          }
          : atual
      )

      return true
    } catch (error) {
      console.error('Erro ao remarcar agendamento:', error)
      console.error('Detalhes do backend:', error?.response?.data)

      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Não foi possível remarcar o agendamento.'
      )

      return false
    }
  }

  async function handleCancelar(id) {
    try {
      await apiClient.patch(`/agendamentos/${id}/cancelar`)
      toast.success('Agendamento cancelado.')
      await fetchAgendamentos()

      setSelecionado((atual) =>
        atual?.id === id
          ? {
            ...atual,
            status: 'CANCELADO',
          }
          : atual
      )

      return true
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      console.error('Detalhes do backend:', error?.response?.data)

      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Não foi possível cancelar o agendamento.'
      )

      return false
    }
  }

  const tituloDescricao = useMemo(() => {
    if (isGerente) {
      return {
        titulo: 'Agendamentos',
        descricao: 'Gerencie todos os agendamentos',
      }
    }

    return {
      titulo: 'Meus Agendamentos',
      descricao: 'Acompanhe seus agendamentos',
    }
  }, [isGerente])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold text-foreground">{tituloDescricao.titulo}</h1>
        <p className="text-muted-foreground font-body mt-1 text-sm">
          {tituloDescricao.descricao}
        </p>
      </div>

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

        {(filtroData || filtroStatus || filtroTipo) && (
          <button
            type="button"
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