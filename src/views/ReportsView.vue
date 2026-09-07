<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useArchiveStore } from '@/stores/archive'
import { useAuthStore } from '@/stores/auth'

const store = useArchiveStore()
const auth = useAuthStore()

const summary = computed(() => {
  const list = store.reports
  const done = list.filter((r) => r.status === 'done').length
  const fields = list.reduce((s, r) => s + r.field_count, 0)
  return { total: list.length, done, fields, target: 66 }
})

const statusLabel: Record<string, string> = {
  done: '已完成',
  in_progress: '进行中',
  pending: '未开始',
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5">
        <p class="text-sm text-ink/50">报表改造目标</p>
        <p class="mt-2 text-3xl font-semibold">{{ summary.target }} <span class="text-base text-ink/40">字段/口径</span></p>
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5">
        <p class="text-sm text-ink/50">演示报表条目</p>
        <p class="mt-2 text-3xl font-semibold">{{ summary.done }} / {{ summary.total }}</p>
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5">
        <p class="text-sm text-ink/50">覆盖字段数</p>
        <p class="mt-2 text-3xl font-semibold text-teal">{{ summary.fields }}</p>
      </div>
    </section>

    <section class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
      <h3 class="text-sm font-semibold text-ink">报表逻辑优化状态</h3>
      <p class="mt-1 text-sm text-ink/50">
        建立版本化口径，保障新核心上线后历史报表可追溯、可对比。
      </p>
      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-mint/60 text-ink/70">
            <tr>
              <th class="px-3 py-2 font-medium">名称</th>
              <th class="px-3 py-2 font-medium">模块</th>
              <th class="px-3 py-2 font-medium">字段</th>
              <th class="px-3 py-2 font-medium">状态</th>
              <th class="px-3 py-2 font-medium">优化</th>
              <th class="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in store.reports"
              :key="r.id"
              class="border-t border-teal/10"
            >
              <td class="px-3 py-3 font-medium">{{ r.name }}</td>
              <td class="px-3 py-3">{{ r.module }}</td>
              <td class="px-3 py-3">{{ r.field_count }}</td>
              <td class="px-3 py-3">{{ statusLabel[r.status] ?? r.status }}</td>
              <td class="px-3 py-3">{{ r.optimized ? '是' : '否' }}</td>
              <td class="px-3 py-3">
                <button
                  v-if="auth.canWrite() && r.status !== 'done'"
                  type="button"
                  class="text-xs text-teal hover:underline"
                  @click="store.markReportDone(r.id)"
                >
                  标记完成
                </button>
                <span v-else class="text-xs text-ink/35">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
