import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  archiveStats,
  listArchives,
  listConfigs,
  listMigrationLogs,
  listReports,
  persistDatabase,
  queryValue,
  runSql,
  type ArchiveRow,
  type MigrationLogRow,
  type SystemConfigRow,
} from '@/utils/db'

function checksumFor(title: string): string {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return `sha256:${h.toString(16).padStart(8, '0')}`
}

export const useArchiveStore = defineStore('archive', () => {
  const archives = ref<ArchiveRow[]>([])
  const logs = ref<MigrationLogRow[]>([])
  const configs = ref<SystemConfigRow[]>([])
  const reports = ref<ReturnType<typeof listReports>>([])
  const stats = ref(archiveStats())
  const loading = ref(false)

  function refresh() {
    loading.value = true
    try {
      archives.value = listArchives()
      logs.value = listMigrationLogs()
      configs.value = listConfigs()
      reports.value = listReports()
      stats.value = archiveStats()
    } finally {
      loading.value = false
    }
  }

  async function createArchive(payload: {
    title: string
    category: string
    size_bytes: number
  }) {
    const path = `/demo/upload/${Date.now()}-${payload.title.replace(/\s+/g, '_')}`
    runSql(
      `INSERT INTO lb_arc_archives (title, category, file_path, size_bytes, status, checksum, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      [payload.title, payload.category, path, payload.size_bytes, 'sha256:pending'],
    )
    const id = queryValue<number>('SELECT last_insert_rowid()')
    runSql(
      `INSERT INTO lb_arc_migration_logs (archive_id, action, details) VALUES (?, 'created', ?)`,
      [id, `新建档案条目：${payload.title}`],
    )
    await persistDatabase()
    refresh()
  }

  async function updateArchiveStatus(id: number, status: ArchiveRow['status']) {
    const cs = status === 'pending' ? 'sha256:pending' : checksumFor(`archive-${id}-${status}`)
    runSql(
      `UPDATE lb_arc_archives SET status = ?, checksum = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, cs, id],
    )
    runSql(
      `INSERT INTO lb_arc_migration_logs (archive_id, action, details) VALUES (?, ?, ?)`,
      [id, `status_${status}`, `状态更新为 ${status}，校验值 ${cs}`],
    )
    await persistDatabase()
    refresh()
  }

  async function deleteArchive(id: number) {
    runSql(`DELETE FROM lb_arc_migration_logs WHERE archive_id = ?`, [id])
    runSql(`DELETE FROM lb_arc_archives WHERE id = ?`, [id])
    await persistDatabase()
    refresh()
  }

  async function simulateMigrationBatch() {
    const pending = archives.value.filter((a) => a.status === 'pending')
    for (const item of pending.slice(0, 3)) {
      runSql(
        `UPDATE lb_arc_archives SET status = 'migrated', checksum = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [checksumFor(item.title), item.id],
      )
      runSql(
        `INSERT INTO lb_arc_migration_logs (archive_id, action, details) VALUES (?, 'migrate_batch', ?)`,
        [item.id, `批量迁移完成：格式统一 + 元数据映射`],
      )
    }
    await persistDatabase()
    refresh()
  }

  async function simulateChunkUpload(archiveId: number) {
    const chunks = 8
    for (let i = 1; i <= chunks; i++) {
      runSql(
        `INSERT INTO lb_arc_migration_logs (archive_id, action, details) VALUES (?, 'chunk_upload', ?)`,
        [archiveId, `分片 ${i}/${chunks} 上传成功`],
      )
    }
    runSql(
      `UPDATE lb_arc_archives SET status = 'migrated', checksum = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [checksumFor(`chunk-${archiveId}`), archiveId],
    )
    await persistDatabase()
    refresh()
  }

  async function updateConfig(key: string, value: string) {
    runSql(
      `UPDATE lb_arc_system_configs SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`,
      [value, key],
    )
    await persistDatabase()
    refresh()
  }

  async function markReportDone(id: number) {
    runSql(
      `UPDATE lb_arc_reports SET status = 'done', optimized = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id],
    )
    await persistDatabase()
    refresh()
  }

  return {
    archives,
    logs,
    configs,
    reports,
    stats,
    loading,
    refresh,
    createArchive,
    updateArchiveStatus,
    deleteArchive,
    simulateMigrationBatch,
    simulateChunkUpload,
    updateConfig,
    markReportDone,
  }
})
