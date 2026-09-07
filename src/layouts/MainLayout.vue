<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StickyTopBanner from '@/components/StickyTopBanner.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const nav = computed(() => {
  const items = [
    { to: '/dashboard', label: '总览看板', icon: '◈' },
    { to: '/archives', label: '档案管理', icon: '▤' },
    { to: '/migration', label: '迁移模拟', icon: '⇄' },
    { to: '/reports', label: '报表中心', icon: '▦' },
    { to: '/announcement', label: '招标摘要', icon: '◎' },
  ]
  if (auth.canAdmin()) {
    items.push({ to: '/config', label: '系统配置', icon: '⚙' })
  }
  return items
})

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen pt-10">
    <StickyTopBanner />
    <div class="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1440px]">
      <aside class="hidden w-60 shrink-0 border-r border-teal/15 bg-slate-deep text-mint md:flex md:flex-col">
        <div class="border-b border-white/10 px-5 py-6">
          <p class="text-xs tracking-[0.2em] text-teal-bright uppercase">Longjiang Bank</p>
          <h1 class="mt-1 text-lg font-semibold leading-snug text-white">
            电子档案改造
          </h1>
          <p class="mt-2 text-xs text-mint/70">HTCL-ZB-261267 · Demo</p>
        </div>
        <nav class="flex flex-1 flex-col gap-1 p-3">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
            :class="
              route.path === item.to
                ? 'bg-teal text-white shadow-lg shadow-black/20'
                : 'text-mint/80 hover:bg-white/5 hover:text-white'
            "
          >
            <span class="w-4 text-center opacity-80">{{ item.icon }}</span>
            {{ item.label }}
          </router-link>
        </nav>
        <div class="border-t border-white/10 p-4 text-xs text-mint/60">
          <p>角色：{{ auth.role }}</p>
          <p class="mt-1 truncate">{{ auth.user?.username }}</p>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between gap-4 border-b border-teal/10 bg-white/70 px-4 py-3 backdrop-blur md:px-6">
          <div class="min-w-0">
            <p class="truncate text-sm text-ink/50">新一代核心配套 · 档案适应性改造演示</p>
            <h2 class="truncate text-base font-semibold text-ink md:text-lg">
              {{ nav.find((n) => n.to === route.path)?.label ?? '控制台' }}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <div class="hidden items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs text-teal sm:flex">
              <span class="h-2 w-2 rounded-full bg-teal-bright" />
              sql.js · 本地 SQLite
            </div>
            <button
              class="rounded-lg border border-teal/20 bg-white px-3 py-1.5 text-sm text-ink transition hover:border-teal hover:text-teal"
              type="button"
              @click="logout"
            >
              退出
            </button>
          </div>
        </header>

        <!-- Mobile nav -->
        <div class="flex gap-1 overflow-x-auto border-b border-teal/10 bg-white/60 px-2 py-2 md:hidden">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="shrink-0 rounded-full px-3 py-1.5 text-xs"
            :class="
              route.path === item.to
                ? 'bg-teal text-white'
                : 'bg-sand text-ink/70'
            "
          >
            {{ item.label }}
          </router-link>
        </div>

        <main class="flex-1 p-4 md:p-6">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>
