<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('admin123')
const error = ref('')
const loading = ref(false)

const accounts = [
  { role: 'Admin', user: 'admin', pass: 'admin123' },
  { role: 'Archivist', user: 'archivist', pass: 'archivist123' },
  { role: 'Auditor', user: 'auditor', pass: 'auditor123' },
]

function fill(user: string, pass: string) {
  username.value = user
  password.value = pass
  error.value = ''
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const result = auth.login(username.value, password.value)
    if (!result.ok) {
      error.value = result.message
      return
    }
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  auth.restore()
})
</script>

<template>
  <div class="relative z-10 w-full max-w-md">
    <div class="overflow-hidden rounded-2xl border border-teal/15 bg-white/90 shadow-2xl shadow-slate-deep/15 backdrop-blur">
      <div class="bg-slate-deep px-8 py-7 text-mint">
        <p class="text-xs tracking-[0.25em] text-teal-bright uppercase">Archive Transformation</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">电子档案改造演示台</h1>
        <p class="mt-2 text-sm text-mint/70">龙江银行 · 人力外包采购演示环境</p>
      </div>

      <form class="space-y-4 px-8 py-7" @submit.prevent="onSubmit">
        <label class="block">
          <span class="mb-1.5 block text-sm text-ink/60">用户名</span>
          <input
            v-model="username"
            class="w-full rounded-lg border border-teal/20 bg-sand/40 px-3 py-2.5 outline-none ring-teal-bright focus:ring-2"
            autocomplete="username"
            required
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm text-ink/60">密码</span>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-lg border border-teal/20 bg-sand/40 px-3 py-2.5 outline-none ring-teal-bright focus:ring-2"
            autocomplete="current-password"
            required
          />
        </label>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <button
          type="submit"
          class="w-full rounded-lg bg-teal py-2.5 text-sm font-medium text-white transition hover:bg-teal-bright disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? '登录中…' : '进入控制台' }}
        </button>
      </form>

      <div class="border-t border-teal/10 bg-mint/40 px-8 py-5">
        <p class="mb-3 text-xs font-medium tracking-wide text-ink/50 uppercase">演示账号</p>
        <div class="grid gap-2">
          <button
            v-for="a in accounts"
            :key="a.user"
            type="button"
            class="flex items-center justify-between rounded-lg border border-teal/10 bg-white px-3 py-2 text-left text-sm transition hover:border-teal"
            @click="fill(a.user, a.pass)"
          >
            <span class="font-medium text-ink">{{ a.role }}</span>
            <span class="text-ink/50">{{ a.user }} / {{ a.pass }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
