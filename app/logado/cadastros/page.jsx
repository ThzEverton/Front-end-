'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useUser } from '@/context/userContext'
import apiClient from '@/utils/apiClient'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  X,
  ToggleLeft,
  ToggleRight,
  Users,
  Scissors,
  Package,
  Calendar,
  Cake,
  MessageCircle,
  FileText,
} from 'lucide-react'

// ─── Relatório helpers ────────────────────────────────────────────────────────

const FORMA_LABEL = { cartao: 'Cartão', dinheiro: 'Dinheiro', pix: 'Pix', consultora: 'Consultora', cliente: 'Cliente' }
const FORMA_CORES = {
  cartao:     { bg: '#fce7f0', cor: '#993556' },
  dinheiro:   { bg: '#E1F5EE', cor: '#0F6E56' },
  pix:        { bg: '#E6F1FB', cor: '#185FA5' },
  consultora: { bg: '#EEEDFE', cor: '#534AB7' },
  cliente:    { bg: '#F1EFE8', cor: '#5F5E5A' },
  _default:   { bg: '#F1EFE8', cor: '#5F5E5A' },
}
const getCores = (f) => FORMA_CORES[f] || FORMA_CORES._default

function fmtData(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

function fmtMoeda(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function baixarCSV(rows, filename) {
  const sep = ';'
  const header = ['Data', 'Descrição', 'Tipo', 'Forma de Pagamento', 'Valor (R$)', 'Status']
  const linhas = rows.map((r) => [
    r.Data,
    `"${r.Descricao}"`,
    r.Tipo,
    FORMA_LABEL[r.Forma] || r.Forma,
    Number(r.Valor).toFixed(2).replace('.', ','),
    r.Status,
  ].join(sep))
  const total = rows.reduce((acc, r) => acc + Number(r.Valor || 0), 0)
  const separador = Array(header.length).fill('---').join(sep)
  const rodape = ['', '"Total"', '', '', Number(total).toFixed(2).replace('.', ','), ''].join(sep)
  const conteudo = [header.join(sep), separador, ...linhas, separador, rodape].join('\n')
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Status badge dinâmico ────────────────────────────────────────────────────

function statusStyle(status) {
  const map = {
    ativo:  { background: '#E1F5EE', color: '#0F6E56' },
    ok:     { background: '#E1F5EE', color: '#0F6E56' },
    pago:   { background: '#E1F5EE', color: '#0F6E56' },
    baixo:  { background: '#fce7f0', color: '#993556' },
    inativo:{ background: '#F1EFE8', color: '#5F5E5A' },
  }
  return map[status] || { background: '#F1EFE8', color: '#5F5E5A' }
}

// ─── Componente do relatório ──────────────────────────────────────────────────

function RelatorioFinanceiro({
  registros     = [],
  titulo        = 'Relatório',
  subtitulo,
  eyebrow       = 'Relatório',
  tipo          = 'TODOS',
  statusFiltro  = null,
  nomeArquivo   = 'relatorio.csv',
  accentColor   = '#d4537e',
}) {
  const [exportado, setExportado] = useState(false)

  const itens = useMemo(() => registros.filter((r) => {
    const statusOk = statusFiltro ? r?.status === statusFiltro : true
    const tipoOk   = tipo === 'TODOS' ? true : !r?.tipo || r?.tipo === tipo
    return statusOk && tipoOk
  }), [registros, statusFiltro, tipo])

  const total     = useMemo(() => itens.reduce((acc, r) => acc + Number(r?.valor || 0), 0), [itens])
  const ticketMed = itens.length > 0 ? total / itens.length : 0

  const porForma = useMemo(() => itens.reduce((acc, r) => {
    const f = r?.formaPagto || '_default'
    acc[f] = (acc[f] || 0) + Number(r?.valor || 0)
    return acc
  }, {}), [itens])

  const dataLabel = subtitulo || new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  function handleCSV() {
    if (!itens.length) return
    baixarCSV(itens.map((r) => ({
      Data:      fmtData(r?.dataRef),
      Descricao: r?.descricao || '-',
      Tipo:      r?.tipo || tipo,
      Forma:     r?.formaPagto || '-',
      Valor:     r?.valor,
      Status:    r?.status,
    })), nomeArquivo)
    setExportado(true)
    setTimeout(() => setExportado(false), 2000)
  }

  const accentBg = accentColor + '15'

  return (
    <div style={r.page}>
      <div style={r.header}>
        <div>
          <div style={{ ...r.eyebrow, color: accentColor }}>{eyebrow}</div>
          <h1 style={r.titulo}>{titulo}</h1>
          <p style={r.subtitulo}>{dataLabel}</p>
        </div>
        <button
          style={{ ...r.btnExport, background: exportado ? '#0F6E56' : accentColor, borderColor: exportado ? '#0F6E56' : accentColor, opacity: itens.length === 0 ? 0.4 : 1 }}
          onClick={handleCSV}
          disabled={!itens.length}
        >
          {exportado ? <><IcoCheck /> Exportado!</> : <><IcoDl /> Exportar CSV</>}
        </button>
      </div>

      <div style={r.metricsGrid}>
        <MetCard label="Total"        value={fmtMoeda(total)}   cor={accentColor} icon={<IcoMoney cor={accentColor} />} />
        <MetCard label="Registros"    value={itens.length}                          icon={<IcoCheck2 />} />
        <MetCard label="Ticket médio" value={fmtMoeda(ticketMed)}                  icon={<IcoChart />} />
      </div>

      {Object.keys(porForma).length > 0 && (
        <div style={r.section}>
          <p style={r.secLabel}>Distribuição</p>
          <div style={r.formaGrid}>
            {Object.entries(porForma).map(([forma, val]) => {
              const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0
              const { bg, cor } = getCores(forma)
              return (
                <div key={forma} style={r.formaCard}>
                  <span style={{ ...r.badge, background: bg, color: cor }}>{FORMA_LABEL[forma] || forma}</span>
                  <div style={r.formaValor}>{fmtMoeda(val)}</div>
                  <div style={r.barTrack}><div style={{ ...r.barFill, width: `${pct}%`, background: cor }} /></div>
                  <div style={r.formaPct}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={r.section}>
        <p style={r.secLabel}>Lançamentos</p>
        {!itens.length ? (
          <div style={r.vazio}>Nenhum registro encontrado.</div>
        ) : (
          <div style={r.tableWrap}>
            <table style={r.table}>
              <thead>
                <tr style={{ background: accentBg }}>
                  {['Data', 'Descrição', 'Forma', 'Valor', 'Status'].map((col) => (
                    <th key={col} style={{ ...r.th, color: accentColor }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((item, i) => {
                  const forma = item?.formaPagto || '_default'
                  const { bg, cor } = getCores(forma)
                  return (
                    <tr key={i} style={r.tr}>
                      <td style={{ ...r.td, ...r.tdMuted }}>{fmtData(item?.dataRef)}</td>
                      <td style={{ ...r.td, fontWeight: 500 }}>{item?.descricao || '-'}</td>
                      <td style={r.td}><span style={{ ...r.badge, background: bg, color: cor }}>{FORMA_LABEL[forma] || forma}</span></td>
                      <td style={{ ...r.td, fontWeight: 600, color: '#0F6E56', fontVariantNumeric: 'tabular-nums' }}>{fmtMoeda(item?.valor)}</td>
                      <td style={r.td}>
                        <span style={{ ...r.statusBadge, ...statusStyle(item?.status) }}>
                          {item?.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ ...r.td, ...r.tfootLabel }}>Total</td>
                  <td style={{ ...r.td, ...r.tfootTotal, color: accentColor }}>{fmtMoeda(total)}</td>
                  <td style={r.td} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div style={r.rodape}>Gerado automaticamente · {new Date().getFullYear()}</div>
    </div>
  )
}

// ─── Modal do relatório ───────────────────────────────────────────────────────

function RelatorioModal({ config, onClose }) {
  if (!config) return null
  return (
    <div
      style={st.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={st.modal}>
        <button style={st.btnFechar} onClick={onClose} aria-label="Fechar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
        <div style={st.scrollArea}>
          <RelatorioFinanceiro {...config} />
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes do relatório ─────────────────────────────────────────────

function MetCard({ label, value, cor, icon }) {
  return (
    <div style={r.metricCard}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={r.metricLabel}>{label}</div>
      <div style={{ ...r.metricValue, color: cor || '#1a1a1a' }}>{value}</div>
    </div>
  )
}

const IcoDl    = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8m0 0L5 7m3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" /></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 4" /></svg>
const IcoMoney = ({ cor }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor || '#d4537e'} strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5-1.3 2.5-3 2.5-3 1.1-3 2.5S10.3 17 12 17s3-1.1 3-2.5" /></svg>
const IcoCheck2 = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>
const IcoChart  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.6" strokeLinecap="round"><path d="M4 20V10M9 20V4M14 20v-7M19 20v-4" /></svg>

// ─── Estilos modal ────────────────────────────────────────────────────────────

const st = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    zIndex: 9999, display: 'flex', alignItems: 'flex-start',
    justifyContent: 'center', padding: '2rem 1rem', backdropFilter: 'blur(2px)',
  },
  modal: {
    position: 'relative', background: '#fff', borderRadius: 20,
    width: '100%', maxWidth: 900, maxHeight: '90vh',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  scrollArea: { overflowY: 'auto', flex: 1 },
  btnFechar: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    background: '#f5f5f3', border: 'none', borderRadius: 8,
    width: 32, height: 32, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', color: '#888',
  },
}

// ─── Estilos relatório ────────────────────────────────────────────────────────

const r = {
  page:       { fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem', background: '#fff', color: '#1a1a1a' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: 16, flexWrap: 'wrap' },
  eyebrow:    { fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 },
  titulo:     { fontSize: 28, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2 },
  subtitulo:  { fontSize: 13, color: '#999', margin: 0 },
  btnExport:  { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: '1.5px solid', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s, background 0.2s', fontFamily: 'inherit' },
  metricsGrid:{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '2rem' },
  metricCard: { background: '#fafafa', border: '1px solid #f0ece8', borderRadius: 14, padding: '18px 20px' },
  metricLabel:{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
  metricValue:{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' },
  section:    { marginBottom: '1.75rem' },
  secLabel:   { fontSize: 11, fontWeight: 500, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 12px' },
  formaGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 },
  formaCard:  { background: '#fafafa', border: '1px solid #f0ece8', borderRadius: 12, padding: '14px 16px' },
  badge:      { fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, display: 'inline-block', marginBottom: 8 },
  formaValor: { fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' },
  barTrack:   { height: 3, background: '#f0ece8', borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill:    { height: '100%', borderRadius: 99, opacity: 0.7 },
  formaPct:   { fontSize: 11, color: '#bbb' },
  tableWrap:  { border: '1px solid #f0ece8', borderRadius: 14, overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' },
  tr:         { borderTop: '1px solid #f9f4f6' },
  td:         { padding: '12px 16px', verticalAlign: 'middle', color: '#1a1a1a' },
  tdMuted:    { color: '#bbb', fontSize: 12, whiteSpace: 'nowrap' },
  statusBadge:{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-block' },
  tfootLabel: { fontWeight: 600, color: '#bbb', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 14, borderTop: '1.5px solid #f0ece8' },
  tfootTotal: { fontWeight: 700, fontSize: 15, paddingTop: 14, borderTop: '1.5px solid #f0ece8' },
  vazio:      { textAlign: 'center', padding: '3rem', color: '#ccc', fontSize: 14 },
  rodape:     { marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #f0ece8', fontSize: 11, color: '#ddd', textAlign: 'center', letterSpacing: '0.04em' },
}

// ─── Abas ─────────────────────────────────────────────────────────────────────

const ABAS = [
  { key: 'usuarios', label: 'Usuários',      icon: Users    },
  { key: 'servicos', label: 'Serviços',      icon: Scissors },
  { key: 'produtos', label: 'Produtos',      icon: Package  },
  { key: 'slots',    label: 'Slots / Exceções', icon: Calendar },
]

// ─── UsuariosTab ──────────────────────────────────────────────────────────────

function UsuariosTab() {
  const [usuarios, setUsuarios]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [modal, setModal]                     = useState(null)
  const [relatorioConfig, setRelatorioConfig] = useState(null)
  const [filtroConsultora, setFiltroConsultora] = useState(false)
  const [filtroAniversario, setFiltroAniversario] = useState(false)

  async function fetchUsuarios() {
    setLoading(true)
    try {
      const data = await apiClient.get('/users')
      setUsuarios(Array.isArray(data) ? data : data?.users || [])
    } catch (error) {
      console.error(error)
      setUsuarios([])
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  async function toggleAtivo(id) {
    try {
      await apiClient.patch(`/users/${id}/toggle-ativo`)
      toast.success('Status atualizado!')
      fetchUsuarios()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar status do usuário.')
    }
  }

  const mesAtual = new Date().getMonth() + 1

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroConsultora && !u.isConsultora && !u.is_consultora) return false
    if (filtroAniversario) {
      if (!u.dataNascimento) return false
      const mes = parseInt(u.dataNascimento.split('-')[1], 10)
      if (mes !== mesAtual) return false
    }
    return true
  })

  function handleRelatorio() {
    const registros = usuariosFiltrados.map((u) => ({
      dataRef:   u.createdAt || null,
      descricao: u.nome,
      tipo:      u.perfil || 'cliente',
      formaPagto: u.isConsultora || u.is_consultora ? 'consultora' : 'cliente',
      valor:     0,
      status:    u.ativo !== false && u.ativo !== 0 ? 'ativo' : 'inativo',
    }))

    setRelatorioConfig({
      registros,
      titulo:      'Relatório de Usuários',
      eyebrow:     'Cadastros · Usuários',
      accentColor: '#7F77DD',
      tipo:        'TODOS',
      statusFiltro: null,
      nomeArquivo: 'usuarios.csv',
    })
  }

  return (
    <div>
      <RelatorioModal config={relatorioConfig} onClose={() => setRelatorioConfig(null)} />

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground font-body">
            {usuariosFiltrados.length} usuário(s)
          </p>

          <button
            onClick={() => setFiltroConsultora((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${
              filtroConsultora
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Users size={13} />
            Consultoras
          </button>

          <button
            onClick={() => setFiltroAniversario((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${
              filtroAniversario
                ? 'bg-pink-100 text-pink-700 border-pink-300'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Cake size={13} />
            Aniversariantes
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRelatorio}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            <FileText size={14} />
            Relatório
          </button>

          <button
            onClick={() => setModal({})}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90"
          >
            <Plus size={14} /> Novo usuário
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">Nenhum usuário.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground uppercase text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Perfil</th>
                <th className="px-4 py-2">Consultora</th>
                <th className="px-4 py-2">Ativo</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u, i) => {
                const isAniversariante = (() => {
                  if (!u.dataNascimento) return false
                  const mes = parseInt(u.dataNascimento.split('-')[1], 10)
                  return mes === mesAtual
                })()
                const mensagemAniversario = `Olá ${u.nome.split(' ')[0]}! 🎂 Feliz aniversário! Que seu dia seja incrível!`

                return (
                  <tr key={u?.id || i} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">
                      <span className="flex items-center gap-1.5">
                        {u.nome}
                        {isAniversariante && (
                          <span title="Aniversariante do mês">
                            <Cake size={14} className="text-pink-500" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2.5 capitalize">{u.perfil || '-'}</td>
                    <td className="px-4 py-2.5">
                      {u.isConsultora || u.is_consultora ? 'Sim' : 'Não'}
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => toggleAtivo(u.id)} className="flex items-center gap-1 text-xs">
                        {u.ativo !== false && u.ativo !== 0 ? (
                          <><ToggleRight size={18} className="text-green-600" /> Ativo</>
                        ) : (
                          <><ToggleLeft size={18} className="text-muted-foreground" /> Inativo</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setModal(u)} className="text-xs text-primary hover:underline">
                          Editar
                        </button>
                        {isAniversariante && u.telefone && (
                          <a
                            href={`https://wa.me/55${u.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagemAniversario)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Enviar parabéns via WhatsApp"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <UsuarioModal
          usuario={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSalvo={fetchUsuarios}
        />
      )}
    </div>
  )
}

// ─── UsuarioModal ─────────────────────────────────────────────────────────────

function UsuarioModal({ usuario, onClose, onSalvo }) {
  const isEdit = !!usuario?.id

  const [form, setForm] = useState({
    nome:           usuario?.nome || '',
    email:          usuario?.email || '',
    telefone:       usuario?.telefone || '',
    dataNascimento: usuario?.dataNascimento || usuario?.data_nascimento || '',
    perfil:         usuario?.perfil || 'cliente',
    senha:          '',
    isConsultora:   Boolean(usuario?.isConsultora || usuario?.is_consultora || false),
    ativo:          usuario?.ativo == null ? true : Boolean(usuario?.ativo),
  })

  const [loading, setLoading] = useState(false)

  function somenteNumeros(valor) { return String(valor || '').replace(/\D/g, '') }
  function validarEmail(email)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()) }
  function validarTelefone(tel)  { const n = somenteNumeros(tel); return n.length === 10 || n.length === 11 }
  function validarDataNascimento(data) {
    if (!data) return true
    const d = new Date(`${data}T00:00:00`)
    return !Number.isNaN(d.getTime()) && d <= new Date()
  }

  function validarFormulario() {
    const nome  = String(form.nome  || '').trim()
    const email = String(form.email || '').trim()
    const tel   = String(form.telefone || '').trim()
    const senha = String(form.senha || '').trim()
    const perfil = String(form.perfil || '').trim().toLowerCase()

    if (!nome || nome.length < 3)    { toast.error('Nome deve ter pelo menos 3 caracteres.'); return false }
    if (nome.length > 120)           { toast.error('Nome muito longo.'); return false }
    if (!email)                      { toast.error('Informe o e-mail.'); return false }
    if (!validarEmail(email))        { toast.error('E-mail inválido.'); return false }
    if (tel && !validarTelefone(tel)){ toast.error('Telefone inválido (inclua DDD).'); return false }
    if (form.dataNascimento && !validarDataNascimento(form.dataNascimento)) { toast.error('Data de nascimento inválida.'); return false }
    if (!perfil || !['cliente','gerente'].includes(perfil)) { toast.error('Perfil inválido.'); return false }
    if (!isEdit && !senha)           { toast.error('Informe a senha.'); return false }
    if (senha && senha.length < 3)   { toast.error('Senha muito curta.'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validarFormulario()) return
    setLoading(true)
    try {
      const payload = {
        nome:           String(form.nome  || '').trim(),
        email:          String(form.email || '').trim().toLowerCase(),
        telefone:       String(form.telefone || '').trim() || null,
        dataNascimento: form.dataNascimento || null,
        perfil:         String(form.perfil || '').trim().toLowerCase(),
        isConsultora:   !!form.isConsultora,
        ativo:          !!form.ativo,
      }
      const senha = String(form.senha || '').trim()
      if (senha) payload.senha = senha

      if (isEdit) {
        await apiClient.put(`/users/${usuario.id}`, payload)
        toast.success('Usuário atualizado!')
      } else {
        await apiClient.post('/users', { ...payload, senha })
        toast.success('Usuário cadastrado!')
      }
      onSalvo()
      onClose()
    } catch (error) {
      console.error(error)
      const msg = error?.response?.data?.msg || error?.response?.data?.message || error?.message || ''
      if (msg.toLowerCase().includes('email') && (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplic') || msg.toLowerCase().includes('já existe'))) {
        toast.error('Já existe um usuário com esse e-mail.')
      } else {
        toast.error(msg || 'Erro ao salvar usuário.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {[
            { key: 'nome',           label: 'Nome',             type: 'text',     extra: { maxLength: 120 } },
            { key: 'email',          label: 'E-mail',           type: 'email',    extra: { maxLength: 180 } },
            { key: 'telefone',       label: 'Telefone',         type: 'text',     extra: { maxLength: 20, placeholder: '(18) 99999-9999' } },
            { key: 'dataNascimento', label: 'Data de nascimento', type: 'date',   extra: { max: new Date().toISOString().split('T')[0] } },
          ].map(({ key, label, type, extra }) => (
            <div key={key}>
              <label className="block text-sm font-medium font-body mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                {...extra}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium font-body mb-1">Perfil</label>
            <select
              value={form.perfil}
              onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="cliente">Cliente</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">{isEdit ? 'Nova senha (opcional)' : 'Senha'}</label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
              required={!isEdit}
              minLength={3}
              maxLength={255}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          {[
            { key: 'isConsultora', label: 'É consultora' },
            { key: 'ativo',        label: 'Usuário ativo' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} className="accent-primary" />
              <span className="text-sm font-body">{label}</span>
            </label>
          ))}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ServicosTab ──────────────────────────────────────────────────────────────

function ServicosTab() {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)

  async function fetchServicos() {
    setLoading(true)
    try {
      const data = await apiClient.get('/servicos')
      setServicos(Array.isArray(data) ? data : data?.servicos || [])
    } catch (error) {
      console.error(error)
      setServicos([])
      toast.error('Erro ao carregar serviços.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAtivo(id) {
    try {
      await apiClient.patch(`/servicos/${id}/toggle-ativo`)
      toast.success('Status atualizado!')
      fetchServicos()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar status.')
    }
  }

  useEffect(() => { fetchServicos() }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground font-body">{servicos.length} serviço(s)</p>
        <button onClick={() => setModal({})} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90">
          <Plus size={14} /> Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : servicos.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">Nenhum serviço.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground uppercase text-left">
                {['Nome','Descrição','Preço','Duração','Consultora','Ativo','Ações'].map((h) => (
                  <th key={h} className="px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, i) => (
                <tr key={s?.id || i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{s.nome}</td>
                  <td className="px-4 py-2.5">{s.descricao || '-'}</td>
                  <td className="px-4 py-2.5">R$ {Number(s.preco || 0).toFixed(2)}</td>
                  <td className="px-4 py-2.5">{s.duracaoMin ? `${s.duracaoMin} min` : '-'}</td>
                  <td className="px-4 py-2.5">{s.exclusivoParaConsultora == 1 || s.exclusivoParaConsultora === true ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleAtivo(s.id)} className="flex items-center gap-1 text-xs">
                      {s.ativo !== false && s.ativo !== 0
                        ? <><ToggleRight size={18} className="text-green-600" /> Ativo</>
                        : <><ToggleLeft size={18} className="text-muted-foreground" /> Inativo</>}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setModal(s)} className="text-xs text-primary hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ServicoModal servico={modal?.id ? modal : null} onClose={() => setModal(null)} onSalvo={fetchServicos} />
      )}
    </div>
  )
}

// ─── ServicoModal ─────────────────────────────────────────────────────────────

function ServicoModal({ servico, onClose, onSalvo }) {
  const isEdit = !!servico?.id

  const [form, setForm] = useState({
    nome:                   servico?.nome || '',
    preco:                  servico?.preco || '',
    descricao:              servico?.descricao || '',
    duracaoMin:             servico?.duracaoMin || '',
    exclusivoParaConsultora: servico?.exclusivoParaConsultora == 1 || servico?.exclusivoParaConsultora === true,
    ativo:                  servico?.ativo == null ? true : servico?.ativo == 1 || servico?.ativo === true,
  })

  const [loading, setLoading] = useState(false)

  function validarFormulario() {
    const nome     = String(form.nome || '').trim()
    const descricao = String(form.descricao || '').trim()
    const preco    = Number(form.preco)
    const duracao  = Number(form.duracaoMin)

    if (!nome || nome.length < 3)  { toast.error('Nome deve ter pelo menos 3 caracteres.'); return false }
    if (nome.length > 120)         { toast.error('Nome muito longo.'); return false }
    if (descricao.length > 500)    { toast.error('Descrição muito longa.'); return false }
    if (form.preco === '')         { toast.error('Informe o preço.'); return false }
    if (isNaN(preco) || preco <= 0){ toast.error('Preço deve ser maior que zero.'); return false }
    if (preco > 999999.99)         { toast.error('Preço muito alto.'); return false }
    if (form.duracaoMin === '')    { toast.error('Informe a duração.'); return false }
    if (isNaN(duracao) || !Number.isInteger(duracao)) { toast.error('Duração inválida.'); return false }
    if (duracao < 15)              { toast.error('Duração mínima: 15 minutos.'); return false }
    if (duracao > 1440)            { toast.error('Duração inválida.'); return false }
    if (duracao % 5 !== 0)         { toast.error('Duração deve ser múltipla de 5.'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validarFormulario()) return
    setLoading(true)
    try {
      const payload = {
        nome:                   form.nome.trim(),
        descricao:              form.descricao.trim(),
        preco:                  Number(form.preco),
        duracaoMin:             Number(form.duracaoMin),
        ativo:                  form.ativo ? 1 : 0,
        exclusivoParaConsultora: form.exclusivoParaConsultora ? 1 : 0,
      }
      if (isEdit) {
        await apiClient.put(`/servicos/${servico.id}`, payload)
        toast.success('Serviço atualizado!')
      } else {
        await apiClient.post('/servicos', payload)
        toast.success('Serviço cadastrado!')
      }
      onSalvo()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar serviço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold">{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium font-body mb-1">Nome</label>
            <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required maxLength={120} className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
          <div>
            <label className="block text-sm font-medium font-body mb-1">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} rows={2} maxLength={500} className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
          <div>
            <label className="block text-sm font-medium font-body mb-1">Preço</label>
            <input type="number" step="0.01" min="0.01" value={form.preco} onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))} required className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
          <div>
            <label className="block text-sm font-medium font-body mb-1">Duração (min)</label>
            <input type="number" min="15" step="5" value={form.duracaoMin} onChange={(e) => setForm((p) => ({ ...p, duracaoMin: e.target.value }))} required className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>

          {[
            { key: 'exclusivoParaConsultora', label: 'Exclusivo para consultoras' },
            { key: 'ativo',                   label: 'Serviço ativo' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} className="accent-primary" />
              <span className="text-sm font-body">{label}</span>
            </label>
          ))}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── SlotsTab ─────────────────────────────────────────────────────────────────

function SlotsTab() {
  const [excecoes, setExcecoes]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [data, setData]                 = useState('')
  const [horarioInicio, setHorarioInicio] = useState('')
  const [horarioFim, setHorarioFim]     = useState('')
  const [saving, setSaving]             = useState(false)
  const [recorrente, setRecorrente]     = useState(false)
  const [diasSemana, setDiasSemana]     = useState([])

  function normalizar(ex) {
    return {
      id:                ex.id,
      data:              ex.data,
      horaInicioExcecao: ex.horaInicioExcecao ?? ex.hora_inicio_excecao,
      horaFimExcecao:    ex.horaFimExcecao    ?? ex.hora_fim_excecao,
      recorrente:        ex.recorrente,
      diasSemana:        ex.diasSemana        ?? ex.dias_semana,
      ativo:             ex.ativo,
    }
  }

  async function fetchExcecoes() {
    setLoading(true)
    try {
      const d = await apiClient.get('/agenda/excecoes')
      const lista = Array.isArray(d) ? d : d?.excecoes || []
      setExcecoes(lista.map(normalizar))
    } catch (error) {
      console.error(error)
      setExcecoes([])
      toast.error('Erro ao carregar exceções.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExcecoes() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!recorrente && !data)              { toast.error('Informe a data.'); return }
    if (recorrente && diasSemana.length === 0) { toast.error('Selecione ao menos um dia.'); return }

    const hojeString = new Date().toISOString().slice(0, 10)
    if (!recorrente && data < hojeString)  { toast.error('Data não pode ser passada.'); return }
    if (!horarioInicio || !horarioFim)     { toast.error('Informe início e fim.'); return }

    const toMin = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m }
    if (toMin(horarioFim) <= toMin(horarioInicio)) { toast.error('Fim deve ser maior que início.'); return }

    setSaving(true)
    try {
      await apiClient.post('/agenda/excecoes', {
        data:              recorrente ? null : data,
        horaInicioExcecao: horarioInicio + ':00',
        horaFimExcecao:    horarioFim    + ':00',
        recorrente,
        diasSemana:        recorrente ? diasSemana : null,
      })
      toast.success('Exceção adicionada!')
      setData(''); setHorarioInicio(''); setHorarioFim(''); setRecorrente(false); setDiasSemana([])
      fetchExcecoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar exceção.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ex) {
    if (!ex?.id) { toast.error('Não foi possível identificar a exceção.'); return }
    try {
      await apiClient.delete(`/agenda/excecoes/${ex.id}`)
      toast.success('Exceção removida!')
      fetchExcecoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover exceção.')
    }
  }

  async function handleToggle(id) {
    try {
      await apiClient.patch(`/agenda/excecoes/${id}/toggle`)
      fetchExcecoes()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div>
      <p className="text-sm text-muted-foreground font-body mb-4">
        Defina exceções de horário para dias específicos.
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end mb-6 p-4 bg-muted/40 rounded-xl border border-border">
        {!recorrente && (
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
        )}

        {[
          { label: 'Início', val: horarioInicio, set: setHorarioInicio },
          { label: 'Fim',    val: horarioFim,    set: setHorarioFim    },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="block text-xs text-muted-foreground font-body mb-1">{label}</label>
            <input type="time" value={val} onChange={(e) => set(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body" />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${recorrente ? 'bg-primary border-primary' : 'bg-background border-input group-hover:border-primary/60'}`}>
              {recorrente && (
                <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} className="sr-only" />
            </div>
            <span className="text-xs font-body text-muted-foreground group-hover:text-foreground transition-colors">Repetir por dias da semana</span>
          </label>

          {recorrente && (
            <div className="flex gap-2 flex-wrap mt-1">
              {diasMap.map((label, i) => {
                const ativo = diasSemana.includes(i)
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setDiasSemana(ativo ? diasSemana.filter((d) => d !== i) : [...diasSemana, i])}
                    className={`px-3 py-1.5 text-xs font-body rounded-lg border transition-colors ${ativo ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 transition-opacity">
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      {loading ? (
        <p className="text-center py-8 text-sm text-muted-foreground font-body">Carregando...</p>
      ) : excecoes.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-body text-sm">Nenhuma exceção cadastrada.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {excecoes.map((ex) => {
            const isRecorrente  = Number(ex.recorrente) === 1
            const dataFormatada = ex?.data ? ex.data.slice(0, 10).split('-').reverse().join('/') : ''
            const inicio        = ex?.horaInicioExcecao?.slice(0, 5)
            const fim           = ex?.horaFimExcecao?.slice(0, 5)
            const diasFormatados = ex?.diasSemana ? String(ex.diasSemana).split(',').map((d) => diasMap[Number(d)]).join(', ') : '-'
            const ativo         = ex.ativo !== 0 && ex.ativo !== '0' && ex.ativo !== false

            return (
              <div key={ex.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm font-body">{isRecorrente ? diasFormatados : dataFormatada}</span>
                  {(inicio || fim) && (
                    <span className="text-xs text-muted-foreground font-body bg-muted px-2 py-0.5 rounded-full">{inicio} → {fim}</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  {isRecorrente && (
                    <button type="button" onClick={() => handleToggle(ex.id)} className="flex items-center gap-1 text-xs font-body">
                      {ativo
                        ? <><ToggleRight size={18} className="text-green-600" /> Ativo</>
                        : <><ToggleLeft size={18} className="text-muted-foreground" /> Inativo</>}
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(ex)} className="text-xs font-body text-destructive hover:bg-destructive/10 px-3 py-1 rounded-full border border-transparent hover:border-destructive/20 transition-colors">
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── ProdutosTabSimples ───────────────────────────────────────────────────────

function ProdutosTabSimples() {
  const [produtos, setProdutos]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [modal, setModal]                 = useState(null)
  const [relatorioConfig, setRelatorioConfig] = useState(null)

  async function fetchProdutos() {
    setLoading(true)
    try {
      const data = await apiClient.get('/produtos')
      setProdutos(Array.isArray(data) ? data : data?.produtos || [])
    } catch (error) {
      console.error(error)
      setProdutos([])
      toast.error('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProdutos() }, [])

  async function handleSave(form) {
    const payload = {
      nome:          form.nome,
      precoVenda:    Number(form.preco),
      estoqueAtual:  Number(form.estoqueAtual || 0),
      estoqueMinimo: Number(form.estoqueMinimo || 0),
    }
    try {
      if (form.id) {
        await apiClient.put(`/produtos/${form.id}`, payload)
        toast.success('Produto atualizado!')
      } else {
        await apiClient.post('/produtos', payload)
        toast.success('Produto cadastrado!')
      }
      fetchProdutos()
      setModal(null)
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.msg || error?.response?.data?.message || 'Erro ao salvar produto.')
    }
  }

  function handleRelatorio() {
    const registros = produtos.map((p) => {
      const estAtual = p?.estoqueAtual ?? p?.estoque_atual ?? 0
      const estMin   = p?.estoqueMinimo ?? p?.estoque_minimo ?? 0
      const baixo    = estAtual <= estMin
      return {
        dataRef:   null,
        descricao: p.nome,
        tipo:      'PRODUTO',
        formaPagto: baixo ? 'dinheiro' : 'pix',
        valor:     Number(p.precoVenda ?? p.preco_venda ?? p.preco ?? p.valor ?? 0),
        status:    baixo ? 'baixo' : 'ok',
      }
    })

    setRelatorioConfig({
      registros,
      titulo:      'Relatório de Produtos',
      eyebrow:     'Cadastros · Produtos',
      accentColor: '#1D9E75',
      tipo:        'TODOS',
      statusFiltro: null,
      nomeArquivo: 'produtos.csv',
    })
  }

  return (
    <div>
      <RelatorioModal config={relatorioConfig} onClose={() => setRelatorioConfig(null)} />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground font-body">{produtos.length} produto(s)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRelatorio}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
          >
            <FileText size={14} />
            Relatório
          </button>
          <button
            onClick={() => setModal({})}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90"
          >
            <Plus size={14} /> Novo produto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : produtos.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">Nenhum produto.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground uppercase text-left">
                {['Nome','Preço','Estoque','Ações'].map((h) => (
                  <th key={h} className="px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, i) => {
                const estAtual = p?.estoqueAtual ?? p?.estoque_atual ?? 0
                const estMin   = p?.estoqueMinimo ?? p?.estoque_minimo ?? 0
                const baixo    = estAtual <= estMin

                return (
                  <tr key={p?.id || i} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                    <td className="px-4 py-2.5">R$ {Number(p.precoVenda ?? p.preco_venda ?? p.preco ?? p.valor ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${baixo ? 'bg-pink-100 text-pink-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {estAtual}
                        {baixo && <span className="font-normal opacity-70">· baixo</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setModal(p)} className="text-xs text-primary hover:underline">Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProdutoSimpleModal
          produto={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSalvo={(form) => handleSave({ ...(modal?.id ? { id: modal.id } : {}), ...form })}
        />
      )}
    </div>
  )
}

// ─── ProdutoSimpleModal ───────────────────────────────────────────────────────

function ProdutoSimpleModal({ produto, onClose, onSalvo }) {
  const isEdit = !!produto?.id

  const [form, setForm] = useState({
    nome:          produto?.nome || '',
    preco:         produto?.precoVenda ?? produto?.preco_venda ?? produto?.preco ?? produto?.valor ?? '',
    estoqueAtual:  produto?.estoqueAtual ?? produto?.estoque_atual ?? '',
    estoqueMinimo: produto?.estoqueMinimo ?? produto?.estoque_minimo ?? '',
  })

  const [loading, setLoading] = useState(false)

  function validarFormulario() {
    const nome         = form.nome.trim()
    const preco        = Number(form.preco)
    const estoqueAtual = Number(form.estoqueAtual)
    const estoqueMinimo = form.estoqueMinimo === '' ? null : Number(form.estoqueMinimo)

    if (!nome || nome.length < 2)            { toast.error('Nome deve ter pelo menos 2 caracteres.'); return false }
    if (nome.length > 120)                   { toast.error('Nome muito longo.'); return false }
    if (form.preco === '')                   { toast.error('Informe o preço.'); return false }
    if (isNaN(preco) || preco <= 0)          { toast.error('Preço deve ser maior que zero.'); return false }
    if (preco > 999999)                      { toast.error('Preço muito alto.'); return false }
    if (form.estoqueAtual === '')            { toast.error('Informe o estoque atual.'); return false }
    if (isNaN(estoqueAtual) || estoqueAtual < 0) { toast.error('Estoque atual inválido.'); return false }
    if (estoqueMinimo !== null && (isNaN(estoqueMinimo) || estoqueMinimo < 0)) { toast.error('Estoque mínimo inválido.'); return false }
    if (estoqueMinimo !== null && estoqueMinimo > estoqueAtual) { toast.error('Estoque mínimo não pode ser maior que o atual.'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validarFormulario()) return
    setLoading(true)
    try {
      await onSalvo({
        nome:          form.nome.trim(),
        preco:         Number(form.preco),
        estoqueAtual:  Number(form.estoqueAtual),
        estoqueMinimo: form.estoqueMinimo === '' ? null : Number(form.estoqueMinimo),
      })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar produto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold">{isEdit ? 'Editar' : 'Novo'} Produto</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {[
            ['nome',          'Nome',            'text',   {}],
            ['preco',         'Preço',            'number', { step: '0.01', min: '0.01' }],
            ['estoqueAtual',  'Estoque atual',    'number', { step: '1', min: '0' }],
            ['estoqueMinimo', 'Estoque mínimo',   'number', { step: '1', min: '0' }],
          ].map(([k, l, t, extra]) => (
            <div key={k}>
              <label className="block text-sm font-medium font-body mb-1">{l}</label>
              <input
                type={t}
                value={form[k]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                required={k !== 'estoqueMinimo'}
                className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
                {...extra}
              />
            </div>
          ))}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CadastrosPage() {
  const { isGerente } = useUser()
  const [aba, setAba] = useState('usuarios')

  const tabContent = {
    usuarios: <UsuariosTab />,
    servicos: <ServicosTab />,
    produtos: <ProdutosTabSimples />,
    slots:    <SlotsTab />,
  }

  if (!isGerente) {
    return (
      <div className="text-center py-16 text-muted-foreground font-body">
        Você não tem permissão para acessar esta página.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold text-foreground">Cadastros</h1>
        <p className="text-muted-foreground font-body mt-1 text-sm">
          Gerencie usuários, serviços, produtos e configurações de agenda
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body border-b-2 transition-colors whitespace-nowrap ${
              aba === a.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <a.icon size={15} />
            {a.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        {tabContent[aba]}
      </div>
    </div>
  )
}