import type {
  Release,
  UpdateLog,
  LogFilters,
  CreateReleaseInput,
  UpdateReleaseInput,
  CreateLogInput,
  Platform,
} from './types'

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Seed data for releases
const seedReleases: Release[] = [
  {
    id: 'rel_001',
    version: '2.1.0',
    releaseNotes: 'Major update with new features:\n- Dark mode support\n- Improved performance\n- Bug fixes for auto-update',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    isEnabled: true,
    macFile: {
      fileName: 'MyApp-2.1.0-arm64.dmg',
      fileSize: 89_400_000,
      downloadUrl: '/uploads/2.1.0/MyApp-2.1.0-arm64.dmg',
      downloadCount: 1247,
    },
    windowsFile: {
      fileName: 'MyApp-Setup-2.1.0.exe',
      fileSize: 76_200_000,
      downloadUrl: '/uploads/2.1.0/MyApp-Setup-2.1.0.exe',
      downloadCount: 3892,
    },
  },
  {
    id: 'rel_002',
    version: '2.0.5',
    releaseNotes: 'Hotfix release:\n- Fixed critical crash on startup\n- Memory leak fix',
    createdAt: new Date('2024-01-10T14:20:00Z'),
    isEnabled: true,
    macFile: {
      fileName: 'MyApp-2.0.5-arm64.dmg',
      fileSize: 88_100_000,
      downloadUrl: '/uploads/2.0.5/MyApp-2.0.5-arm64.dmg',
      downloadCount: 892,
    },
    windowsFile: {
      fileName: 'MyApp-Setup-2.0.5.exe',
      fileSize: 75_800_000,
      downloadUrl: '/uploads/2.0.5/MyApp-Setup-2.0.5.exe',
      downloadCount: 2341,
    },
  },
  {
    id: 'rel_003',
    version: '2.0.4',
    releaseNotes: 'Security update:\n- Patched XSS vulnerability\n- Updated dependencies',
    createdAt: new Date('2024-01-05T09:00:00Z'),
    isEnabled: false,
    macFile: {
      fileName: 'MyApp-2.0.4-arm64.dmg',
      fileSize: 87_500_000,
      downloadUrl: '/uploads/2.0.4/MyApp-2.0.4-arm64.dmg',
      downloadCount: 456,
    },
    windowsFile: {
      fileName: 'MyApp-Setup-2.0.4.exe',
      fileSize: 74_900_000,
      downloadUrl: '/uploads/2.0.4/MyApp-Setup-2.0.4.exe',
      downloadCount: 1123,
    },
  },
  {
    id: 'rel_004',
    version: '2.0.3',
    releaseNotes: 'Minor improvements:\n- UI tweaks\n- Better error messages',
    createdAt: new Date('2023-12-28T16:45:00Z'),
    isEnabled: false,
    macFile: {
      fileName: 'MyApp-2.0.3-arm64.dmg',
      fileSize: 86_800_000,
      downloadUrl: '/uploads/2.0.3/MyApp-2.0.3-arm64.dmg',
      downloadCount: 234,
    },
    windowsFile: {
      fileName: 'MyApp-Setup-2.0.3.exe',
      fileSize: 74_200_000,
      downloadUrl: '/uploads/2.0.3/MyApp-Setup-2.0.3.exe',
      downloadCount: 567,
    },
  },
  {
    id: 'rel_005',
    version: '2.0.0',
    releaseNotes: 'Major version 2.0:\n- Complete UI redesign\n- New plugin system\n- Performance optimizations\n- Native Apple Silicon support',
    createdAt: new Date('2023-12-15T12:00:00Z'),
    isEnabled: true,
    macFile: {
      fileName: 'MyApp-2.0.0-arm64.dmg',
      fileSize: 85_000_000,
      downloadUrl: '/uploads/2.0.0/MyApp-2.0.0-arm64.dmg',
      downloadCount: 5678,
    },
    windowsFile: {
      fileName: 'MyApp-Setup-2.0.0.exe',
      fileSize: 72_500_000,
      downloadUrl: '/uploads/2.0.0/MyApp-Setup-2.0.0.exe',
      downloadCount: 12450,
    },
  },
]

// Seed data for logs
const seedLogs: UpdateLog[] = [
  {
    id: 'log_001',
    timestamp: new Date('2024-01-15T18:30:00Z'),
    clientId: 'client_abc123',
    fromVersion: '2.0.5',
    toVersion: '2.1.0',
    platform: 'mac',
    status: 'installed',
    ipAddress: '192.168.1.100',
    userAgent: 'MyApp/2.0.5 (macOS 14.2; arm64)',
  },
  {
    id: 'log_002',
    timestamp: new Date('2024-01-15T18:25:00Z'),
    clientId: 'client_def456',
    fromVersion: '2.0.0',
    toVersion: '2.1.0',
    platform: 'windows',
    status: 'failed',
    errorMessage: 'Installation failed: EACCES permission denied. Administrator privileges required.',
    ipAddress: '10.0.0.50',
    userAgent: 'MyApp/2.0.0 (Windows 11; x64)',
  },
  {
    id: 'log_003',
    timestamp: new Date('2024-01-15T17:45:00Z'),
    clientId: 'client_ghi789',
    fromVersion: '2.0.5',
    toVersion: '2.1.0',
    platform: 'windows',
    status: 'installed',
    ipAddress: '172.16.0.25',
    userAgent: 'MyApp/2.0.5 (Windows 10; x64)',
  },
  {
    id: 'log_004',
    timestamp: new Date('2024-01-15T16:20:00Z'),
    clientId: 'client_jkl012',
    fromVersion: null,
    toVersion: '2.1.0',
    platform: 'mac',
    status: 'installed',
    ipAddress: '192.168.2.50',
    userAgent: 'MyApp/fresh-install (macOS 13.5; arm64)',
  },
  {
    id: 'log_005',
    timestamp: new Date('2024-01-15T15:10:00Z'),
    clientId: 'client_mno345',
    fromVersion: '2.0.3',
    toVersion: '2.1.0',
    platform: 'windows',
    status: 'downloaded',
    ipAddress: '10.10.10.100',
    userAgent: 'MyApp/2.0.3 (Windows 11; x64)',
  },
  {
    id: 'log_006',
    timestamp: new Date('2024-01-15T14:00:00Z'),
    clientId: 'client_pqr678',
    fromVersion: '2.0.5',
    toVersion: '2.1.0',
    platform: 'mac',
    status: 'started',
    ipAddress: '192.168.1.200',
    userAgent: 'MyApp/2.0.5 (macOS 14.1; x86_64)',
  },
  {
    id: 'log_007',
    timestamp: new Date('2024-01-14T20:30:00Z'),
    clientId: 'client_stu901',
    fromVersion: '1.9.0',
    toVersion: '2.0.5',
    platform: 'windows',
    status: 'failed',
    errorMessage: 'Download failed: Network timeout after 30 seconds. Please check your internet connection.',
    ipAddress: '192.168.0.75',
    userAgent: 'MyApp/1.9.0 (Windows 10; x64)',
  },
  {
    id: 'log_008',
    timestamp: new Date('2024-01-14T18:15:00Z'),
    clientId: 'client_vwx234',
    fromVersion: '2.0.0',
    toVersion: '2.0.5',
    platform: 'mac',
    status: 'installed',
    ipAddress: '10.0.1.150',
    userAgent: 'MyApp/2.0.0 (macOS 14.0; arm64)',
  },
  {
    id: 'log_009',
    timestamp: new Date('2024-01-14T12:45:00Z'),
    clientId: 'client_yza567',
    fromVersion: '2.0.4',
    toVersion: '2.0.5',
    platform: 'windows',
    status: 'installed',
    ipAddress: '172.20.0.100',
    userAgent: 'MyApp/2.0.4 (Windows 11; x64)',
  },
  {
    id: 'log_010',
    timestamp: new Date('2024-01-13T09:30:00Z'),
    clientId: 'client_bcd890',
    fromVersion: '1.8.5',
    toVersion: '2.0.0',
    platform: 'mac',
    status: 'installed',
    ipAddress: '192.168.5.25',
    userAgent: 'MyApp/1.8.5 (macOS 13.0; x86_64)',
  },
]

// In-memory stores
let releases: Release[] = [...seedReleases]
let logs: UpdateLog[] = [...seedLogs]

// Releases store
export const releasesStore = {
  getAll: (): Release[] => {
    return [...releases].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  getById: (id: string): Release | undefined => {
    return releases.find((r) => r.id === id)
  },

  getByVersion: (version: string): Release | undefined => {
    return releases.find((r) => r.version === version)
  },

  getLatestEnabled: (platform?: Platform): Release | undefined => {
    const enabled = releases
      .filter((r) => r.isEnabled)
      .filter((r) => !platform || (platform === 'mac' ? r.macFile : r.windowsFile))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return enabled[0]
  },

  create: (input: CreateReleaseInput): Release => {
    const release: Release = {
      id: `rel_${generateId()}`,
      version: input.version,
      releaseNotes: input.releaseNotes,
      createdAt: new Date(),
      isEnabled: input.isEnabled ?? false,
    }
    releases.push(release)
    return release
  },

  update: (id: string, data: UpdateReleaseInput): Release | undefined => {
    const index = releases.findIndex((r) => r.id === id)
    if (index === -1) return undefined
    releases[index] = { ...releases[index], ...data }
    return releases[index]
  },

  delete: (id: string): boolean => {
    const index = releases.findIndex((r) => r.id === id)
    if (index === -1) return false
    releases.splice(index, 1)
    return true
  },

  setFile: (
    id: string,
    platform: Platform,
    file: { fileName: string; fileSize: number; downloadUrl: string }
  ): Release | undefined => {
    const release = releases.find((r) => r.id === id)
    if (!release) return undefined
    
    const fileData = {
      ...file,
      downloadCount: 0,
    }
    
    if (platform === 'mac') {
      release.macFile = fileData
    } else {
      release.windowsFile = fileData
    }
    return release
  },

  incrementDownload: (id: string, platform: Platform): boolean => {
    const release = releases.find((r) => r.id === id)
    if (!release) return false
    
    const file = platform === 'mac' ? release.macFile : release.windowsFile
    if (!file) return false
    
    file.downloadCount++
    return true
  },

  getStats: () => {
    const totalReleases = releases.length
    const activeReleases = releases.filter((r) => r.isEnabled).length
    const totalDownloads = releases.reduce((sum, r) => {
      return sum + (r.macFile?.downloadCount || 0) + (r.windowsFile?.downloadCount || 0)
    }, 0)
    const macDownloads = releases.reduce((sum, r) => sum + (r.macFile?.downloadCount || 0), 0)
    const windowsDownloads = releases.reduce((sum, r) => sum + (r.windowsFile?.downloadCount || 0), 0)
    
    return {
      totalReleases,
      activeReleases,
      totalDownloads,
      macDownloads,
      windowsDownloads,
    }
  },
}

// Logs store
export const logsStore = {
  getAll: (filters?: LogFilters): UpdateLog[] => {
    let result = [...logs]
    
    if (filters?.platform) {
      result = result.filter((l) => l.platform === filters.platform)
    }
    if (filters?.status) {
      result = result.filter((l) => l.status === filters.status)
    }
    if (filters?.version) {
      result = result.filter((l) => l.toVersion === filters.version || l.fromVersion === filters.version)
    }
    if (filters?.startDate) {
      result = result.filter((l) => l.timestamp >= filters.startDate!)
    }
    if (filters?.endDate) {
      result = result.filter((l) => l.timestamp <= filters.endDate!)
    }
    
    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  },

  create: (input: CreateLogInput, headers?: { ipAddress?: string; userAgent?: string }): UpdateLog => {
    const log: UpdateLog = {
      id: `log_${generateId()}`,
      timestamp: new Date(),
      clientId: input.clientId,
      fromVersion: input.fromVersion,
      toVersion: input.toVersion,
      platform: input.platform,
      status: input.status,
      errorMessage: input.errorMessage,
      ipAddress: headers?.ipAddress,
      userAgent: headers?.userAgent,
    }
    logs.push(log)
    return log
  },

  getStats: () => {
    const total = logs.length
    const successful = logs.filter((l) => l.status === 'installed').length
    const failed = logs.filter((l) => l.status === 'failed').length
    const inProgress = logs.filter((l) => l.status === 'started' || l.status === 'downloaded').length
    
    return { total, successful, failed, inProgress }
  },
}
