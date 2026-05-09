"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Platform, UpdateStatus } from "@/lib/types"

interface LogFiltersProps {
  platform: Platform | "all"
  status: UpdateStatus | "all"
  onPlatformChange: (value: Platform | "all") => void
  onStatusChange: (value: UpdateStatus | "all") => void
  onRefresh: () => void
}

export function LogFilters({
  platform,
  status,
  onPlatformChange,
  onStatusChange,
  onRefresh,
}: LogFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={platform} onValueChange={(v) => onPlatformChange(v as Platform | "all")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="mac">Mac</SelectItem>
          <SelectItem value="windows">Windows</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => onStatusChange(v as UpdateStatus | "all")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="installed">Installed</SelectItem>
          <SelectItem value="downloaded">Downloaded</SelectItem>
          <SelectItem value="started">Started</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onRefresh}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
        <span className="sr-only">Refresh</span>
      </Button>
    </div>
  )
}
