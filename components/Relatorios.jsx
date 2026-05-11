'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

// ─── Contexto ─────────────────────────────────────────────────────────────────

const RelatorioCtx = createContext(null)

// ─── Provider — coloque UMA VEZ no app/logado/layout.jsx ─────────────────────

export function RelatorioProvider({ children }) {
  const [config, setConfig] = useState(null)

  const abrirRelatorio = useCallback((opcoes = {}) => setConfig(opcoes), [])
  const fecharRelatorio = useCallback(() => setConfig(null), [])

  return (
    <RelatorioCtx.Provider value={{ abrirRelatorio, fecharRelatorio }}>
      {children}

      {config && (
        <div
          style={st.overlay}
          onClick={(e) => e.target === e.currentTarget && fecharRelatorio()}
        >
          <div style={st.modal}>
            <button style={st.btnFechar} onClick={fecharRelatorio} aria-label="Fechar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
            <div style={st.scrollArea}>
              <RelatorioFinanceiro {...config} />
            </div>
          </div>
        </div>
      )}
    </RelatorioCtx.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRelatorio() {
  const ctx = useContext(RelatorioCtx)
  if (!ctx) throw new Error('useRelatorio precisa estar dentro de <RelatorioProvider>')
  return ctx
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

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
    r.Status === 'pago' ? 'Pago' : r.Status,
  ].join(sep))

  const total = rows.reduce((acc, r) => acc + Number(r.Valor || 0), 0)
  const rodape = [
    '',
    '"Total"',
    '',
    '',
    Number(total).toFixed(2).replace('.', ','),
    '',
  ].join(sep)

  const separador = Array(header.length).fill('---').join(sep)

  const conteudo = [
    header.join(sep),
    separador,
    ...linhas,
    separador,
    rodape,
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
const FORMA_LABEL = { cartao: 'Cartão', dinheiro: 'Dinheiro', pix: 'Pix' }
const FORMA_CORES = {
  cartao:   { bg: '#fce7f0', cor: '#993556' },
  dinheiro: { bg: '#E1F5EE', cor: '#0F6E56' },
  pix:      { bg: '#E6F1FB', cor: '#185FA5' },
  _default: { bg: '#F1EFE8', cor: '#5F5E5A' },
}
const getCores = (f) => FORMA_CORES[f] || FORMA_CORES._default


function RelatorioUsuarios({ registros }) {
  const total = registros.length
  const consultoras = registros.filter(r => r.tipo === 'consultora').length
  const clientes = registros.filter(r => r.tipo === 'cliente').length
  const ativos = registros.filter(r => r.status === 'ativo').length

  return (
    <div>
      <h1>Relatório de Usuários</h1>

      <div>
        <p>Total: {total}</p>
        <p>Consultoras: {consultoras}</p>
        <p>Clientes: {clientes}</p>
        <p>Ativos: {ativos}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Tipo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((u, i) => (
            <tr key={i}>
              <td>{u.descricao}</td>
              <td>{u.email}</td>
              <td>{u.perfil}</td>
              <td>{u.tipo}</td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Componente do relatório ──────────────────────────────────────────────────

function RelatorioFinanceiro({
  registros     = [],
  titulo        = 'Relatório de Recebimentos',
  subtitulo,
  eyebrow       = 'Financeiro',
  tipo          = 'RECEITA',
  statusFiltro  = 'pago',
  nomeArquivo   = 'relatorio_financeiro.csv',
  accentColor   = '#d4537e',
}) {
  const [exportado, setExportado] = useState(false)

  const itens = useMemo(() => registros.filter((r) => {
    const statusOk = statusFiltro ? r?.status === statusFiltro : true
    const tipoOk   = tipo === 'TODOS' ? true : !r?.tipo || r?.tipo === tipo
    return statusOk && tipoOk
  }), [registros, statusFiltro, tipo])

  const total      = useMemo(() => itens.reduce((acc, r) => acc + Number(r?.valor || 0), 0), [itens])
  const ticketMed  = itens.length > 0 ? total / itens.length : 0

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

      {/* Cabeçalho */}
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

      {/* Métricas */}
      <div style={r.metricsGrid}>
        <MetCard label="Total"        value={fmtMoeda(total)}      cor={accentColor} icon={<IcoMoney cor={accentColor} />} />
        <MetCard label="Registros"    value={itens.length}                            icon={<IcoCheck2 />} />
        <MetCard label="Ticket médio" value={fmtMoeda(ticketMed)}                    icon={<IcoChart />} />
      </div>

      {/* Por forma */}
      {Object.keys(porForma).length > 0 && (
        <div style={r.section}>
          <p style={r.secLabel}>Por forma de pagamento</p>
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

      {/* Tabela */}
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
                      <td style={r.td}><span style={r.statusBadge}>{item?.status}</span></td>
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

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetCard({ label, value, cor, icon }) {
  return (
    <div style={r.metricCard}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={r.metricLabel}>{label}</div>
      <div style={{ ...r.metricValue, color: cor || '#1a1a1a' }}>{value}</div>
    </div>
  )
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

const IcoDl    = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8m0 0L5 7m3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" /></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 4" /></svg>
const IcoMoney = ({ cor }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor || '#d4537e'} strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5-1.3 2.5-3 2.5-3 1.1-3 2.5S10.3 17 12 17s3-1.1 3-2.5" /></svg>
const IcoCheck2 = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>
const IcoChart  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.6" strokeLinecap="round"><path d="M4 20V10M9 20V4M14 20v-7M19 20v-4" /></svg>

// ─── Estilos do modal ─────────────────────────────────────────────────────────

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

// ─── Estilos do relatório ─────────────────────────────────────────────────────

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
  statusBadge:{ fontSize: 11, fontWeight: 500, background: '#E1F5EE', color: '#0F6E56', padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-block' },
  tfootLabel: { fontWeight: 600, color: '#bbb', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 14, borderTop: '1.5px solid #f0ece8' },
  tfootTotal: { fontWeight: 700, fontSize: 15, paddingTop: 14, borderTop: '1.5px solid #f0ece8' },
  vazio:      { textAlign: 'center', padding: '3rem', color: '#ccc', fontSize: 14 },
  rodape:     { marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #f0ece8', fontSize: 11, color: '#ddd', textAlign: 'center', letterSpacing: '0.04em' },
}