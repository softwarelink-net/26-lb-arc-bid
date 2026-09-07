<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArchiveStore } from '@/stores/archive'
import { useAuthStore } from '@/stores/auth'

const store = useArchiveStore()
const auth = useAuthStore()

const title = ref('')
const category = ref('渠道档案')
const sizeMb = ref(120)
const filter = ref('all')
const showForm = ref(false)
const chunkTarget = ref<number | null>(null)
const chunkProgress = ref(0)
const chunkBusy = ref(false)

const filtered = computed(() => {
  if (filter.value === 'all') return store.archives
  return store.archives.filter((a) => a.status === filter.value)
})

function formatBytes(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  return `${(n / 1e3).toFixed(0)} KB`
}

const statusClass: Record<string, string> = {
  pending: 'bg-amber/15 text-amber',
  migrated: 'bg-teal/10 text-teal',
  verified: 'bg-teal-bright/15 text-teal-bright',
}

async function submitCreate() {
  if (!title.value.trim()) return
  await store.createArchive({
    title: title.value.trim(),
    category: category.value,
    size_bytes: Math.round(sizeMb.value * 1024 * 1024),
  })
  title.value = ''
  showForm.value = false
}

async function runChunk(id: number) {
  chunkTarget.value = id
  chunkBusy.value = true
  chunkProgress.value = 0
  for (let i = 1; i <= 8; i++) {
    await new Promise((r) => setTimeout(r, 180))
    chunkProgress.value = Math.round((i / 8) * 100)
  }
  await store.simulateChunkUpload(id)
  chunkBusy.value = false
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in [
            { id: 'all', label: '全部' },
            { id: 'pending', label: '待迁移' },
            { id: 'migrated', label: '已迁移' },
            { id: 'verified', label: '已校验' },
          ]"
          :key="f.id"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm"
          :class="filter === f.id ? 'bg-teal text-white' : 'bg-white text-ink/70 border border-teal/10'"
          @click="filter = f.id"
        >
          {{ f.label }}
        </button>
      </div>
      <button
        v-if="auth.canWrite()"
        type="button"
        class="rounded-lg bg-teal px-4 py-2 text-sm text-white hover:bg-teal-bright"
        @click="showForm = !showForm"
      >
        {{ showForm ? '收起' : '新建档案' }}
      </button>
    </div>

    <form
      v-if="showForm && auth.canWrite()"
      class="grid gap-3 rounded-2xl border border-teal/10 bg-white/80 p-5 sm:grid-cols-4"
      @submit.prevent="submitCreate"
    >
      <input
        v-model="title"
        class="rounded-lg border border-teal/20 bg-sand/30 px-3 py-2 text-sm sm:col-span-2"
        placeholder="档案标题"
        required
      />
      <select v-model="category" class="rounded-lg border border-teal/20 bg-sand/30 px-3 py-2 text-sm">
        <option>对公业务</option>
        <option>零售信贷</option>
        <option>会计核算</option>
        <option>反洗钱</option>
        <option>渠道档案</option>
        <option>授信管理</option>
        <option>担保管理</option>
        <option>核心交易</option>
      </select>
      <div class="flex gap-2">
        <input
          v-model.number="sizeMb"
          type="number"
          min="1"
          class="w-full rounded-lg border border-teal/20 bg-sand/30 px-3 py-2 text-sm"
          placeholder="MB"
        />
        <button type="submit" class="shrink-0 rounded-lg bg-slate-deep px-4 text-sm text-white">保存</button>
      </div>
    </form>

    <div
      v-if="chunkBusy"
      class="rounded-2xl border border-teal/20 bg-mint/60 p-4"
    >
      <p class="text-sm text-ink">分片上传模拟 · 档案 #{{ chunkTarget }}</p>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div class="h-full bg-teal-bright transition-all" :style="{ width: `${chunkProgress}%` }" />
      </div>
      <p class="mt-1 text-xs text-ink/50">{{ chunkProgress }}% · 断点续传 / 合并校验中</p>
    </div>

    <div class="overflow-hidden rounded-2xl border border-teal/10 bg-white/80 shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-deep text-mint">
            <tr>
              <th class="px-4 py-3 font-medium">ID</th>
              <th class="px-4 py-3 font-medium">标题</th>
              <th class="px-4 py-3 font-medium">分类</th>
              <th class="px-4 py-3 font-medium">大小</th>
              <th class="px-4 py-3 font-medium">状态</th>
              <th class="px-4 py-3 font-medium">Checksum</th>
              <th class="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtered"
              :key="row.id"
              class="border-t border-teal/10 hover:bg-mint/30"
            >
              <td class="px-4 py-3 text-ink/50">{{ row.id }}</td>
              <td class="px-4 py-3 font-medium text-ink">{{ row.title }}</td>
              <td class="px-4 py-3">{{ row.category }}</td>
              <td class="px-4 py-3">{{ formatBytes(row.size_bytes) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs" :class="statusClass[row.status]">
                  {{ row.status }}
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-ink/50">{{ row.checksum }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <button
                    v-if="auth.canWrite() && row.status === 'pending'"
                    type="button"
                    class="rounded px-2 py-1 text-xs text-teal hover:bg-mint"
                    :disabled="chunkBusy"
                    @click="runChunk(row.id)"
                  >
                    分片上传
                  </button>
                  <button
                    v-if="auth.canWrite() && row.status === 'migrated'"
                    type="button"
                    class="rounded px-2 py-1 text-xs text-teal hover:bg-mint"
                    @click="store.updateArchiveStatus(row.id, 'verified')"
                  >
                    校验
                  </button>
                  <button
                    v-if="auth.canAdmin()"
                    type="button"
                    class="rounded px-2 py-1 text-xs text-danger hover:bg-danger/10"
                    @click="store.deleteArchive(row.id)"
                  >
                    删除
                  </button>
                  <span v-if="!auth.canWrite()" class="text-xs text-ink/40">只读</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
