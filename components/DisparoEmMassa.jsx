'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, MessageCircle, Send, X, AlertCircle, RefreshCw, CheckCircle2, Wifi, WifiOff, LogOut } from 'lucide-react'
import apiClient from '@/utils/apiClient'

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizarTelefoneBR(tel) {
  if (!tel) return null
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return null
}

function formatarHora(timeStr) {
  if (!timeStr) return ''
  return String(timeStr).slice(0, 5)
}

// ─── Sub-componente: painel de status / QR Code ───────────────────────────────

function StatusWhatsApp({
  statusWpp,
  qrImage,
  onVerificar,
  verificando,
  onConectar,
  onDesconectar,
  conectando,
  desconectando,
}) {
  if (!statusWpp || statusWpp === 'pronto') return null

  const conectadoParcial = statusWpp === 'qr_pendente' || statusWpp === 'aguardando'
  const podeConectar = statusWpp === 'desconectado' || statusWpp === 'desativado' || statusWpp === 'erro'

  return (
    <div className="border border-yellow-200 rounded-xl overflow-hidden">
      <div className="bg-yellow-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff size={14} className="text-yellow-700 shrink-0" />
          <span className="text-xs text-yellow-800 font-body font-medium">
            {statusWpp === 'qr_pendente'
              ? 'WhatsApp nao conectado. Escaneie o QR Code para continuar.'
              : statusWpp === 'aguardando'
                ? 'WhatsApp conectando. Se a rede bloquear, voce pode parar a tentativa.'
                : statusWpp === 'erro'
                  ? 'WhatsApp com erro de conexao. Tente conectar novamente.'
                  : 'WhatsApp desconectado. Conecte quando quiser enviar lembretes.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {podeConectar && (
            <button
              type="button"
              onClick={onConectar}
              disabled={conectando}
              className="flex items-center gap-1 text-xs text-yellow-800 hover:text-yellow-950 font-body font-medium disabled:opacity-50"
            >
              {conectando ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
              Conectar
            </button>
          )}
          {conectadoParcial && (
            <button
              type="button"
              onClick={onDesconectar}
              disabled={desconectando}
              className="flex items-center gap-1 text-xs text-yellow-800 hover:text-yellow-950 font-body font-medium disabled:opacity-50"
            >
              {desconectando ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
              Sair
            </button>
          )}
          <button
            type="button"
            onClick={onVerificar}
            disabled={verificando}
            className="flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 font-body disabled:opacity-50"
          >
            {verificando ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Atualizar
          </button>
        </div>
      </div>

      {statusWpp === 'qr_pendente' && qrImage && (
        <div className="bg-white flex flex-col items-center gap-3 py-5 px-4">
          <div className="border-2 border-yellow-200 rounded-xl p-2 shadow-sm">
            <img src={qrImage} alt="QR Code WhatsApp" className="w-44 h-44 rounded-lg" />
          </div>
          <div className="text-center space-y-1 max-w-xs">
            <p className="text-xs font-body font-medium text-foreground">Como escanear:</p>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Abra o WhatsApp no celular, entre em Dispositivos conectados e escolha Conectar dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onVerificar}
            disabled={verificando}
            className="flex items-center gap-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-body font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {verificando
              ? <><Loader2 size={12} className="animate-spin" /> Verificando...</>
              : <><CheckCircle2 size={12} /> Ja escaneei, verificar conexao</>
            }
          </button>
        </div>
      )}

      {statusWpp === 'aguardando' && (
        <div className="bg-white flex items-center justify-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin text-yellow-600" />
          <span className="text-xs text-muted-foreground font-body">Conectando ao WhatsApp...</span>
        </div>
      )}

      {(['desconectado', 'desativado', 'erro'].includes(statusWpp)) && (
        <div className="bg-white flex items-center justify-center gap-2 py-4">
          <WifiOff size={14} className="text-yellow-600" />
          <span className="text-xs text-muted-foreground font-body">Conexao parada.</span>
        </div>
      )}
    </div>
  )
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
  const [statusWpp, setStatusWpp] = useState(null)
  const [qrImage, setQrImage] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [conectando, setConectando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)

  const verificarStatus = useCallback(async (silencioso = false) => {
    if (!silencioso) setVerificando(true)
    try {
      const r = await apiClient.get('/disparos/status')
      const payload = r?.data ?? r
      const novoEstado = payload?.estado

      // Avisa quando conectar após QR
      if (novoEstado === 'pronto' && statusWpp === 'qr_pendente') {
        toast.success('WhatsApp conectado com sucesso!')
      }

      setStatusWpp(novoEstado)
      setQrImage(payload?.qr || null)
    } catch {
      setStatusWpp(null)
      setQrImage(null)
    } finally {
      if (!silencioso) setVerificando(false)
    }
  }, [statusWpp])

  // Checa status ao abrir o painel
  useEffect(() => {
    if (!aberto) return
    verificarStatus()
  }, [aberto])

  // Polling a cada 5s apenas enquanto existe uma tentativa ativa.
  useEffect(() => {
    if (!aberto || !['qr_pendente', 'aguardando'].includes(statusWpp)) return
    const intervalo = setInterval(() => verificarStatus(true), 5000)
    return () => clearInterval(intervalo)
  }, [aberto, statusWpp, verificarStatus])

  async function conectarWhatsApp() {
    setConectando(true)
    try {
      const response = await apiClient.post('/disparos/conectar')
      const payload = response?.data ?? response
      setStatusWpp(payload?.estado)
      setQrImage(payload?.qr || null)
      toast.success('Conexao do WhatsApp iniciada.')
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Erro ao conectar WhatsApp.')
    } finally {
      setConectando(false)
    }
  }

  async function desconectarWhatsApp() {
    if (disparando || desconectando) return
    const ok = window.confirm('Sair da sessao do WhatsApp neste sistema?')
    if (!ok) return

    setDesconectando(true)
    try {
      const response = await apiClient.post('/disparos/desconectar')
      const payload = response?.data ?? response
      setStatusWpp(payload?.estado || 'desconectado')
      setQrImage(null)
      setDestinatarios([])
      setErros([])
      setConcluido(false)
      setProgresso({ atual: 0, total: 0 })
      toast.success('Sessao do WhatsApp encerrada.')
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Erro ao sair da sessao do WhatsApp.')
    } finally {
      setDesconectando(false)
    }
  }

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
        err?.data?.msg ||
          err?.data?.error ||
          err?.message ||
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

    try {
      const res = await apiClient.post('/disparos/executar', { destinatarios })
      const payload = res?.data ?? res
      const { enviados, erros: novosErros } = payload

      setErros(novosErros || [])
      setProgresso({ atual: destinatarios.length, total: destinatarios.length })
      setConcluido(true)

      if (!novosErros?.length) {
        toast.success(`Disparo concluído! ${enviados} mensagem(ns) enviada(s).`)
      } else {
        toast.warning(`Concluído com ${novosErros.length} erro(s).`)
      }
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Erro ao disparar mensagens.'
      toast.error(msg)
      if (err?.status === 503) {
        verificarStatus() // busca QR atualizado
      }
    } finally {
      setDisparando(false)
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <span className="font-sans font-semibold text-sm text-foreground">
            Disparo em Massa — Lembretes WhatsApp
          </span>
          {statusWpp === 'pronto' && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-body">
              <Wifi size={12} /> Conectado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusWpp === 'pronto' && (
            <button
              type="button"
              onClick={desconectarWhatsApp}
              disabled={disparando || desconectando}
              title="Sair da sessao do WhatsApp"
              className="flex items-center gap-1.5 border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-body px-3 py-1.5 rounded-lg disabled:opacity-40 transition"
            >
              {desconectando
                ? <Loader2 size={13} className="animate-spin" />
                : <LogOut size={13} />
              }
              Sair do WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={fechar}
            disabled={disparando}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Painel de status / QR Code */}
      <StatusWhatsApp
        statusWpp={statusWpp}
        qrImage={qrImage}
        onVerificar={verificarStatus}
        verificando={verificando}
        onConectar={conectarWhatsApp}
        onDesconectar={desconectarWhatsApp}
        conectando={conectando}
        desconectando={desconectando}
      />

      {/* Filtros e busca — só exibe quando conectado */}
      {(statusWpp === 'pronto' || statusWpp === null) && (
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
      )}

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
