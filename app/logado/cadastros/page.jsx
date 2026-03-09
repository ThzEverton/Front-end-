'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'

const ABAS = [
  { key: 'usuarios', label: 'Usuários', icon: Users },
  { key: 'servicos', label: 'Serviços', icon: Scissors },
  { key: 'produtos', label: 'Produtos', icon: Package },
  { key: 'slots', label: 'Slots / Exceções', icon: Calendar },
]

// ─── Usuários ────────────────────────────────────────────────────────────────

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

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

  useEffect(() => {
    fetchUsuarios()
  }, [])

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground font-body">
          {usuarios.length} usuário(s)
        </p>

        <button
          onClick={() => setModal({})}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90"
        >
          <Plus size={14} /> Novo usuário
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : usuarios.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">
          Nenhum usuário.
        </p>
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
              {usuarios.map((u, i) => (
                <tr key={u?.id || i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5 capitalize">{u.perfil || '-'}</td>
                  <td className="px-4 py-2.5">
                    {u.isConsultora || u.is_consultora ? 'Sim' : 'Não'}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleAtivo(u.id)}
                      className="flex items-center gap-1 text-xs"
                    >
                      {u.ativo !== false && u.ativo !== 0 ? (
                        <>
                          <ToggleRight size={18} className="text-green-600" /> Ativo
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={18} className="text-muted-foreground" /> Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setModal(u)}
                      className="text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
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

function UsuarioModal({ usuario, onClose, onSalvo }) {
  const isEdit = !!usuario?.id

  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: usuario?.telefone || '',
    dataNascimento: usuario?.dataNascimento || usuario?.data_nascimento || '',
    perfil: usuario?.perfil || 'cliente',
    senha: '',
    isConsultora: Boolean(usuario?.isConsultora || usuario?.is_consultora || false),
    ativo: usuario?.ativo == null ? true : Boolean(usuario?.ativo),
  })

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || null,
        dataNascimento: form.dataNascimento || null,
        perfil: form.perfil,
        isConsultora: form.isConsultora,
        ativo: form.ativo,
      }

      if (form.senha) {
        payload.senha = form.senha
      }

      if (isEdit) {
        await apiClient.put(`/users/${usuario.id}`, payload)
        toast.success('Usuário atualizado!')
      } else {
        await apiClient.post('/users', {
          ...payload,
          senha: form.senha,
        })
        toast.success('Usuário cadastrado!')
      }

      onSalvo()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar usuário.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-lg font-bold">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium font-body mb-1">Nome</label>
            <input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Data de nascimento</label>
            <input
              type="date"
              value={form.dataNascimento}
              onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Perfil</label>
            <select
              value={form.perfil}
              onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value }))}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            >
              <option value="cliente">Cliente</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">
              {isEdit ? 'Nova senha (opcional)' : 'Senha'}
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
              required={!isEdit}
              minLength={3}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConsultora}
              onChange={(e) => setForm((p) => ({ ...p, isConsultora: e.target.checked }))}
              className="accent-primary"
            />
            <span className="text-sm font-body">É consultora</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
              className="accent-primary"
            />
            <span className="text-sm font-body">Usuário ativo</span>
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Serviços ────────────────────────────────────────────────────────────────

function ServicosTab() {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

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

  useEffect(() => {
    fetchServicos()
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground font-body">
          {servicos.length} serviço(s)
        </p>

        <button
          onClick={() => setModal({})}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90"
        >
          <Plus size={14} /> Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : servicos.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">
          Nenhum serviço.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground uppercase text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Preço</th>
                <th className="px-4 py-2">Duração</th>
                <th className="px-4 py-2">Consultora</th>
                <th className="px-4 py-2">Ativo</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>

            <tbody>
              {servicos.map((s, i) => (
                <tr key={s?.id || i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{s.nome}</td>
                  <td className="px-4 py-2.5">{s.descricao || '-'}</td>
                  <td className="px-4 py-2.5">
                    R$ {Number(s.preco || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.duracaoMin ? `${s.duracaoMin} min` : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.exclusivoParaConsultora == 1 || s.exclusivoParaConsultora === true ? 'Sim' : 'Não'}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.ativo == 1 || s.ativo === true ? 'Sim' : 'Não'}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setModal(s)}
                      className="text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ServicoModal
          servico={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSalvo={fetchServicos}
        />
      )}
    </div>
  )
}

function ServicoModal({ servico, onClose, onSalvo }) {
  const isEdit = !!servico?.id

  const [form, setForm] = useState({
    nome: servico?.nome || '',
    preco: servico?.preco || '',
    descricao: servico?.descricao || '',
    duracaoMin: servico?.duracaoMin || '',
    exclusivoParaConsultora:
      servico?.exclusivoParaConsultora == 1 || servico?.exclusivoParaConsultora === true,
    ativo: servico?.ativo == null ? true : servico?.ativo == 1 || servico?.ativo === true,
  })

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco),
        duracaoMin: Number(form.duracaoMin),
        ativo: form.ativo ? 1 : 0,
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
          <h3 className="font-sans text-lg font-bold">
            {isEdit ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium font-body mb-1">Nome</label>
            <input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              rows={2}
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Preço</label>
            <input
              type="number"
              step="0.01"
              value={form.preco}
              onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-body mb-1">Duração (min)</label>
            <input
              type="number"
              value={form.duracaoMin}
              onChange={(e) => setForm((p) => ({ ...p, duracaoMin: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.exclusivoParaConsultora}
              onChange={(e) =>
                setForm((p) => ({ ...p, exclusivoParaConsultora: e.target.checked }))
              }
              className="accent-primary"
            />
            <span className="text-sm font-body">Exclusivo para consultoras</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
              className="accent-primary"
            />
            <span className="text-sm font-body">Serviço ativo</span>
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Slots / Exceções ────────────────────────────────────────────────────────

function SlotsTab() {
  const [excecoes, setExcecoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState('')
  const [horarioInicio, setHorarioInicio] = useState('')
  const [horarioFim, setHorarioFim] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchExcecoes() {
    setLoading(true)
    try {
      const d = await apiClient.get('/agenda/excecoes')
      setExcecoes(Array.isArray(d) ? d : d?.excecoes || [])
    } catch (error) {
      console.error(error)
      setExcecoes([])
      toast.error('Erro ao carregar exceções.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExcecoes()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()

    if (!data) {
      toast.error('Informe a data.')
      return
    }

    setSaving(true)
    try {
      await apiClient.post('/agenda/excecoes', {
        data,
        horaInicioExcecao: horarioInicio ? horarioInicio + ':00' : null,
        horaFimExcecao: horarioFim ? horarioFim + ':00' : null,
      })

      toast.success('Exceção adicionada!')
      setData('')
      setHorarioInicio('')
      setHorarioFim('')
      fetchExcecoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar exceção.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(dataExcecao) {
    try {
      await apiClient.delete(`/agenda/excecoes/${dataExcecao}`)
      toast.success('Exceção removida!')
      fetchExcecoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover exceção.')
    }
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground font-body mb-4">
        Defina exceções de horário para dias específicos.
      </p>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-3 items-end mb-6 p-4 bg-muted/40 rounded-xl border border-border"
      >
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>

        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Início</label>
          <input
            type="time"
            value={horarioInicio}
            onChange={(e) => setHorarioInicio(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>

        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1">Fim</label>
          <input
            type="time"
            value={horarioFim}
            onChange={(e) => setHorarioFim(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          <Plus size={14} /> Adicionar
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : excecoes.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground font-body">
          Nenhuma exceção cadastrada.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {excecoes.map((ex, i) => {
            const dataFormatada = ex?.data
              ? new Date(ex.data).toLocaleDateString('pt-BR')
              : ''

            const inicio = ex?.horaInicioExcecao?.slice(0, 5)
            const fim = ex?.horaFimExcecao?.slice(0, 5)

            return (
              <div
                key={ex?.data || i}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
              >
                <div>
                  <span className="font-medium font-body text-sm">
                    {dataFormatada}
                  </span>

                  {(inicio || fim) && (
                    <span className="text-xs text-muted-foreground ml-3 font-body">
                      {inicio} → {fim}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(ex?.data)}
                  className="text-xs text-destructive hover:underline font-body"
                >
                  Remover
                </button>
              </div>
            )
          })}
        </div>
      )}
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
    slots: <SlotsTab />,
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

// ─── Produtos  ──

function ProdutosTabSimples() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  async function fetch() {
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

  useEffect(() => {
    fetch()
  }, [])

  async function handleSave(form) {
    const payload = {
      nome: form.nome,
      precoVenda: Number(form.preco),
      estoqueAtual: Number(form.estoqueAtual || 0),
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

      fetch()
      setModal(null)
    } catch (error) {
      console.error('ERRO AO SALVAR PRODUTO:', error)
      console.error('RESPOSTA BACK:', error?.response?.data)
      toast.error(
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        'Erro ao salvar produto.'
      )
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground font-body">{produtos.length} produto(s)</p>
        <button
          onClick={() => setModal({})}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-body hover:opacity-90"
        >
          <Plus size={14} /> Novo produto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : produtos.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-body">Nenhum produto.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground uppercase text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Preço</th>
                <th className="px-4 py-2">Estoque</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((p, i) => (
                <tr key={p?.id || i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                  <td className="px-4 py-2.5">
                    R$ {Number(p.precoVenda ?? p.preco_venda ?? p.preco ?? p.valor ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    {p?.estoqueAtual ?? p?.estoque_atual ?? 0}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setModal(p)}
                      className="text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProdutoSimpleModal
          produto={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSalvo={(form) =>
            handleSave({ ...(modal?.id ? { id: modal.id } : {}), ...form })
          }
        />
      )}
    </div>
  )
}

function ProdutoSimpleModal({ produto, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    preco: produto?.precoVenda ?? produto?.preco_venda ?? produto?.preco ?? produto?.valor ?? '',
    estoqueAtual: produto?.estoqueAtual ?? produto?.estoque_atual ?? '',
    estoqueMinimo: produto?.estoqueMinimo ?? produto?.estoque_minimo ?? '',
  })

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSalvo(form)
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
          <h3 className="font-sans text-lg font-bold">
            {produto ? 'Editar' : 'Novo'} Produto
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {[
            ['nome', 'Nome'],
            ['preco', 'Preço'],
            ['estoqueAtual', 'Estoque atual'],
            ['estoqueMinimo', 'Estoque mínimo'],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="block text-sm font-medium font-body mb-1">{l}</label>
              <input
                value={form[k]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                required={k !== 'estoqueMinimo'}
                type={k !== 'nome' ? 'number' : 'text'}
                step={k === 'preco' ? '0.01' : '1'}
                className="w-full border border-input rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
            </div>
          ))}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-body hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}