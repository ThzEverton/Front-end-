'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, MessageCircle, Send, X, AlertCircle } from 'lucide-react'
import apiClient from '@/utils/apiClient'

function normalizarTelefoneBR(tel) {
  if (!tel) return null
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return null
}

function formatarData(dateStr) {
  if (!dateStr) return ''
  const s = String(dateStr)
  const parte = s.includes('T') ? s.split('T')[0] : s
  const [y, m, d] = parte.split('-')
  return `${d}/${m}/${y}`
}

function formatarHora(timeStr) {
  if (!timeStr) return ''
  return String(timeStr).slice(0, 5)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export default function DisparoEmMassa() {
  const hoje = new Date().toISOString().slice(0, 10)

  const [aberto, setAberto] = useState(false)
  const [dataSelecionada, setDataSelecionada] = useState(hoje)
  const [destinatarios, setDestinatarios] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [disparando, setDisparando] = useState(false)
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })
  const [erros, setErros] = useState([])
  const [concluido, setConcluido] = useState(false)

  async function buscarDestinatarios() {
    setCarregando(true)
    setDestinatarios([])
    setErros([])
    setConcluido(false)
    setProgresso({ atual: 0, total: 0 })
    try {
      const response = await apiClient.get(`/disparos/preview?data=${dataSelecionada}`)
      const payload = response?.data ?? response
      const lista = payload?.data ?? payload ?? []
      setDestinatarios(Array.isArray(lista) ? lista : [])
      if (!Array.isArray(lista) || !lista.length)
        toast.info('Nenhum destinatário encontrado para esta data.')
    } catch (err) {
      toast.error(
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        'Erro ao buscar destinatários.'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function dispararTodos() {
    if (!destinatarios.length) return
    const ok = window.confirm(
      `Enviar lembrete para ${destinatarios.length} pessoa(s) via WhatsApp?`
    )
    if (!ok) return

    setDisparando(true)
    setConcluido(false)
    setProgresso({ atual: 0, total: destinatarios.length })
    const novosErros = []

    for (let i = 0; i < destinatarios.length; i++) {
      const d = destinatarios[i]
      const tel = normalizarTelefoneBR(d.telefone)

      if (!tel) {
        novosErros.push({ nome: d.nome_cliente, motivo: 'Telefone inválido' })
        setProgresso({ atual: i + 1, total: destinatarios.length })
        continue
      }

      const msg = encodeURIComponent(
        `Olá, ${d.nome_cliente}! Passando para lembrar do seu agendamento de ${d.servico} no dia ${formatarData(d.data)} às ${formatarHora(d.hora_inicio)}.`
      )
      window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')

      try {
        await apiClient.post('/disparos/registrar', {
          agendamento_id: d.agendamento_id,
          user_id: d.user_id,
          telefone: tel,
          status: 'enviado',
        })
      } catch { /* log não bloqueia o fluxo */ }

      setProgresso({ atual: i + 1, total: destinatarios.length })
      await sleep(1200)
    }

    setErros(novosErros)
    setDisparando(false)
    setConcluido(true)

    if (!novosErros.length) {
      toast.success(`Disparo concluído! ${destinatarios.length} mensagem(ns) enviada(s).`)
    } else {
      toast.warning(`Disparo concluído com ${novosErros.length} erro(s).`)
    }
  }

  function fechar() {
    if (disparando) return
    setAberto(false)
    setDestinatarios([])
    setErros([])
    setConcluido(false)
    setProgresso({ atual: 0, total: 0 })
  }

  const porcentagem =
    progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0

  // ── Botão colapsado ──────────────────────────────────────────────────────────
  if (!aberto) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle size={16} className="text-primary" />
          <div>
            <span className="font-sans font-semibold text-sm text-foreground">
              Disparo em Massa
            </span>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Lembretes WhatsApp para agendamentos do dia e turmas com 5+ participantes
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-body font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Send size={14} />
          Disparar lembretes
        </button>
      </div>
    )
  }

  // ── Painel expandido ─────────────────────────────────────────────────────────
  return (
    <div className="bg-card border border-primary/30 rounded-xl p-5 mb-6 space-y-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <span className="font-sans font-semibold text-sm text-foreground">
            Disparo em Massa — Lembretes WhatsApp
          </span>
        </div>
        <button
          type="button"
          onClick={fechar}
          disabled={disparando}
          className="text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filtro de data + busca */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Data</label>
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => {
              setDataSelecionada(e.target.value)
              setDestinatarios([])
              setConcluido(false)
            }}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>
        <button
          type="button"
          onClick={buscarDestinatarios}
          disabled={carregando || disparando}
          className="flex items-center gap-1.5 border border-input bg-background hover:bg-muted text-foreground text-sm font-body px-4 py-2 rounded-lg disabled:opacity-50 transition"
        >
          {carregando
            ? <><Loader2 size={14} className="animate-spin" /> Buscando...</>
            : 'Buscar destinatários'
          }
        </button>
      </div>

      {/* Tabela de preview */}
      {destinatarios.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-body">
              {destinatarios.length} destinatário(s) encontrado(s)
            </span>
            <button
              type="button"
              onClick={dispararTodos}
              disabled={disparando || concluido}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-body font-medium px-4 py-1.5 rounded-lg disabled:opacity-50 transition"
            >
              {disparando
                ? <><Loader2 size={13} className="animate-spin" /> {progresso.atual}/{progresso.total}</>
                : concluido
                  ? '✓ Concluído'
                  : <><Send size={13} /> Disparar para todos</>
              }
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/30">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Serviço</th>
                  <th className="px-4 py-2 font-medium">Horário</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {destinatarios.map((d) => (
                  <tr
                    key={`${d.agendamento_id}-${d.user_id}`}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-2 text-card-foreground">{d.nome_cliente}</td>
                    <td className="px-4 py-2 text-muted-foreground">{d.servico}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatarHora(d.hora_inicio)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.tipo === 'turma'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-accent text-primary'
                      }`}>
                        {d.tipo === 'turma' ? `Turma (${d.total_participantes})` : 'Individual'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{d.telefone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      {(disparando || (concluido && progresso.total > 0)) && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-body">
            <span>{disparando ? 'Enviando mensagens...' : 'Disparo concluído'}</span>
            <span>{porcentagem}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                concluido && !disparando ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${porcentagem}%` }}
            />
          </div>
        </div>
      )}

      {/* Erros */}
      {erros.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive font-body mb-1">
              {erros.length} disparo(s) com problema:
            </p>
            <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside font-body">
              {erros.map((e, i) => (
                <li key={i}>{e.nome} — {e.motivo}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}