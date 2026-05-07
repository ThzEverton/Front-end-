'use client'

import { useEffect, useRef, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2, Plus, Trash2, X, ShoppingCart,
  CreditCard, Banknote, QrCode, Eye, Package, Scissors,
  CheckCircle2, ChevronLeft, ChevronRight, HelpCircle,
  Lightbulb, Info
} from 'lucide-react'

const FORMA_LABEL = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' }
const FORMA_ICON = { dinheiro: Banknote, cartao: CreditCard, pix: QrCode }

const STATUS_STYLE = {
  pendente: 'bg-yellow-100 text-yellow-700',
  pago: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  estornado: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[status] || 'bg-muted text-muted-foreground'}`}>
      {status || '—'}
    </span>
  )
}

function FormaBadge({ forma }) {
  const Icon = FORMA_ICON[forma]
  return forma ? (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body">
      {Icon && <Icon size={12} />} {FORMA_LABEL[forma]}
    </span>
  ) : <span className="text-xs text-muted-foreground">—</span>
}

// ─── TOUR TOOLTIP ────────────────────────────────────────────────────────────

function TourTooltip({ steps, index, onNext, onPrev, onStop }) {
  const tooltipRef = useRef(null)
  const [targetRect, setTargetRect] = useState(null)
  const [pos, setPos] = useState({ top: 20, left: 20 })

  const step = steps[index]
  const total = steps.length
  const isLast = index === total - 1
  const TOOLTIP_W = 340
  const GAP = 14
  const PADDING = 12

  useEffect(() => {
    function updatePosition() {
      const target = document.querySelector(step.selector)
      if (!target) { setTargetRect(null); return }
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)
        const tooltipH = tooltipRef.current?.offsetHeight || 200
        let top = rect.bottom + GAP
        let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
        if (top + tooltipH > window.innerHeight - PADDING) top = rect.top - tooltipH - GAP
        if (top < PADDING) top = PADDING
        if (left < PADDING) left = PADDING
        if (left + TOOLTIP_W > window.innerWidth - PADDING) left = window.innerWidth - TOOLTIP_W - PADDING
        setPos({ top, left })
      }, 260)
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [step])

  if (!step || !targetRect) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }} aria-hidden="true">
        <svg width="100%" height="100%">
          <defs>
            <mask id="tour-highlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={targetRect.left - 10} y={targetRect.top - 10} width={targetRect.width + 20} height={targetRect.height + 20} rx="10" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#tour-highlight-mask)" />
          <rect x={targetRect.left - 10} y={targetRect.top - 10} width={targetRect.width + 20} height={targetRect.height + 20} rx="10" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeDasharray="6 3" />
        </svg>
      </div>

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="false"
        aria-label={step.title}
        style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 'min(92vw, 340px)', maxWidth: 'calc(100vw - 24px)' }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-4 animate-fade-in"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">{index + 1}</span>
            <p className="font-sans font-bold text-sm text-card-foreground leading-snug">{step.title}</p>
          </div>
          <button onClick={onStop} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5" aria-label="Fechar tour"><X size={14} /></button>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-2 leading-relaxed pl-7">{step.body}</p>
        {step.tip && (
          <div className="ml-7 mb-3 flex items-start gap-1.5 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2">
            <Lightbulb size={12} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary font-body leading-relaxed">{step.tip}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 pl-7">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`inline-block rounded-full transition-all shrink-0 ${i === index ? 'w-4 h-1.5 bg-primary' : i < index ? 'w-1.5 h-1.5 bg-primary/40' : 'w-1.5 h-1.5 bg-border'}`} />
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground font-body">{index + 1}/{total}</span>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={onStop} className="text-[11px] text-muted-foreground hover:text-foreground font-body underline underline-offset-2 transition-colors">Pular tour</button>
            <div className="flex gap-2">
              {index > 0 && (
                <button onClick={onPrev} className="flex items-center gap-1 text-xs border border-border px-2.5 py-1.5 rounded-lg font-body hover:bg-muted transition-colors">
                  <ChevronLeft size={12} /> Anterior
                </button>
              )}
              <button onClick={onNext} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg font-body hover:opacity-90 transition-opacity">
                {isLast ? <><CheckCircle2 size={12} /> Concluir</> : <>Próximo <ChevronRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── MODAL DETALHE VENDA ──────────────────────────────────────────────────────

function DetalheVendaModal({ venda, onClose, onAtualizado }) {
  const [itens, setItens] = useState(venda?.itens || [])
  const [loadingItens, setLoadingItens] = useState(false)
  const [formaPagto, setFormaPagto] = useState(venda?.formaPagto || '')
  const [statusPagto, setStatusPagto] = useState(venda?.statusPagto || 'pendente')
  const [editandoPagto, setEditandoPagto] = useState(false)
  const [loadingSalvar, setLoadingSalvar] = useState(false)
  const [tourAtivo, setTourAtivo] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)

  const detalheSteps = [
    { selector: '#tour-detalhe-header', title: 'Identificação da venda', body: 'Aqui você vê o número único da venda e a data em que ela foi registrada no sistema.', tip: 'O número de ID é usado para rastrear a venda em relatórios e vincular a agendamentos.' },
    { selector: '#tour-info-pagamento', title: 'Resumo da venda', body: 'Aqui ficam as principais informações: forma de pagamento escolhida, status atual, quem registrou (responsável) e o valor total da venda.', tip: 'O responsável é o usuário logado no momento que a venda foi criada.' },
    { selector: '#tour-forma-detalhe', title: 'Forma de pagamento', body: 'Exibe como o pagamento foi recebido: Dinheiro, Cartão ou PIX. Você pode alterar isso clicando em "Atualizar pagamento".' },
    { selector: '#tour-status-detalhe', title: 'Status do pagamento', body: 'Indica a situação atual do pagamento. "Pendente" = ainda não recebido; "Pago" = recebido; "Cancelado" = venda cancelada; "Estornado" = valor devolvido ao cliente.', tip: 'Mantenha o status sempre atualizado para um controle financeiro preciso.' },
    { selector: '#tour-atualizar-pagamento', title: 'Atualizar pagamento', body: 'Use este botão para abrir os campos de edição e alterar a forma ou o status do pagamento. Após editar, clique em "Salvar" para confirmar.', tip: 'O botão de salvar só é habilitado quando você fizer alguma alteração.' },
    { selector: '#tour-observacao-detalhe', title: 'Observação', body: 'Campo de texto livre adicionado no momento da criação da venda. Pode conter informações extras como o tipo de atendimento ou instruções especiais.' },
    { selector: '#tour-itens-venda', title: 'Itens da venda', body: 'Lista todos os produtos e serviços incluídos nesta venda, com quantidade, valor unitário e subtotal de cada item.', tip: 'O subtotal de cada linha é calculado automaticamente: quantidade × valor unitário.' },
    { selector: '#tour-total-detalhe', title: 'Total da venda', body: 'Valor final consolidado de todos os itens vendidos. Este é o valor que o cliente pagou (ou deve pagar).' },
  ]

  const stepsValidos = detalheSteps.filter(s => {
    if (s.selector === '#tour-observacao-detalhe' && !venda?.observacao) return false
    return true
  })

  useEffect(() => {
    if (venda?.itens?.length) { setItens(venda.itens); return }
    setLoadingItens(true)
    apiClient.get(`/vendas/${venda.id}`)
      .then(data => setItens(data?.itens || []))
      .catch(() => {})
      .finally(() => setLoadingItens(false))
  }, [venda])

  async function handleSalvarPagamento() {
    setLoadingSalvar(true)
    try {
      await apiClient.patch(`/vendas/${venda.id}/pagamento`, { formaPagto, statusPagto })
      toast.success('Pagamento atualizado com sucesso!')
      setEditandoPagto(false)
      onAtualizado?.()
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Erro ao atualizar pagamento.')
    } finally {
      setLoadingSalvar(false)
    }
  }

  const data = venda?.data ? new Date(venda.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
  const pagamentoAlterado = formaPagto !== venda?.formaPagto || statusPagto !== venda?.statusPagto
  const valorTotal = venda?.valorTotal ?? venda?.total

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div id="tour-detalhe-header" className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h3 className="font-sans text-lg font-bold text-card-foreground">Venda #{venda.id}</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{data}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTourIndex(0); setTourAtivo(true) }} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Ajuda"><HelpCircle size={17} /></button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          <div id="tour-info-pagamento" className="grid grid-cols-2 gap-3">
            <div id="tour-forma-detalhe" className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Forma de pagamento</p>
              {editandoPagto ? (
                <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)} className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                </select>
              ) : <FormaBadge forma={formaPagto} />}
            </div>
            <div id="tour-status-detalhe" className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Status</p>
              {editandoPagto ? (
                <select value={statusPagto} onChange={e => setStatusPagto(e.target.value)} className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              ) : <StatusBadge status={statusPagto} />}
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Responsável</p>
              <p className="text-sm font-medium font-body">{venda?.usuarioResponsavel?.nome || '—'}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Total</p>
              <p id="tour-total-detalhe" className="text-sm font-bold text-primary font-sans">{formatCurrency(valorTotal)}</p>
            </div>
          </div>

          {!editandoPagto ? (
            <button id="tour-atualizar-pagamento" onClick={() => setEditandoPagto(true)} className="w-full border border-border rounded-lg py-2 text-xs font-body text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} /> Atualizar pagamento
            </button>
          ) : (
            <div id="tour-atualizar-pagamento" className="flex gap-2">
              <button onClick={() => { setEditandoPagto(false); setFormaPagto(venda?.formaPagto || ''); setStatusPagto(venda?.statusPagto || 'pendente') }} className="flex-1 border border-border rounded-lg py-2 text-xs font-body text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSalvarPagamento} disabled={loadingSalvar || !pagamentoAlterado} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-body hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {loadingSalvar ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Salvar
              </button>
            </div>
          )}

          {venda?.observacao && (
            <div id="tour-observacao-detalhe" className="bg-muted/30 border border-border rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-0.5">Observação</p>
              <p className="text-sm font-body">{venda.observacao}</p>
            </div>
          )}

          <div id="tour-itens-venda">
            <p className="text-sm font-medium font-body mb-2">Itens da venda</p>
            {loadingItens ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : itens.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhum item encontrado.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm font-body">
                  <thead className="bg-muted/50">
                    <tr className="text-xs text-muted-foreground uppercase">
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => {
                      const nome = item?.nome || item?.produto?.nome || item?.servico?.nome || '—'
                      const tipo = item?.tipo
                      const unit = Number(item?.precoUnit ?? item?.preco_unit ?? 0)
                      const sub = Number(item?.subtotal ?? 0)
                      const qtd = Number(item?.quantidade ?? 1)
                      return (
                        <tr key={item?.id || idx} className="border-t border-border">
                          <td className="px-3 py-2">
                            <span className="font-medium">{nome}</span>
                            <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground capitalize">
                              {tipo === 'produto' ? <Package size={10} /> : <Scissors size={10} />}{tipo}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground">{qtd}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(unit)}</td>
                          <td className="px-3 py-2 text-right font-medium text-primary">{formatCurrency(sub)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-border">
          <button onClick={onClose} className="w-full border border-border py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors">Fechar</button>
        </div>
      </div>

      {tourAtivo && (
        <TourTooltip steps={stepsValidos} index={tourIndex}
          onNext={() => tourIndex === stepsValidos.length - 1 ? setTourAtivo(false) : setTourIndex(tourIndex + 1)}
          onPrev={() => setTourIndex(tourIndex - 1)}
          onStop={() => setTourAtivo(false)}
        />
      )}
    </div>
  )
}

// ─── MODAL NOVA VENDA ─────────────────────────────────────────────────────────

function NovaVendaModal({ onClose, onSalvo }) {
  const [produtos, setProdutos] = useState([])
  const [servicos, setServicos] = useState([])
  const [clientes, setClientes] = useState([])
  const [itens, setItens] = useState([])
  const [vinculoTipo, setVinculoTipo] = useState('nenhum')
  const [agendamentoId, setAgendamentoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [formaPagto, setFormaPagto] = useState('')
  const [statusPagto, setStatusPagto] = useState('pendente')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [tourAtivo, setTourAtivo] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)

  const novaVendaSteps = [
    { selector: '#tour-nova-header', title: 'Registrar nova venda', body: 'Este formulário permite criar uma nova venda do zero. Você pode adicionar produtos do estoque e serviços prestados, informar como o cliente pagou e salvar tudo de uma vez.', tip: 'Você pode adicionar quantos produtos e serviços quiser na mesma venda.' },
    { selector: '#tour-forma-pagamento', title: 'Forma de pagamento', body: 'Selecione como o cliente vai pagar: Dinheiro (espécie), Cartão (crédito ou débito) ou PIX (transferência instantânea). Este campo é obrigatório.', tip: 'Você pode mudar a forma de pagamento depois, na tela de detalhes da venda.' },
    { selector: '#tour-status-pagamento', title: 'Status do pagamento', body: 'Define a situação atual do pagamento. Use "Pendente" se ainda não recebeu, "Pago" se já foi quitado, "Cancelado" se a venda não foi realizada, ou "Estornado" se devolveu o dinheiro.', tip: 'O padrão é "Pendente". Altere para "Pago" quando o pagamento for confirmado.' },
    { selector: '#tour-vinculo', title: 'Vincular venda', body: 'Campo opcional. A venda pode ficar avulsa, ser vinculada a um atendimento pelo ID, ou ser vinculada diretamente a uma cliente.' },
    { selector: '#tour-observacao-nova', title: 'Observação', body: 'Campo de texto livre para anotações internas. Exemplos: "venda avulsa sem agendamento", "cliente pediu nota fiscal", "pacote de 5 sessões". Não aparece para o cliente.' },
    { selector: '#tour-produtos', title: 'Adicionar produtos', body: 'Clique em qualquer produto para adicioná-lo à venda. O botão mostra o nome, preço unitário e quantidade disponível em estoque. Produtos sem estoque ficam desabilitados.', tip: 'Clique no mesmo produto várias vezes para aumentar a quantidade, ou ajuste direto na tabela de itens.' },
    { selector: '#tour-servicos', title: 'Adicionar serviços', body: 'Aqui ficam os serviços disponíveis para venda (ex: corte, coloração, massagem). Não possuem controle de estoque, então você pode adicionar quantas vezes quiser.' },
    { selector: '#tour-tabela-itens', title: 'Itens selecionados', body: 'Lista em tempo real dos produtos e serviços adicionados à venda. Você pode ajustar a quantidade de cada item ou remover um item clicando no ícone de lixeira.', tip: 'O total é recalculado automaticamente sempre que você altera uma quantidade.' },
    { selector: '#tour-total-nova', title: 'Total da venda', body: 'Soma automática de todos os itens. Este é o valor que será registrado no sistema como total da venda.' },
    { selector: '#tour-registrar-venda', title: 'Registrar venda', body: 'Ao clicar aqui, a venda é salva no sistema com todos os itens, forma de pagamento e status. O estoque dos produtos é atualizado automaticamente.', tip: 'Verifique se todos os itens e o valor total estão corretos antes de confirmar.' },
  ]

  useEffect(() => {
    async function load() {
      try {
        const [p, s, u] = await Promise.all([apiClient.get('/produtos'), apiClient.get('/servicos'), apiClient.get('/users')])
        const prods = (Array.isArray(p) ? p : p?.produtos || []).map(prod => ({ ...prod, preco: Number(prod.precoVenda ?? prod.preco_venda ?? prod.preco ?? prod.valor ?? 0), estoqueAtual: Number(prod.estoqueAtual ?? prod.estoque_atual ?? 0) }))
        const servs = (Array.isArray(s) ? s : s?.servicos || []).map(serv => ({ ...serv, preco: Number(serv.preco ?? serv.valor ?? 0) }))
        const users = Array.isArray(u) ? u : u?.users || []
        setProdutos(prods)
        setServicos(servs)
        setClientes(users.filter(user => {
          const ativo = user.ativo !== false && user.ativo !== 0
          const cliente = (user.perfil || 'cliente') === 'cliente'
          return ativo && cliente
        }))
      } catch {}
    }
    load()
  }, [])

  function addItem(tipo, item) {
    setItens(prev => {
      const existe = prev.find(i => i.id === item.id && i.tipo === tipo)
      if (existe) {
        const novaQtd = existe.quantidade + 1
        if (tipo === 'produto' && novaQtd > item.estoqueAtual) { toast.error(`Estoque insuficiente para "${item.nome}". Disponível: ${item.estoqueAtual}`); return prev }
        return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, quantidade: novaQtd } : i)
      }
      if (tipo === 'produto' && item.estoqueAtual < 1) { toast.error(`"${item.nome}" está sem estoque.`); return prev }
      return [...prev, { ...item, tipo, quantidade: 1 }]
    })
  }

  function removeItem(id, tipo) { setItens(prev => prev.filter(i => !(i.id === id && i.tipo === tipo))) }

  function updateQtd(id, tipo, qtd) {
    if (qtd < 1) return
    if (tipo === 'produto') {
      const prod = produtos.find(p => p.id === id)
      if (qtd > prod.estoqueAtual) { toast.error(`Estoque insuficiente para "${prod.nome}". Disponível: ${prod.estoqueAtual}`); return }
    }
    setItens(prev => prev.map(i => i.id === id && i.tipo === tipo ? { ...i, quantidade: qtd } : i))
  }

  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (itens.length === 0) { toast.error('Adicione pelo menos um item à venda.'); return }
    if (!formaPagto) { toast.error('Selecione a forma de pagamento.'); return }
    if (vinculoTipo === 'agendamento' && !agendamentoId.trim()) { toast.error('Informe o ID do atendimento.'); return }
    if (vinculoTipo === 'cliente' && !clienteId) { toast.error('Selecione uma cliente.'); return }

    const payload = {
      formaPagto,
      statusPagto,
      observacao: observacao || undefined,
      itens: itens.map(i => ({ tipo: i.tipo, id: i.id, nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
      total: subtotal,
    }

    if (vinculoTipo === 'agendamento') payload.agendamentoId = agendamentoId.trim()
    if (vinculoTipo === 'cliente') payload.clienteId = Number(clienteId)

    setLoading(true)
    try {
      await apiClient.post('/vendas', payload)
      toast.success('Venda registrada com sucesso!')
      onSalvo()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.message || 'Erro ao registrar venda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div id="tour-nova-header" className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Nova Venda</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTourIndex(0); setTourAtivo(true) }} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Ajuda"><HelpCircle size={17} /></button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="venda-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="tour-forma-pagamento">
                <label className="block text-sm font-medium font-body mb-1.5">Forma de pagamento <span className="text-destructive">*</span></label>
                <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)} required className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body">
                  <option value="">Selecione...</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                </select>
              </div>
              <div id="tour-status-pagamento">
                <label className="block text-sm font-medium font-body mb-1.5">Status do pagamento</label>
                <select value={statusPagto} onChange={e => setStatusPagto(e.target.value)} className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="tour-vinculo">
                <label className="block text-sm font-medium font-body mb-1.5">Vincular venda (opcional)</label>
                <select
                  value={vinculoTipo}
                  onChange={e => {
                    setVinculoTipo(e.target.value)
                    setAgendamentoId('')
                    setClienteId('')
                  }}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body mb-2"
                >
                  <option value="nenhum">Sem vínculo</option>
                  <option value="agendamento">Atendimento</option>
                  <option value="cliente">Cliente</option>
                </select>

                {vinculoTipo === 'agendamento' && (
                  <input type="text" value={agendamentoId} onChange={e => setAgendamentoId(e.target.value)} placeholder="ID do atendimento" className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
                )}

                {vinculoTipo === 'cliente' && (
                  <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body">
                    <option value="">Selecione uma cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
              </div>
              <div id="tour-observacao-nova">
                <label className="block text-sm font-medium font-body mb-1.5">Observação (opcional)</label>
                <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: venda avulsa, atendimento facial..." className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
              </div>
            </div>
            {produtos.length > 0 && (
              <div id="tour-produtos">
                <p className="text-sm font-medium font-body mb-2 flex items-center gap-1"><Package size={13} /> Produtos</p>
                <div className="flex flex-wrap gap-2">
                  {produtos.map(p => (
                    <button key={p.id} type="button" onClick={() => addItem('produto', p)} disabled={p.estoqueAtual < 1} className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus size={10} /> {p.nome} — {formatCurrency(p.preco)} <span className="text-muted-foreground ml-1">({p.estoqueAtual} em estoque)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {servicos.length > 0 && (
              <div id="tour-servicos">
                <p className="text-sm font-medium font-body mb-2 flex items-center gap-1"><Scissors size={13} /> Serviços</p>
                <div className="flex flex-wrap gap-2">
                  {servicos.map(s => (
                    <button key={s.id} type="button" onClick={() => addItem('servico', s)} className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1">
                      <Plus size={10} /> {s.nome} — {formatCurrency(s.preco)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {itens.length > 0 && (
              <div id="tour-tabela-itens">
                <p className="text-sm font-medium font-body mb-2">Itens da venda</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm font-body">
                    <thead className="bg-muted/50">
                      <tr className="text-xs text-muted-foreground uppercase">
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-center">Qtd</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map(item => (
                        <tr key={`${item.tipo}-${item.id}`} className="border-t border-border">
                          <td className="px-3 py-2"><span className="font-medium">{item.nome}</span><span className="ml-2 text-xs text-muted-foreground capitalize">({item.tipo})</span></td>
                          <td className="px-3 py-2 text-center">
                            <input type="number" min={1} value={item.quantidade} onChange={e => updateQtd(item.id, item.tipo, Number(e.target.value))} className="w-14 text-center border border-input rounded px-1 py-0.5 text-sm bg-background focus:outline-none font-body" />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-primary">{formatCurrency(item.preco * item.quantidade)}</td>
                          <td className="px-3 py-2 text-right">
                            <button type="button" onClick={() => removeItem(item.id, item.tipo)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div id="tour-total-nova" className="flex justify-end mt-2">
                  <span className="text-sm font-body">Total: <strong className="text-primary font-sans text-base">{formatCurrency(subtotal)}</strong></span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border">
          <button onClick={onClose} className="flex-1 border border-border py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
          <button id="tour-registrar-venda" form="venda-form" type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Registrar venda
          </button>
        </div>
      </div>

      {tourAtivo && (
        <TourTooltip steps={novaVendaSteps} index={tourIndex}
          onNext={() => tourIndex === novaVendaSteps.length - 1 ? setTourAtivo(false) : setTourIndex(tourIndex + 1)}
          onPrev={() => setTourIndex(tourIndex - 1)}
          onStop={() => setTourAtivo(false)}
        />
      )}
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function VendasPage() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)
  const [tourAtivo, setTourAtivo] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)

  const vendasSteps = [
    { selector: '#tour-page-header', title: 'Módulo de Vendas', body: 'Bem-vindo ao módulo de Vendas! Aqui você registra todas as vendas realizadas (produtos e serviços), acompanha pagamentos e mantém o histórico financeiro atualizado.', tip: 'Acesse esta página sempre que fechar uma venda com um cliente.' },
    { selector: '#btn-nova-venda', title: 'Registrar nova venda', body: 'Clique aqui para abrir o formulário de nova venda. Você poderá adicionar produtos do estoque, serviços prestados, definir a forma de pagamento e o status.', tip: 'Atalho rápido: abra este modal logo após concluir um atendimento para não esquecer de registrar.' },
    { selector: '#tabela-vendas', title: 'Lista de vendas', body: 'Aqui ficam todas as vendas já registradas. Cada item mostra: data da venda, quem registrou, quantidade de itens, forma de pagamento, status e valor total.', tip: 'Clique em qualquer item para ver os detalhes completos e editar o pagamento.' },
  ]

  async function fetchVendas() {
    setLoading(true)
    try {
      const data = await apiClient.get('/vendas')
      setVendas(Array.isArray(data) ? data : data?.vendas || data?.data || [])
    } catch {
      setVendas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVendas() }, [])

  return (
    <div>
      {/* Header */}
      <div id="tour-page-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">Registre e acompanhe as vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setTourIndex(0); setTourAtivo(true) }} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors">
            <HelpCircle size={16} /> Ajuda
          </button>
          <button id="btn-nova-venda" onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-body hover:opacity-90 transition-opacity">
            <Plus size={16} /> Nova venda
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : vendas.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhuma venda registrada ainda.</p>
        </div>
      ) : (
        <div id="tabela-vendas">

          {/* ════════════════════════════════════════════════════════════
              VERSÃO MOBILE — visível apenas em telas menores que sm (< 640px)
              Cada venda é exibida como um card com as principais informações.
              A tabela fica escondida nesse breakpoint (hidden → sm:block).
          ════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-3 sm:hidden">
            {vendas.map((v, i) => (
              <div
                key={v?.id || i}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer active:bg-muted/40 transition-colors"
                onClick={() => setVendaSelecionada(v)}
              >
                {/* Linha superior: responsável + total */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-sm text-foreground truncate">
                      {v?.usuarioResponsavel?.nome || 'Administrador'}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {v?.data
                        ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : formatDate(v?.createdAt)}
                    </p>
                  </div>
                  <span className="font-sans font-bold text-primary text-sm whitespace-nowrap shrink-0">
                    {formatCurrency(v?.valorTotal ?? v?.total)}
                  </span>
                </div>

                {/* Linha do meio: itens + forma + status */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground font-body">
                    {v?.itens?.length ?? '—'} item(s)
                  </span>
                  <FormaBadge forma={v?.formaPagto} />
                  <StatusBadge status={v?.statusPagto} />
                </div>

                {/* Botão ver detalhes */}
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground font-body">
                  <Eye size={12} /> Ver detalhes
                </div>
              </div>
            ))}
          </div>
          {/* ════════════════════════════════════════════════════════════
              FIM VERSÃO MOBILE
          ════════════════════════════════════════════════════════════ */}


          {/* ════════════════════════════════════════════════════════════
              VERSÃO DESKTOP — visível apenas em telas sm+ (≥ 640px)
              Exibe as vendas como uma tabela tradicional com colunas.
              Os cards ficam escondidos nesse breakpoint (sm:hidden → block).
          ════════════════════════════════════════════════════════════ */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="bg-muted/50">
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                    <th id="col-data" className="px-4 py-3 font-medium">Data</th>
                    <th id="col-responsavel" className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Itens</th>
                    <th id="col-pagamento" className="px-4 py-3 font-medium">Pagamento</th>
                    <th id="col-status" className="px-4 py-3 font-medium">Status</th>
                    <th id="col-total" className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((v, i) => (
                    <tr
                      id={i === 0 ? 'primeira-venda' : undefined}
                      key={v?.id || i}
                      className="border-t border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setVendaSelecionada(v)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {v?.data ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : formatDate(v?.createdAt)}
                      </td>
                      <td className="px-4 py-3">{v?.usuarioResponsavel?.nome || 'Administrador'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v?.itens?.length ?? '—'} item(s)</td>
                      <td className="px-4 py-3"><FormaBadge forma={v?.formaPagto} /></td>
                      <td className="px-4 py-3"><StatusBadge status={v?.statusPagto} /></td>
                      <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(v?.valorTotal ?? v?.total)}</td>
                      <td className="px-4 py-3 text-right"><Eye size={15} className="text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* ════════════════════════════════════════════════════════════
              FIM VERSÃO DESKTOP
          ════════════════════════════════════════════════════════════ */}

        </div>
      )}

      {showModal && <NovaVendaModal onClose={() => setShowModal(false)} onSalvo={fetchVendas} />}
      {vendaSelecionada && <DetalheVendaModal venda={vendaSelecionada} onClose={() => setVendaSelecionada(null)} onAtualizado={fetchVendas} />}

      {tourAtivo && (
        <TourTooltip steps={vendasSteps} index={tourIndex}
          onNext={() => tourIndex === vendasSteps.length - 1 ? setTourAtivo(false) : setTourIndex(tourIndex + 1)}
          onPrev={() => setTourIndex(tourIndex - 1)}
          onStop={() => setTourAtivo(false)}
        />
      )}
    </div>
  )
}
