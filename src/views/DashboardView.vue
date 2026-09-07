<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { EChartsType } from 'echarts/core'
import { useArchiveStore } from '@/stores/archive'

const store = useArchiveStore()
const statusRef = ref<HTMLDivElement | null>(null)
const sizeRef = ref<HTMLDivElement | null>(null)
let statusChart: EChartsType | null = null
let sizeChart: EChartsType | null = null
let echartsMod: typeof import('echarts') | null = null

const progress = computed(() => {
  const { total, migrated, verified } = store.stats
  if (!total) return 0
  return Math.round(((migrated + verified) / total) * 100)
})

function formatBytes(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} TB`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  return `${n} B`
}

async function ensureEcharts() {
  if (!echartsMod) echartsMod = await import('echarts')
  return echartsMod
}

async function renderCharts() {
  const echarts = await ensureEcharts()

  if (statusRef.value) {
    statusChart ??= echarts.init(statusRef.value)
    statusChart.setOption({
      color: ['#c9872a', '#1a6b63', '#2a9d8f'],
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['48%', '72%'],
          label: { color: '#0b1f24' },
          data: [
            { name: '待迁移', value: store.stats.pending },
            { name: '已迁移', value: store.stats.migrated },
            { name: '已校验', value: store.stats.verified },
          ],
        },
      ],
    })
  }

  if (sizeRef.value) {
    sizeChart ??= echarts.init(sizeRef.value)
    const cats = [...new Set(store.archives.map((a) => a.category))]
    sizeChart.setOption({
      grid: { left: 48, right: 16, top: 24, bottom: 32 },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { color: '#0b1f24', interval: 0, rotate: cats.length > 4 ? 20 : 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#0b1f24',
          formatter: (v: number) => `${(v / 1e9).toFixed(1)}G`,
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: 28,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2a9d8f' },
              { offset: 1, color: '#0b3d4a' },
            ]),
          },
          data: cats.map((c) =>
            store.archives
              .filter((a) => a.category === c)
              .reduce((s, a) => s + a.size_bytes, 0),
          ),
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0]
          return `${p.name}<br/>${formatBytes(p.value)}`
        },
      },
    })
  }
}

function onResize() {
  statusChart?.resize()
  sizeChart?.resize()
}

onMounted(async () => {
  store.refresh()
  await renderCharts()
  window.addEventListener('resize', onResize)
})

watch(
  () => store.stats,
  () => {
    void renderCharts()
  },
  { deep: true },
)

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  statusChart?.dispose()
  sizeChart?.dispose()
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <p class="text-sm text-ink/50">档案总量</p>
        <p class="mt-2 text-3xl font-semibold text-ink">{{ store.stats.total }}</p>
        <p class="mt-1 text-xs text-ink/40">含存量历史包</p>
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <p class="text-sm text-ink/50">迁移进度</p>
        <p class="mt-2 text-3xl font-semibold text-teal">{{ progress }}%</p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-mint">
          <div class="h-full rounded-full bg-teal-bright transition-all" :style="{ width: `${progress}%` }" />
        </div>
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <p class="text-sm text-ink/50">数据体量</p>
        <p class="mt-2 text-3xl font-semibold text-ink">{{ formatBytes(store.stats.bytes) }}</p>
        <p class="mt-1 text-xs text-ink/40">模拟存量规模</p>
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <p class="text-sm text-ink/50">已校验 / 待处理</p>
        <p class="mt-2 text-3xl font-semibold text-ink">
          {{ store.stats.verified }}
          <span class="text-lg text-ink/30">/</span>
          {{ store.stats.pending }}
        </p>
        <p class="mt-1 text-xs text-ink/40">Checksum 完整性</p>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <h3 class="text-sm font-semibold text-ink">状态分布</h3>
        <div ref="statusRef" class="mt-2 h-64" />
      </div>
      <div class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
        <h3 class="text-sm font-semibold text-ink">分类体量</h3>
        <div ref="sizeRef" class="mt-2 h-64" />
      </div>
    </section>

    <section class="rounded-2xl border border-teal/10 bg-white/80 p-5 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-ink">最近迁移日志</h3>
        <router-link class="text-sm text-teal hover:underline" to="/migration">查看全部</router-link>
      </div>
      <ul class="mt-4 divide-y divide-teal/10">
        <li
          v-for="log in store.logs.slice(0, 6)"
          :key="log.id"
          class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm font-medium text-ink">{{ log.action }}</p>
            <p class="text-xs text-ink/50">{{ log.details }}</p>
          </div>
          <p class="shrink-0 text-xs text-ink/40">#{{ log.archive_id }} · {{ log.timestamp }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>
