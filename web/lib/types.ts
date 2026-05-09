export interface ReleaseFile {
  fileName: string
  fileSize: number
  downloadUrl: string
  downloadCount: number
}

export interface Release {
  id: string
  version: string
  releaseNotes: string
  createdAt: Date
  isEnabled: boolean
  macFile?: ReleaseFile
  windowsFile?: ReleaseFile
}

export type Platform = 'mac' | 'windows'
export type UpdateStatus = 'started' | 'downloaded' | 'installed' | 'failed'

export interface UpdateLog {
  id: string
  timestamp: Date
  clientId: string
  fromVersion: string | null
  toVersion: string
  platform: Platform
  status: UpdateStatus
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

export interface LogFilters {
  platform?: Platform
  status?: UpdateStatus
  version?: string
  startDate?: Date
  endDate?: Date
}

export interface CreateReleaseInput {
  version: string
  releaseNotes: string
  isEnabled?: boolean
}

export interface UpdateReleaseInput {
  version?: string
  releaseNotes?: string
  isEnabled?: boolean
}

export interface CreateLogInput {
  clientId: string
  fromVersion: string | null
  toVersion: string
  platform: Platform
  status: UpdateStatus
  errorMessage?: string
}
