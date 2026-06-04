'use client'

import { useEffect, useMemo, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { toast } from 'sonner'
import HelpTour from '@/components/HelpTour'
import {
  CheckCircle2,
  HelpCircle,
  ImagePlus,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react'

function formatDateTime(value) {
  if (!value) return 'Nunca enviado'
  return new Date(value).toLocaleString('pt-BR')
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CampanhasPage() {
  const [clientes, setClientes] = useState([])
  const [campanhas, setCampanhas] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [todosClientes, setTodosClientes] = useState(false)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [tourAtivo, setTourAtivo] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const [imagemArquivo, setImagemArquivo] = useState(null)
  const [imagemPreview, setImagemPreview] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    assunto: '',
    mensagem: '',
    imagemUrl: '',
    incluirServicos: false,
    personalizarHistorico: false,
  })

  const campanhasSteps = [
    { selector: '#tour-campanhas-header', title: 'Campanhas de email', body: 'Nesta aba você cria envios por email para promoções, datas comemorativas e comunicados.' },
    { selector: '#tour-campanhas-editor', title: 'Conteúdo da campanha', body: 'Preencha título interno, assunto, mensagem e imagem opcional.', tip: 'Use {{nome}} para personalizar o texto com o nome da cliente.' },
    { selector: '#tour-campanhas-opcoes', title: 'Opções do email', body: 'Escolha se esta campanha deve mostrar o bloco institucional de serviços ou personalizar pelo histórico da cliente. Por padrão essas opções ficam desligadas.' },
    { selector: '#tour-campanhas-destinatarios', title: 'Destinatários', body: 'Escolha clientes específicos ou marque todos os clientes com email cadastrado.' },
    { selector: '#tour-campanhas-historico', title: 'Histórico', body: 'Aqui ficam as campanhas recentes e o resumo do último envio.' },
  ]

  async function carregar() {
    setLoading(true)
    try {
      const [clientesResp, campanhasResp] = await Promise.all([
        apiClient.get('/email-campanhas/clientes'),
        apiClient.get('/email-campanhas'),
      ])
      setClientes(clientesResp?.clientes || [])
      setCampanhas(campanhasResp?.campanhas || [])
    } catch {
      setClientes([])
      setCampanhas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((c) =>
      `${c.nome || ''} ${c.email || ''}`.toLowerCase().includes(termo)
    )
  }, [clientes, busca])

  const totalDestinatarios = todosClientes ? clientes.length : selecionados.length
  const podeEnviar = form.assunto.trim() && form.mensagem.trim() && totalDestinatarios > 0

  function toggleCliente(id) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  async function handleImagem(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Escolha uma imagem de até 8MB.')
      return
    }
    setImagemArquivo(file)
    setImagemPreview(URL.createObjectURL(file))
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!podeEnviar) {
      toast.error('Preencha assunto, mensagem e selecione destinatários.')
      return
    }

    const ok = window.confirm(`Enviar campanha para ${totalDestinatarios} cliente(s)?`)
    if (!ok) return

    setEnviando(true)
    setResultado(null)
    try {
      let imagemBase64 = null
      if (imagemArquivo) imagemBase64 = await fileToBase64(imagemArquivo)

      const payload = {
        ...form,
        titulo: form.titulo || form.assunto,
        todosClientes,
        clienteIds: todosClientes ? [] : selecionados,
        imagemBase64,
        imagemNome: imagemArquivo?.name,
        imagemTipo: imagemArquivo?.type,
      }

      const resp = await apiClient.post('/email-campanhas/enviar', payload)
      setResultado(resp)
      toast.success(`Campanha enviada: ${resp.enviados || 0} email(s).`)
      setForm({ titulo: '', assunto: '', mensagem: '', imagemUrl: '', incluirServicos: false, personalizarHistorico: false })
      setSelecionados([])
      setTodosClientes(false)
      setImagemArquivo(null)
      setImagemPreview('')
      carregar()
    } catch (err) {
      toast.error(err?.data?.msg || err?.message || 'Erro ao enviar campanha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <div id="tour-campanhas-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Envie emails para datas comemorativas, promoções e comunicados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTourIndex(0); setTourAtivo(true) }}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            <HelpCircle size={16} /> Ajuda
          </button>
          <button
            onClick={carregar}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] gap-6">
        <form id="tour-campanhas-editor" onSubmit={handleEnviar} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="font-sans text-lg font-bold text-card-foreground">Nova campanha de email</h2>
              <p className="text-xs text-muted-foreground font-body">Use {'{{nome}}'} para personalizar a mensagem.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Título interno</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Dia das Mães 2026"
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Assunto do email</label>
              <input
                value={form.assunto}
                onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                placeholder="Uma condição especial para você"
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1.5">Mensagem</label>
            <textarea
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              rows={8}
              placeholder={'Olá {{nome}}, preparamos uma promoção especial para esta data.'}
              className="w-full border border-input rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
            <div>
              <label className="block text-sm font-medium font-body mb-1.5">Imagem por URL</label>
              <input
                value={form.imagemUrl}
                onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
              <p className="text-xs text-muted-foreground font-body mt-1">Ou envie um arquivo abaixo para ir junto no email.</p>
            </div>
            <label className="border border-dashed border-border rounded-lg px-4 py-3 flex items-center justify-center gap-2 text-sm font-body text-muted-foreground hover:bg-muted cursor-pointer">
              <ImagePlus size={16} />
              Escolher imagem
              <input type="file" accept="image/*" onChange={handleImagem} className="hidden" />
            </label>
          </div>

          {(imagemPreview || form.imagemUrl) && (
            <div className="border border-border rounded-xl overflow-hidden bg-muted/30">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-body text-muted-foreground">Preview da imagem</span>
                {imagemPreview && (
                  <button type="button" onClick={() => { setImagemArquivo(null); setImagemPreview('') }} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                )}
              </div>
              <img src={imagemPreview || form.imagemUrl} alt="" className="max-h-64 w-full object-cover" />
            </div>
          )}

          <div id="tour-campanhas-opcoes" className="border border-border rounded-xl p-4 bg-muted/20">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.incluirServicos}
                onChange={(e) => setForm({ ...form, incluirServicos: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span>
                <span className="block text-sm font-medium font-body text-foreground">Mostrar bloco de serviços no email</span>
                <span className="block text-xs text-muted-foreground font-body mt-1">
                  Use apenas quando a campanha também precisar reforçar a apresentação da Sala Rosa. O padrão é enviar sem esse bloco.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer mt-4 pt-4 border-t border-border">
              <input
                type="checkbox"
                checked={form.personalizarHistorico}
                onChange={(e) => setForm({ ...form, personalizarHistorico: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span>
                <span className="block text-sm font-medium font-body text-foreground">Personalizar por histórico da cliente</span>
                <span className="block text-xs text-muted-foreground font-body mt-1">
                  Mostra um destaque individual apenas quando a cliente tiver compras ou atendimentos repetidos no histórico. Se não tiver confiança, o email vai normal.
                </span>
              </span>
            </label>
          </div>

          <div id="tour-campanhas-destinatarios" className="border border-border rounded-xl p-4 bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <p className="text-sm font-medium font-body">Destinatários</p>
              </div>
              <button
                type="button"
                onClick={() => setTodosClientes((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${todosClientes ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {todosClientes ? 'Todos os clientes' : 'Selecionar todos'}
              </button>
            </div>

            {!todosClientes && (
              <>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar cliente por nome ou email"
                    className="w-full border border-input rounded-lg pl-9 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border border-border rounded-lg bg-background">
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary" /></div>
                  ) : clientesFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body text-center py-8">Nenhum cliente com email encontrado.</p>
                  ) : clientesFiltrados.map((cliente) => {
                    const checked = selecionados.includes(cliente.id)
                    return (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => toggleCliente(cliente.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 text-left hover:bg-muted/40"
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                          {checked && <CheckCircle2 size={12} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium font-body truncate">{cliente.nome}</span>
                          <span className="block text-xs text-muted-foreground font-body truncate">{cliente.email}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground font-body">
              {totalDestinatarios} destinatário(s) selecionado(s)
            </p>
            <button
              type="submit"
              disabled={enviando || !podeEnviar}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar campanha
            </button>
          </div>
        </form>

        <aside id="tour-campanhas-historico" className="flex flex-col gap-6">
          {resultado && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-sans text-lg font-bold mb-3">Último envio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-body">Total</p>
                  <p className="font-sans text-xl font-bold">{resultado.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-body">Enviados</p>
                  <p className="font-sans text-xl font-bold text-green-700">{resultado.enviados}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-body">Erros</p>
                  <p className="font-sans text-xl font-bold text-red-700">{resultado.erros}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-primary font-body">Personalizados</p>
                  <p className="font-sans text-xl font-bold text-primary">{resultado.personalizados || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-sans text-lg font-bold mb-4">Campanhas recentes</h2>
            {campanhas.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">Nenhuma campanha enviada ainda.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {campanhas.slice(0, 8).map((campanha) => (
                  <div key={campanha.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium font-body">{campanha.titulo}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{campanha.assunto}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-body text-muted-foreground">
                      <span>{campanha.totalEnviados} enviados</span>
                      <span>{campanha.totalErros} erros</span>
                      {campanha.incluirServicos && <span>com bloco de serviços</span>}
                      {campanha.personalizarHistorico && <span>personalizado por histórico</span>}
                      <span>{formatDateTime(campanha.ultimoEnvioEm)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {tourAtivo && (
        <HelpTour
          steps={campanhasSteps}
          index={tourIndex}
          onNext={() => tourIndex === campanhasSteps.length - 1 ? setTourAtivo(false) : setTourIndex(tourIndex + 1)}
          onPrev={() => setTourIndex(tourIndex - 1)}
          onStop={() => setTourAtivo(false)}
        />
      )}
    </div>
  )
}
