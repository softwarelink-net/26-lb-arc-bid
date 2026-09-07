<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initDatabase } from '@/utils/db'
import { applySeoFromConfig } from '@/utils/seo'

const bootError = ref('')
const booting = ref(true)
const auth = useAuthStore()

onMounted(async () => {
  try {
    await applySeoFromConfig()
    await initDatabase()
    auth.restore()
  } catch (e) {
    bootError.value = e instanceof Error ? e.message : '初始化失败'
  } finally {
    booting.value = false
  }
})
</script>

<template>
  <div v-if="booting" class="flex min-h-screen items-center justify-center pt-10 text-sm text-ink/60">
    正在加载 sql.js 与本地档案库…
  </div>
  <div
    v-else-if="bootError"
    class="flex min-h-screen items-center justify-center px-4 pt-10 text-center text-danger"
  >
    {{ bootError }}
  </div>
  <router-view v-else />
</template>
