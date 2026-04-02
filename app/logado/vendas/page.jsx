'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  Loader2, Plus, Trash2, X, ShoppingCart,
  CreditCard, Banknote, QrCode, Eye, Package, Scissors, CheckCircle2
} from 'lucide-react'

// ─── helpers visuais ────────────────────────────────────────────────────────

const FORMA_LABEL = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' }
const FORMA_ICON  = { dinheiro: Banknote, cartao: CreditCard, pix: QrCode }

const STATUS_STYLE = {
  pendente:  'bg-yellow-100 text-yellow-700',
  pago:      'bg-green-100  text-green-700',
  cancelado: 'bg-red-100    text-red-700',
  estornado: 'bg-gray-100   text-gray-600',
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

// ─── Modal: Detalhe da Venda ─────────────────────────────────────────────────

function DetalheVendaModal({ venda, onClose, onAtualizado }) {
  const [itens, setItens] = useState(venda?.itens || [])
  const [loadingItens, setLoadingItens] = useState(false)

  // estado local do pagamento para refletir alterações sem fechar a modal
  const [formaPagto, setFormaPagto] = useState(venda?.formaPagto || '')
  const [statusPagto, setStatusPagto] = useState(venda?.statusPagto || 'pendente')
  const [editandoPagto, setEditandoPagto] = useState(false)
  const [loadingSalvar, setLoadingSalvar] = useState(false)

  useEffect(() => {
    if (venda?.itens?.length) {
      setItens(venda.itens)
      return
    }
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
      onAtualizado?.() // atualiza a listagem por trás
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Erro ao atualizar pagamento.')
    } finally {
      setLoadingSalvar(false)
    }
  }

  const data = venda?.data
    ? new Date(venda.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : '—'

  const pagamentoAlterado = formaPagto !== venda?.formaPagto || statusPagto !== venda?.statusPagto

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl animate-fade-in max-h-[90vh] flex flex-col">

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h3 className="font-sans text-lg font-bold text-card-foreground">
              Venda #{venda.id}
            </h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{data}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">

          {/* info resumida */}
          <div className="grid grid-cols-2 gap-3">

            {/* forma de pagamento */}
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Forma de pagamento</p>
              {editandoPagto ? (
                <select
                  value={formaPagto}
                  onChange={e => setFormaPagto(e.target.value)}
                  className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                </select>
              ) : (
                <FormaBadge forma={formaPagto} />
              )}
            </div>

            {/* status */}
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Status</p>
              {editandoPagto ? (
                <select
                  value={statusPagto}
                  onChange={e => setStatusPagto(e.target.value)}
                  className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              ) : (
                <StatusBadge status={statusPagto} />
              )}
            </div>

            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Responsável</p>
              <p className="text-sm font-medium font-body">
                {venda?.usuarioResponsavel?.nome || '—'}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Total</p>
              <p className="text-sm font-bold text-primary font-sans">
                {formatCurrency(venda?.valorTotal ?? venda?.total)}
              </p>
            </div>
          </div>

          {/* botões edição de pagamento */}
          {!editandoPagto ? (
            <button
              onClick={() => setEditandoPagto(true)}
              className="w-full border border-border rounded-lg py-2 text-xs font-body text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={13} /> Atualizar pagamento
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditandoPagto(false); setFormaPagto(venda?.formaPagto || ''); setStatusPagto(venda?.statusPagto || 'pendente') }}
                className="flex-1 border border-border rounded-lg py-2 text-xs font-body text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarPagamento}
                disabled={loadingSalvar || !pagamentoAlterado}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-body hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingSalvar
                  ? <Loader2 size={12} className="animate-spin" />
                  : <CheckCircle2 size={12} />
                }
                Salvar
              </button>
            </div>
          )}

          {venda?.observacao && (
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-0.5">Observação</p>
              <p className="text-sm font-body">{venda.observacao}</p>
            </div>
          )}

          {/* itens */}
          <div>
            <p className="text-sm font-medium font-body mb-2">Itens da venda</p>
            {loadingItens ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : itens.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-4">
                Nenhum item encontrado.
              </p>
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
                      const sub  = Number(item?.subtotal ?? 0)
                      const qtd  = Number(item?.quantidade ?? 1)
                      return (
                        <tr key={item?.id || idx} className="border-t border-border">
                          <td className="px-3 py-2">
                            <span className="font-medium">{nome}</span>
                            <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground capitalize">
                              {tipo === 'produto' ? <Package size={10} /> : <Scissors size={10} />}
                              {tipo}
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

        {/* footer */}
        <div className="px-6 pb-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full border border-border py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Nova Venda ───────────────────────────────────────────────────────

function NovaVendaModal({ onClose, onSalvo }) {
  const [produtos, setProdutos] = useState([])
  const [servicos, setServicos] = useState([])
  const [itens, setItens] = useState([])
  const [agendamentoId, setAgendamentoId] = useState('')
  const [formaPagto, setFormaPagto] = useState('')
  const [statusPagto, setStatusPagto] = useState('pendente')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [p, s] = await Promise.all([
          apiClient.get('/produtos'),
          apiClient.get('/servicos'),
        ])
        const prods = (Array.isArray(p) ? p : p?.produtos || []).map(prod => ({
          ...prod,
          preco: Number(prod.precoVenda ?? prod.preco_venda ?? prod.preco ?? prod.valor ?? 0),
          estoqueAtual: Number(prod.estoqueAtual ?? prod.estoque_atual ?? 0),
        }))
        const servs = (Array.isArray(s) ? s : s?.servicos || []).map(serv => ({
          ...serv,
          preco: Number(serv.preco ?? serv.valor ?? 0),
        }))
        setProdutos(prods)
        setServicos(servs)
      } catch {}
    }
    load()
  }, [])

  function addItem(tipo, item) {
    setItens(prev => {
      const existe = prev.find(i => i.id === item.id && i.tipo === tipo)
      if (existe) {
        const novaQtd = existe.quantidade + 1
        if (tipo === 'produto' && novaQtd > item.estoqueAtual) {
          toast.error(`Estoque insuficiente para "${item.nome}". Disponível: ${item.estoqueAtual}`)
          return prev
        }
        return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, quantidade: novaQtd } : i)
      }
      if (tipo === 'produto' && item.estoqueAtual < 1) {
        toast.error(`"${item.nome}" está sem estoque.`)
        return prev
      }
      return [...prev, { ...item, tipo, quantidade: 1 }]
    })
  }

  function removeItem(id, tipo) {
    setItens(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)))
  }

  function updateQtd(id, tipo, qtd) {
    if (qtd < 1) return
    if (tipo === 'produto') {
      const prod = produtos.find(p => p.id === id)
      if (qtd > prod.estoqueAtual) {
        toast.error(`Estoque insuficiente para "${prod.nome}". Disponível: ${prod.estoqueAtual}`)
        return
      }
    }
    setItens(prev => prev.map(i => i.id === id && i.tipo === tipo ? { ...i, quantidade: qtd } : i))
  }

  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (itens.length === 0) { toast.error('Adicione pelo menos um item à venda.'); return }
    if (!formaPagto) { toast.error('Selecione a forma de pagamento.'); return }
    setLoading(true)
    try {
      await apiClient.post('/vendas', {
        agendamentoId: agendamentoId || undefined,
        formaPagto,
        statusPagto,
        observacao: observacao || undefined,
        itens: itens.map(i => ({
          tipo: i.tipo,
          id: i.id,
          nome: i.nome,
          quantidade: i.quantidade,
          preco: i.preco,
        })),
        total: subtotal,
      })
      toast.success('Venda registrada com sucesso!')
      onSalvo()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Erro ao registrar venda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl animate-fade-in max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h3 className="font-sans text-lg font-bold text-card-foreground">Nova Venda</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="venda-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Forma de pagamento <span className="text-destructive">*</span>
                </label>
                <select
                  value={formaPagto}
                  onChange={e => setFormaPagto(e.target.value)}
                  required
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                >
                  <option value="">Selecione...</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Status do pagamento
                </label>
                <select
                  value={statusPagto}
                  onChange={e => setStatusPagto(e.target.value)}
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  ID do Agendamento (opcional)
                </label>
                <input
                  type="text"
                  value={agendamentoId}
                  onChange={e => setAgendamentoId(e.target.value)}
                  placeholder="Vincular a um atendimento"
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: venda avulsa, atendimento facial..."
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>

            {produtos.length > 0 && (
              <div>
                <p className="text-sm font-medium font-body mb-2 flex items-center gap-1">
                  <Package size={13} /> Produtos
                </p>
                <div className="flex flex-wrap gap-2">
                  {produtos.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addItem('produto', p)}
                      disabled={p.estoqueAtual < 1}
                      className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={10} />
                      {p.nome} — {formatCurrency(p.preco)}
                      <span className="text-muted-foreground ml-1">({p.estoqueAtual} em estoque)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {servicos.length > 0 && (
              <div>
                <p className="text-sm font-medium font-body mb-2 flex items-center gap-1">
                  <Scissors size={13} /> Serviços
                </p>
                <div className="flex flex-wrap gap-2">
                  {servicos.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addItem('servico', s)}
                      className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1"
                    >
                      <Plus size={10} /> {s.nome} — {formatCurrency(s.preco)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {itens.length > 0 && (
              <div>
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
                          <td className="px-3 py-2">
                            <span className="font-medium">{item.nome}</span>
                            <span className="ml-2 text-xs text-muted-foreground capitalize">({item.tipo})</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantidade}
                              onChange={e => updateQtd(item.id, item.tipo, Number(e.target.value))}
                              className="w-14 text-center border border-input rounded px-1 py-0.5 text-sm bg-background focus:outline-none font-body"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-primary">
                            {formatCurrency(item.preco * item.quantidade)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id, item.tipo)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-sm font-body">
                    Total:{' '}
                    <strong className="text-primary font-sans text-base">
                      {formatCurrency(subtotal)}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 border border-border py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            form="venda-form"
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Registrar venda
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function VendasPage() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">
            Registre e acompanhe as vendas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-body hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nova venda
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : vendas.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-body">Nenhuma venda registrada ainda.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {vendas.map((v, i) => (
                  <tr
                    key={v?.id || i}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => setVendaSelecionada(v)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {v?.data
                        ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : formatDate(v?.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {v?.usuarioResponsavel?.nome || 'Administrador'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v?.itens?.length ?? '—'} item(s)
                    </td>
                    <td className="px-4 py-3">
                      <FormaBadge forma={v?.formaPagto} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v?.statusPagto} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatCurrency(v?.valorTotal ?? v?.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Eye size={15} className="text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <NovaVendaModal
          onClose={() => setShowModal(false)}
          onSalvo={fetchVendas}
        />
      )}

      {vendaSelecionada && (
        <DetalheVendaModal
          venda={vendaSelecionada}
          onClose={() => setVendaSelecionada(null)}
          onAtualizado={fetchVendas}
        />
      )}
    </div>
  )
}