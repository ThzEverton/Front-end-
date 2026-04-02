'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import { formatCurrency, todayISO, statusAgendamentoLabel } from '@/utils/helpers'
import { toast } from 'sonner'
import {
  CalendarDays,
  ShoppingCart,
  Package,
  Wallet,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Clock3,
} from 'lucide-react'

function erroApi(error, fallback) {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  )
}

// Converte "2026-03-27T03:00:00.000Z" → "27/03/2026" sem problema de timezone
function formatarDataISO(dataISO) {
  if (!dataISO) return '-'
  try {
    const parte = String(dataISO).includes('T') ? String(dataISO).split('T')[0] : String(dataISO)
    const [ano, mes, dia] = parte.split('-')
    return `${dia}/${mes}/${ano}`
  } catch {
    return '-'
  }
}

// Retorna HH:MM direto do campo horaInicio
function formatarHora(valor) {
  if (!valor) return '-'
  return String(valor).slice(0, 5)
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary', loading }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-wide mb-1">{label}</p>
        {loading ? (
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-card-foreground font-sans">{value}</p>
        )}
        {sub && <p className="text-xs text-muted-foreground font-body mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function DashboardGerente({ loadingAll, agendamentosHoje, vendas, produtos, financeiro, hoje }) {
  const vendasHoje = vendas.filter((v) => v?.createdAt?.startsWith(hoje) || v?.data?.startsWith(hoje))
  const totalVendasHoje = vendasHoje.reduce((acc, v) => acc + Number(v?.total || v?.valor_total || 0), 0)

  const mesAtual = hoje.slice(0, 7) // "2026-04"
  const receitaMes = financeiro
    .filter((f) => {
      const status = String(f?.status || '').toLowerCase()
      return status === 'pago' && String(f?.dataRef || '').startsWith(mesAtual)
    })
    .reduce((acc, f) => acc + Number(f?.valor || 0), 0)

  const produtosAlerta = produtos.filter(
    (p) => Number(p?.estoqueAtual ?? p?.estoque_atual ?? 0) <= Number(p?.estoqueMinimo ?? p?.estoque_minimo ?? 0)
  )

  const agProximos = agendamentosHoje
    .filter((a) => String(a?.status || '').toLowerCase() !== 'cancelado')
    .slice(0, 5)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Agendamentos hoje" value={agendamentosHoje.length} loading={loadingAll} color="text-primary" />
        <StatCard icon={ShoppingCart} label="Vendas hoje" value={formatCurrency(totalVendasHoje)} sub={`${vendasHoje.length} venda(s)`} loading={loadingAll} color="text-primary" />
        <StatCard icon={Package} label="Estoque em alerta" value={produtosAlerta.length} sub="produtos abaixo do mínimo" loading={loadingAll} color={produtosAlerta.length > 0 ? 'text-destructive' : 'text-primary'} />
        <StatCard icon={Wallet} label="Receita do mês" value={formatCurrency(receitaMes)} sub="apenas pagamentos confirmados" loading={loadingAll} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-lg font-semibold text-card-foreground">Agendamentos de hoje</h2>
            <Link href="/logado/agendamentos" className="text-xs text-primary hover:underline flex items-center gap-1 font-body">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : agProximos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Nenhum agendamento para hoje.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {agProximos.map((a, i) => (
                <div key={a?.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-card-foreground font-body">
                      {a?.criadoPor?.nome || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      {a?.servico?.nome || '-'} · {formatarHora(a?.horaInicio)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                    String(a?.status || '').toLowerCase() === 'cancelado'
                      ? 'bg-destructive/10 text-destructive'
                      : String(a?.status || '').toLowerCase() === 'concluido'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-accent text-primary'
                  }`}>
                    {statusAgendamentoLabel(a?.status || 'AGENDADO')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-lg font-semibold text-card-foreground">Estoque em alerta</h2>
            <Link href="/logado/estoque" className="text-xs text-primary hover:underline flex items-center gap-1 font-body">
              Ver estoque <ChevronRight size={12} />
            </Link>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : produtosAlerta.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Nenhum produto em alerta de estoque.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {produtosAlerta.slice(0, 5).map((p, i) => (
                <div key={p?.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-destructive flex-shrink-0" />
                    <p className="text-sm font-medium text-card-foreground font-body">{p?.nome}</p>
                  </div>
                  <span className="text-xs text-destructive font-body">
                    {p?.estoqueAtual ?? p?.estoque_atual ?? 0} restantes
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-lg font-semibold text-card-foreground">Vendas recentes</h2>
            <Link href="/logado/vendas" className="text-xs text-primary hover:underline flex items-center gap-1 font-body">
              Ver vendas <ChevronRight size={12} />
            </Link>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Nenhuma venda registrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="pb-2 text-left font-medium">Data</th>
                    <th className="pb-2 text-left font-medium">Cliente</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.slice(0, 6).map((v, i) => (
                    <tr key={v?.id || i} className="border-b border-border last:border-0">
                      <td className="py-2 text-muted-foreground">
                        {formatarDataISO(v?.createdAt || v?.data)}
                      </td>
                      <td className="py-2">{v?.cliente?.nome || v?.clienteNome || '-'}</td>
                      <td className="py-2 text-right font-medium text-primary">
                        {formatCurrency(v?.total || v?.valor_total || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DashboardCliente({ loadingAll, agendamentosHoje, slots }) {
  const meusAgendamentos = agendamentosHoje
    .filter((a) => String(a?.status || '').toLowerCase() !== 'cancelado')
    .slice(0, 5)

  const proximosSlots = slots
    .filter((s) => String(s?.status || '').toLowerCase() === 'disponivel' || s?.disponivel === true)
    .slice(0, 6)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Meus agendamentos" value={meusAgendamentos.length} loading={loadingAll} color="text-primary" />
        <StatCard icon={Clock3} label="Horários livres hoje" value={proximosSlots.length} sub="disponíveis para agendamento" loading={loadingAll} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-lg font-semibold text-card-foreground">Meus agendamentos</h2>
            <Link href="/logado/agendamentos" className="text-xs text-primary hover:underline flex items-center gap-1 font-body">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : meusAgendamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Você não tem agendamentos no momento.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {meusAgendamentos.map((a, i) => (
                <div key={a?.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-card-foreground font-body">
                      {a?.servico?.nome || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      {formatarDataISO(a?.data)} · {formatarHora(a?.horaInicio)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-body bg-accent text-primary">
                    {statusAgendamentoLabel(a?.status || 'AGENDADO')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-lg font-semibold text-card-foreground">Horários disponíveis hoje</h2>
            <Link href="/logado/agenda" className="text-xs text-primary hover:underline flex items-center gap-1 font-body">
              Ir para agenda <ChevronRight size={12} />
            </Link>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : proximosSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Não há horários livres hoje.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {proximosSlots.map((s, i) => (
                <div key={s?.slot || i} className="border border-border rounded-lg px-3 py-3 text-center text-sm font-body bg-accent/40">
                  {formatarHora(s?.slot || s?.hora || s?.horario)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user, isGerente } = useUser()
  const hoje = todayISO()

  const [agendamentosHoje, setAgendamentosHoje] = useState([])
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [financeiro, setFinanceiro] = useState([])
  const [slots, setSlots] = useState([])
  const [loadingAll, setLoadingAll] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoadingAll(true)
      try {
        const results = await Promise.allSettled([
          apiClient.get(`/agendamentos?data=${hoje}`),
          isGerente ? apiClient.get('/vendas') : Promise.resolve([]),
          isGerente ? apiClient.get('/produtos') : Promise.resolve([]),
          isGerente ? apiClient.get('/financeiro') : Promise.resolve([]),
          apiClient.get(`/agenda/slots?date=${hoje}`),
        ])

        const [agRes, venRes, prodRes, finRes, slotsRes] = results

        if (agRes.status === 'fulfilled') {
          const d = agRes.value
          setAgendamentosHoje(Array.isArray(d) ? d : d?.data || d?.agendamentos || [])
        } else {
          toast.error(erroApi(agRes.reason, 'Erro ao carregar agendamentos.'))
        }

        if (venRes.status === 'fulfilled') {
          const d = venRes.value
          setVendas(Array.isArray(d) ? d : d?.data || d?.vendas || [])
        } else {
          toast.error(erroApi(venRes.reason, 'Erro ao carregar vendas.'))
        }

        if (prodRes.status === 'fulfilled') {
          const d = prodRes.value
          setProdutos(Array.isArray(d) ? d : d?.data || d?.produtos || [])
        } else {
          toast.error(erroApi(prodRes.reason, 'Erro ao carregar produtos.'))
        }

        if (finRes.status === 'fulfilled') {
          const d = finRes.value
          // ✅ FIX: /financeiro retorna { registros: [], resumo: {} }
          setFinanceiro(Array.isArray(d) ? d : d?.registros || d?.data || [])
        } else {
          toast.error(erroApi(finRes.reason, 'Erro ao carregar financeiro.'))
        }

        if (slotsRes.status === 'fulfilled') {
          const d = slotsRes.value
          setSlots(Array.isArray(d) ? d : d?.slots || [])
        } else {
          toast.error(erroApi(slotsRes.reason, 'Erro ao carregar horários.'))
        }
      } finally {
        setLoadingAll(false)
      }
    }

    fetchAll()
  }, [hoje, isGerente])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold text-foreground">
          Olá, {user?.nome?.split(' ')[0] || 'bem-vinda'}!
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Aqui está o resumo de hoje — {formatarDataISO(hoje)}
        </p>
      </div>

      {isGerente ? (
        <DashboardGerente
          loadingAll={loadingAll}
          agendamentosHoje={agendamentosHoje}
          vendas={vendas}
          produtos={produtos}
          financeiro={financeiro}
          hoje={hoje}
        />
      ) : (
        <DashboardCliente
          loadingAll={loadingAll}
          agendamentosHoje={agendamentosHoje}
          slots={slots}
        />
      )}
    </div>
  )
}