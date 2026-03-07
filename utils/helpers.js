/**
 * Utilitários gerais do projeto Sala Rosa
 */

/** Formata valor para BRL */
export function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

/** Formata data ISO para pt-BR */
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

/** Formata data e hora */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR')
}

/** Retorna data no formato YYYY-MM-DD */
export function toISODate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

/** Data de hoje em YYYY-MM-DD */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/** Formata hora de um datetime */
export function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Status de pagamento em português */
export function statusPagamentoLabel(status) {
  const map = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
  }
  return map[status] || status
}

/** Status de agendamento em português */
export function statusAgendamentoLabel(status) {
  const map = {
    AGENDADO: 'Agendado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    REMARCADO: 'Remarcado',
  }
  return map[status] || status
}

/** Verifica se ainda é possível cancelar/remarcar (até 23:59 de D-2) */
export function podeCancelarRemarcar(dataHoraAgendamento) {
  if (!dataHoraAgendamento) return false
  const agendamento = new Date(dataHoraAgendamento)
  const limite = new Date(agendamento)
  limite.setDate(limite.getDate() - 2)
  limite.setHours(23, 59, 59, 999)
  return new Date() <= limite
}

/** Exporta array de objetos como CSV */
export function exportCSV(data, filename = 'exportacao.csv') {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
