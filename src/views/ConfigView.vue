<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useArchiveStore } from '@/stores/archive'

const store = useArchiveStore()
const drafts = ref<Record<string, string>>({})
const saved = ref('')

onMounted(() => {
  store.refresh()
  drafts.value = Object.fromEntries(store.configs.map((c) => [c.key, c.value]))
})

async function save(key: string) {
  await store.updateConfig(key, drafts.value[key] ?? '')
  saved.value = key
  setTimeout(() => {
    if (saved.value === key) saved.value = ''
  }, 1500)
}
</script>

<template>
  <div class="space-y-5">
    <section class="rounded-2xl border border-teal/10 bg-white/80 p-5">
      <h3 class="text-sm font-semibold text-ink">系统配置 / Feature Flags</h3>
      <p class="mt-1 text-sm text-ink/50">仅 Admin 可访问。配置写入浏览器 SQLite（IndexedDB 持久化）。</p>

      <div class="mt-5 space-y-4">
        <div
          v-for="cfg in store.configs"
          :key="cfg.key"
          class="grid gap-3 rounded-xl border border-teal/10 bg-sand/20 p-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <p class="font-mono text-sm text-teal">{{ cfg.key }}</p>
            <p class="mt-1 text-xs text-ink/50">{{ cfg.description }}</p>
          </div>
          <input
            v-model="drafts[cfg.key]"
            class="rounded-lg border border-teal/20 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            class="rounded-lg bg-slate-deep px-4 py-2 text-sm text-white hover:bg-teal"
            @click="save(cfg.key)"
          >
            {{ saved === cfg.key ? '已保存' : '保存' }}
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-teal/10 bg-white/80 p-5 text-sm text-ink/70">
      <h3 class="font-semibold text-ink">RBAC 矩阵</h3>
      <ul class="mt-3 list-disc space-y-1 pl-5">
        <li><strong>Admin</strong>：用户与配置、全量日志、部署相关操作</li>
        <li><strong>Archivist</strong>：档案读写、上传模拟、报表标记</li>
        <li><strong>Auditor</strong>：只读审计与完整性报告</li>
        <li><strong>Viewer</strong>：公告与基础看板</li>
      </ul>
    </section>
  </div>
</template>
