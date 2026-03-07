'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import apiClient from '@/utils/apiClient'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Inicializa autenticação a partir do localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('sala_rosa_token')
    const storedUser = localStorage.getItem('sala_rosa_user')
    if (storedToken) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, senha) => {
    try {
      // POST /autenticacao/token
      const data = await apiClient.post('/autenticacao/token', { email, senha })

      const accessToken = data.token || data.access_token || data.accessToken
      if (!accessToken) throw new Error('Token não recebido da API.')

      localStorage.setItem('sala_rosa_token', accessToken)
      setToken(accessToken)

      // Tenta buscar usuário autenticado
      let userData = data.usuario || data.user || data.usuario || null
      if (!userData) {
        try {
          userData = await apiClient.get('/autenticacao/usuario')
        } catch {
          // endpoint pode não existir ainda
        }
      }

      if (userData) {
        localStorage.setItem('sala_rosa_user', JSON.stringify(userData))
        setUser(userData)
      }

      toast.success('Login realizado com sucesso!')
      router.push('/logado/dashboard')
    } catch (error) {
      toast.error(error.message || 'Email ou senha incorretos.')
      throw error
    }
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('sala_rosa_token')
    localStorage.removeItem('sala_rosa_user')
    setToken(null)
    setUser(null)
    router.push('/login')
    toast.success('Você saiu da sua conta.')
  }, [router])

  const isAuthenticated = !!token
  const isGerente = user?.perfil === 'gerente' || user?.role === 'gerente'
  const isConsultora = user?.isConsultora === true

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isGerente,
        isConsultora,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider')
  return ctx
}
