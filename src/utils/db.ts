import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'

export type UserRole = 'admin' | 'archivist' | 'auditor' | 'viewer'

export interface UserRow {
  id: number
  username: string
  password_hash: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ArchiveRow {
  id: number
  title: string
  category: string
  file_path: string
  size_bytes: number
  status: 'pending' | 'migrated' | 'verified'
  checksum: string
  created_at: string
  updated_at: string
}

export interface MigrationLogRow {
  id: number
  archive_id: number
  action: string
  details: string
  timestamp: string
}

export interface SystemConfigRow {
  key: string
  value: string
  description: string
  updated_at: string
}

const DEMO_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  archivist: 'archivist123',
  auditor: 'auditor123',
}

/** Simple reversible demo hash — not for production */
export function hashPassword(plain: string): string {
  return btoa(`lb_arc:${plain}`)
}

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lb_arc_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lb_arc_system_configs (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lb_arc_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    file_path TEXT,
    size_bytes INTEGER,
    status TEXT DEFAULT 'pending',
    checksum TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lb_arc_migration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    archive_id INTEGER,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (archive_id) REFERENCES lb_arc_archives(id)
);

CREATE TABLE IF NOT EXISTS lb_arc_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    module TEXT,
    field_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    optimized INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`

function seedSql(): string {
  const users = Object.entries(DEMO_PASSWORDS)
    .map(([u, p]) => {
      const role = u === 'admin' ? 'admin' : u
      return `('${u}', '${hashPassword(p)}', '${role}')`
    })
    .join(',\n')

  return `
INSERT OR IGNORE INTO lb_arc_users (username, password_hash, role) VALUES
${users};

INSERT OR IGNORE INTO lb_arc_system_configs (key, value, description) VALUES
('feature_flag_chunk_upload', 'true', 'Enable chunked upload feature'),
('max_file_size_mb', '100', 'Maximum file size in MB'),
('migration_batch_size', '500', 'Archives per migration batch'),
('project_code', 'HTCL-ZB-261267', 'Bidding project number');

INSERT OR IGNORE INTO lb_arc_archives (id, title, category, file_path, size_bytes, status, checksum) VALUES
(1, '对公账户开户档案-2020批次', '对公业务', '/legacy/corp/2020/batch-01.zip', 524288000, 'verified', 'sha256:a1b2c3d4'),
(2, '个人信贷合同扫描件-Q3', '零售信贷', '/legacy/retail/loan-q3.tar', 2147483648, 'migrated', 'sha256:e5f6g7h8'),
(3, '会计凭证影像库-2018', '会计核算', '/legacy/acct/vouchers-2018/', 8589934592, 'pending', 'sha256:pending'),
(4, '客户身份识别材料合集', '反洗钱', '/legacy/aml/kyc-pack.7z', 1073741824, 'pending', 'sha256:pending'),
(5, '电子回单归档包-2024', '渠道档案', '/legacy/channel/receipts-2024/', 3221225472, 'migrated', 'sha256:i9j0k1l2'),
(6, '授信审批会议纪要', '授信管理', '/legacy/credit/minutes.pdf', 45789234, 'verified', 'sha256:m3n4o5p6'),
(7, '抵押物权证影像', '担保管理', '/legacy/collateral/deeds/', 1879048192, 'pending', 'sha256:pending'),
(8, '历史核心流水附件', '核心交易', '/legacy/core/flow-attach/', 12884901888, 'pending', 'sha256:pending');

INSERT OR IGNORE INTO lb_arc_migration_logs (archive_id, action, details) VALUES
(1, 'checksum_ok', '全量哈希校验通过，记录数 128,430'),
(1, 'format_normalize', 'TIFF→PDF/A 转换完成'),
(2, 'chunk_upload', '分片上传 2048/2048 完成'),
(5, 'migrate_done', '元数据映射完成，写入目标库'),
(6, 'checksum_ok', '单文件校验通过');

INSERT OR IGNORE INTO lb_arc_reports (id, name, module, field_count, status, optimized) VALUES
(1, '档案入库日报', '采集', 12, 'done', 1),
(2, '迁移校验汇总', '迁移', 18, 'done', 1),
(3, '分片上传成功率', '传输', 8, 'done', 1),
(4, '历史存量完整性', '校验', 15, 'in_progress', 0),
(5, '模块适配进度', '改造', 10, 'done', 1),
(6, '接口联调清单', '联调', 22, 'in_progress', 0),
(7, '压力测试吞吐', '测试', 9, 'pending', 0),
(8, '报表口径对比', '报表', 66, 'in_progress', 1);
`
}

let SQL: SqlJsStatic | null = null
let db: Database | null = null

const IDB_NAME = 'lb_arc_demo'
const IDB_STORE = 'sqlite'
const IDB_KEY = 'db'

async function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const idb = req.result
      if (!idb.objectStoreNames.contains(IDB_STORE)) {
        idb.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIdb()
    return await new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly')
      const store = tx.objectStore(IDB_STORE)
      const req = store.get(IDB_KEY)
      req.onsuccess = () => resolve((req.result as Uint8Array) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIdb()
  await new Promise<void>((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(data, IDB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function tryFetchRemoteDb(): Promise<Uint8Array | null> {
  const urls = [
    '/api/db',
    'https://26-lb-arc-bid.softwarelink.net/api/db',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) {
        const buf = await res.arrayBuffer()
        return new Uint8Array(buf)
      }
    } catch {
      // continue
    }
  }
  return null
}

export async function initDatabase(): Promise<Database> {
  if (db) return db

  // Prefer the classic sql-wasm build (loads /sql-wasm.wasm). Fallback keeps browser build working.
  const mod = await import('sql.js/dist/sql-wasm.js')
  const init = ((mod as { default?: typeof initSqlJs }).default ??
    (mod as unknown as typeof initSqlJs)) as typeof initSqlJs

  SQL = await init({
    locateFile: (file: string) => `/${file}`,
  })

  const local = await loadFromIndexedDB()
  const remote = local ? null : await tryFetchRemoteDb()
  const bytes = local ?? remote

  if (bytes) {
    db = new SQL.Database(bytes)
  } else {
    db = new SQL.Database()
    db.run(SCHEMA_SQL)
    db.run(seedSql())
    await persistDatabase()
  }

  // Ensure schema exists even if remote file is empty/old
  db.run(SCHEMA_SQL)
  const count = queryValue<number>('SELECT COUNT(*) as c FROM lb_arc_users')
  if (!count) {
    db.run(seedSql())
    await persistDatabase()
  }

  return db
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function persistDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  await saveToIndexedDB(data)

  try {
    await fetch('/api/save-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Blob([data.buffer as ArrayBuffer]),
    })
  } catch {
    // Worker endpoint may be unavailable in local/dev
  }
}

function rowsFromExec<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  stmt.bind(params as never[])
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return rows
}

export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  return rowsFromExec<T>(sql, params)
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | null {
  const rows = rowsFromExec<T>(sql, params)
  return rows[0] ?? null
}

export function queryValue<T>(sql: string, params: unknown[] = []): T | null {
  const row = queryOne<Record<string, T>>(sql, params)
  if (!row) return null
  return Object.values(row)[0] ?? null
}

export function runSql(sql: string, params: unknown[] = []): void {
  const database = getDatabase()
  database.run(sql, params as never[])
}

export function findUserByUsername(username: string): UserRow | null {
  return queryOne<UserRow>(
    'SELECT * FROM lb_arc_users WHERE username = ?',
    [username],
  )
}

export function listArchives(): ArchiveRow[] {
  return queryAll<ArchiveRow>(
    'SELECT * FROM lb_arc_archives ORDER BY id DESC',
  )
}

export function listMigrationLogs(limit = 50): MigrationLogRow[] {
  return queryAll<MigrationLogRow>(
    'SELECT * FROM lb_arc_migration_logs ORDER BY id DESC LIMIT ?',
    [limit],
  )
}

export function listConfigs(): SystemConfigRow[] {
  return queryAll<SystemConfigRow>('SELECT * FROM lb_arc_system_configs ORDER BY key')
}

export function listReports() {
  return queryAll<{
    id: number
    name: string
    module: string
    field_count: number
    status: string
    optimized: number
    updated_at: string
  }>('SELECT * FROM lb_arc_reports ORDER BY id')
}

export function archiveStats() {
  const total = queryValue<number>('SELECT COUNT(*) FROM lb_arc_archives') ?? 0
  const pending = queryValue<number>(
    "SELECT COUNT(*) FROM lb_arc_archives WHERE status = 'pending'",
  ) ?? 0
  const migrated = queryValue<number>(
    "SELECT COUNT(*) FROM lb_arc_archives WHERE status = 'migrated'",
  ) ?? 0
  const verified = queryValue<number>(
    "SELECT COUNT(*) FROM lb_arc_archives WHERE status = 'verified'",
  ) ?? 0
  const bytes = queryValue<number>('SELECT COALESCE(SUM(size_bytes),0) FROM lb_arc_archives') ?? 0
  return { total, pending, migrated, verified, bytes }
}
