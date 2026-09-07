import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  findUserByUsername,
  type UserRole,
  type UserRow,
  verifyPassword,
} from '@/utils/db'

const SESSION_KEY = 'lb_arc_session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Pick<UserRow, 'id' | 'username' | 'role'> | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? 'viewer')

  function restore() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) user.value = JSON.parse(raw)
    } catch {
      user.value = null
    }
    ready.value = true
  }

  function persist() {
    if (user.value) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user.value))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  function login(username: string, password: string): { ok: boolean; message: string } {
    const row = findUserByUsername(username.trim())
    if (!row || !verifyPassword(password, row.password_hash)) {
      return { ok: false, message: '用户名或密码错误' }
    }
    user.value = { id: row.id, username: row.username, role: row.role as UserRole }
    persist()
    return { ok: true, message: '登录成功' }
  }

  function logout() {
    user.value = null
    persist()
  }

  function canWrite(): boolean {
    return role.value === 'admin' || role.value === 'archivist'
  }

  function canAdmin(): boolean {
    return role.value === 'admin'
  }

  return {
    user,
    ready,
    isAuthenticated,
    role,
    restore,
    login,
    logout,
    canWrite,
    canAdmin,
  }
})
