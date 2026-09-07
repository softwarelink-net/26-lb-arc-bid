<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArchiveStore } from '@/stores/archive'
import { useAuthStore } from '@/stores/auth'

const store = useArchiveStore()
const auth = useAuthStore()
const running = ref(false)
const steps = ref<string[]>([])

const pendingCount = computed(() => store.stats.pending)

const pipeline = [
  { title: '存量抽取', desc: '从遗留库拉取非结构化文件与元数据索引' },
  { title: '格式统一', desc: '编码清洗、TIFF/PDF 标准化、损坏件隔离' },
  { title: '哈希校验', desc: '分块 Checksum 比对，确保数量与内容一致' },
  { title: '接口落库', desc: '6 个批量接口 + 8 个文件接口联调写入' },
]

async function runBatch() {
  if (!auth.canWrite()) return
  running.value = true
  steps.value = []
  const msgs = [
    '锁定迁移批次（≤3 条待处理）…',
    '执行格式统一与编码清洗…',
    '计算分片哈希并比对源端摘要…',
    '写入目标库并更新迁移日志…',
  ]
  for (const m of msgs) {
    steps.value.push(m)
    await new Promise((r) => setTimeout(r, 450))
  }
  await store.simulateMigrationBatch()
  steps.value.push('批次完成。可在日志区查看明细。')
  running.value = false
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-teal/10 bg-gradient-to-br from-slate-deep to-[#0b3d4a] p-6 text-mint shadow-lg">
      <p class="text-xs tracking-[0.2em] text-teal-bright uppercase">Data Migration Simulator</p>
      <h3 class="mt-2 text-xl font-semibold text-white">异构存量迁移模拟器</h3>
      <p class="mt-2 max-w-2xl text-sm text-mint/75">
        演示「不得变更行内现有技术架构」约束下的迁移链路：抽取 → 格式统一 → 哈希校验 → 接口落库。
        当前待迁移 {{ pendingCount }} 条。
      </p>
      <button
        type="button"
        class="mt-5 rounded-lg bg-teal-bright px-4 py-2 text-sm font-medium text-slate-deep disabled:opacity-50"
        :disabled="running || !auth.canWrite() || pendingCount === 0"
        @click="runBatch"
      >
        {{ running ? '迁移执行中…' : auth.canWrite() ? '执行一批迁移' : '只读角色无法执行' }}
      </button>
      <ul v-if="steps.length" class="mt-4 space-y-1 text-sm text-mint/80">
        <li v-for="(s, i) in steps" :key="i">{{ `${i + 1}. ${s}` }}</li>
      </ul>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="(p, i) in pipeline"
        :key="p.title"
        class="rounded-2xl border border-teal/10 bg-white/80 p-5"
      >
        <p class="text-xs text-teal">STEP {{ i + 1 }}</p>
        <h4 class="mt-1 font-semibold text-ink">{{ p.title }}</h4>
        <p class="mt-2 text-sm text-ink/55">{{ p.desc }}</p>
      </div>
    </section>

    <section class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
      <h3 class="text-sm font-semibold text-ink">校验与迁移日志</h3>
      <div class="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
        <div
          v-for="log in store.logs"
          :key="log.id"
          class="rounded-xl border border-teal/10 bg-sand/30 px-4 py-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="rounded-full bg-teal/10 px-2 py-0.5 text-xs text-teal">{{ log.action }}</span>
            <span class="text-xs text-ink/40">档案 #{{ log.archive_id }} · {{ log.timestamp }}</span>
          </div>
          <p class="mt-2 text-sm text-ink/80">{{ log.details }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
