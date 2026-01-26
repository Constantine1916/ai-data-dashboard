'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { UserPublic } from '@/types/database'

interface AuthContextType {
  user: UserPublic | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token 存储键名
const TOKEN_KEY = 'auth-token'

/**
 * 获取存储的 Token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 设置 Token
 */
function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 清除 Token
 */
function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 认证 Provider 组件
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 获取当前用户信息
  const fetchUser = async () => {
    // Cookie 是 HttpOnly 的，前端无法直接读取
    // 所以直接调用 API，API 会从 Cookie 中读取 token
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // 重要：包含 cookie
      })

      const data = await response.json()

      if (data.success && data.data) {
        setUser(data.data)
        // 如果响应中有 token（向后兼容），也保存到 localStorage
        if (data.data.token) {
          setToken(data.data.token)
        }

        // 检查响应头，看 token 是否已自动刷新
        const tokenRefreshed = response.headers.get('X-Token-Refreshed')
        if (tokenRefreshed === 'true') {
          console.log('Token 已自动刷新')
        }
      } else {
        // Token 无效或已过期，清除本地存储
        removeToken()
        setUser(null)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 手动刷新 Token（可选，用于主动刷新）
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // 重要：包含 cookie
      })

      const data = await response.json()

      if (data.success && data.data) {
        setUser(data.data.user)
        // 如果响应中有 token（向后兼容），也保存到 localStorage
        if (data.data.token) {
          setToken(data.data.token)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('刷新 Token 失败:', error)
      return false
    }
  }

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUser()
  }, [])

  // 登录
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 重要：包含 cookie
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || '登录失败')
    }

    // Token 已自动存储到 Cookie（HttpOnly）
    // 如果响应中有 token（向后兼容），也保存到 localStorage
    if (data.data.token) {
      setToken(data.data.token)
    }
    setUser(data.data.user)

    // 跳转到首页或仪表板
    router.push('/dashboard')
  }

  // 注册
  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 重要：包含 cookie
      body: JSON.stringify({ email, password, name }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || '注册失败')
    }

    // Token 已自动存储到 Cookie（HttpOnly）
    // 如果响应中有 token（向后兼容），也保存到 localStorage
    if (data.data.token) {
      setToken(data.data.token)
    }
    setUser(data.data.user)

    // 跳转到首页或仪表板
    router.push('/dashboard')
  }

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // 重要：包含 cookie
      })
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 无论请求是否成功，都清除本地状态
      removeToken()
      setUser(null)
      router.push('/login')
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证 Hook
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return context
}

/**
 * 获取认证 Token（用于 API 请求）
 */
export function getAuthToken(): string | null {
  return getToken()
}
