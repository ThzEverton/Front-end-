/**
 * apiClient.js — Cliente centralizado para consumo da API real.
 * Base URL: NEXT_PUBLIC_API_URL (fallback: http://localhost:5000)
 *
 * Todos os métodos tratam erros, exibem toast e redirecionam para /login em caso de 401.
 */

import { toast } from 'sonner'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sala_rosa_token')
}

function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('sala_rosa_token')
  localStorage.removeItem('sala_rosa_user')
}

async function request(method, endpoint, body) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method,
    headers,
    credentials: 'include',
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options)

    if (response.status === 401) {
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    // Respostas sem conteúdo (204, 205)
    if (response.status === 204 || response.status === 205) {
      return { success: true }
    }

    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && (data?.message || data?.error)) ||
        `Erro ${response.status}`
      throw new Error(message)
    }

    return data
  } catch (error) {
    if (error.message !== 'Sessão expirada. Faça login novamente.') {
      toast.error(error.message || 'Erro ao conectar com o servidor')
    }
    throw error
  }
}

const apiClient = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  put: (endpoint, body) => request('PUT', endpoint, body),
  patch: (endpoint, body) => request('PATCH', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
}

export default apiClient
