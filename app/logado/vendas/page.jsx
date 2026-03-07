'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/utils/apiClient'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, X, ShoppingCart } from 'lucide-react'

/**
 * Vendas — POST /vendas, GET /vendas
 * TODO: Se necessário, ajuste os campos retornados pela API (total, itens, etc).
 */

function NovaVendaModal({ onClose, onSalvo }) {
  const [produtos, setProdutos] = useState([])
  const [servicos, setServicos] = useState([])
  const [itens, setItens] = useState([])
  const [clienteNome, setClienteNome] = useState('')
  const [agendamentoId, setAgendamentoId] = useState('')
  const [loading, setLoading] = useState(false)

  // Busca produtos e serviços reais
  useEffect(() => {
    async function fetch() {
      try {
        const [p, s] = await Promise.all([
          apiClient.get('/produtos'),
          apiClient.get('/servicos'),
        ])
        setProdutos(Array.isArray(p) ? p : p?.produtos || [])
        setServicos(Array.isArray(s) ? s : s?.servicos || [])
      } catch {}
    }
    fetch()
  }, [])

  function addItem(tipo, item) {
    setItens((prev) => {
      const existe = prev.find((i) => i.id === item.id && i.tipo === tipo)
      if (existe) {
        return prev.map((i) =>
          i.id === item.id && i.tipo === tipo
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        )
      }
      return [...prev, { ...item, tipo, quantidade: 1 }]
    })
  }

  function removeItem(id, tipo) {
    setItens((prev) => prev.filter((i) => !(i.id === id && i.tipo === tipo)))
  }

  function updateQtd(id, tipo, qtd) {
    if (qtd < 1) return
    // RN15: validar estoque de produtos
    if (tipo === 'produto') {
      const prod = produtos.find((p) => p.id === id)
      const estAtual = Number(prod?.estoqueAtual ?? prod?.estoque_atual ?? 0)
      if (qtd > estAtual) {
        toast.error(`Estoque insuficiente para "${prod?.nome}". Disponível: ${estAtual}`)
        return
      }
    }
    setItens((prev) =>
      prev.map((i) => (i.id === id && i.tipo === tipo ? { ...i, quantidade: qtd } : i))
    )
  }

  const subtotal = itens.reduce(
    (acc, i) => acc + Number(i.preco || i.valor || 0) * i.quantidade,
    0
  )

  async function handleSubmit(e) {
    e.preventDefault()
    // RN13: pelo menos 1 item
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item à venda.')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/vendas', {
        clienteNome: clienteNome || undefined,
        agendamentoId: agendamentoId || undefined,
        itens: itens.map((i) => ({
          tipo: i.tipo,
          id: i.id,
          nome: i.nome,
          quantidade: i.quantidade,
          preco: Number(i.preco || i.valor || 0),
        })),
        total: subtotal,
      })
      toast.success('Venda registrada com sucesso!')
      onSalvo()
      onClose()
    } catch {
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
                  Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body mb-1.5">
                  ID do Agendamento (opcional)
                </label>
                <input
                  type="text"
                  value={agendamentoId}
                  onChange={(e) => setAgendamentoId(e.target.value)}
                  placeholder="Vincular a um atendimento"
                  className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                />
              </div>
            </div>

            {/* Adicionar produto */}
            {produtos.length > 0 && (
              <div>
                <p className="text-sm font-medium font-body mb-2">Adicionar produto</p>
                <div className="flex flex-wrap gap-2">
                  {produtos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addItem('produto', p)}
                      className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1"
                    >
                      <Plus size={10} /> {p.nome} — {formatCurrency(p.preco || p.valor)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar serviço */}
            {servicos.length > 0 && (
              <div>
                <p className="text-sm font-medium font-body mb-2">Adicionar serviço</p>
                <div className="flex flex-wrap gap-2">
                  {servicos.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addItem('servico', s)}
                      className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent font-body flex items-center gap-1"
                    >
                      <Plus size={10} /> {s.nome} — {formatCurrency(s.preco || s.valor)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Itens adicionados */}
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
                      {itens.map((item) => (
                        <tr key={`${item.tipo}-${item.id}`} className="border-t border-border">
                          <td className="px-3 py-2">
                            <span className="font-medium">{item.nome}</span>
                            <span className="ml-2 text-xs text-muted-foreground capitalize">
                              ({item.tipo})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantidade}
                              onChange={(e) =>
                                updateQtd(item.id, item.tipo, Number(e.target.value))
                              }
                              className="w-14 text-center border border-input rounded px-1 py-0.5 text-sm bg-background focus:outline-none font-body"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-primary">
                            {formatCurrency(
                              Number(item.preco || item.valor || 0) * item.quantidade
                            )}
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

export default function VendasPage() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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

  useEffect(() => {
    fetchVendas()
  }, [])

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
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v, i) => (
                  <tr key={v?.id || i} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(v?.createdAt || v?.data)}
                    </td>
                    <td className="px-4 py-3">
                      {v?.cliente?.nome || v?.clienteNome || 'Venda avulsa'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v?.itens?.length || '-'} item(s)
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatCurrency(v?.total)}
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
    </div>
  )
}
