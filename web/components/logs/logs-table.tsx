"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import type { UpdateLog } from "@/lib/types"

interface LogsTableProps {
  logs: UpdateLog[]
}

function getStatusBadge(status: UpdateLog["status"]) {
  switch (status) {
    case "installed":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Installed</Badge>
    case "downloaded":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Downloaded</Badge>
    case "started":
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Started</Badge>
    case "failed":
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Failed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getPlatformIcon(platform: UpdateLog["platform"]) {
  if (platform === "mac") {
    return (
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
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    )
  }
  return (
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
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M6 21h12" />
      <path d="M12 17v4" />
    </svg>
  )
}

function LogRow({ log }: { log: UpdateLog }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasError = log.status === "failed" && log.errorMessage

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <>
        <TableRow className={hasError ? "border-b-0" : ""}>
          <TableCell className="text-muted-foreground">
            <div className="flex flex-col">
              <span className="text-sm">{formatRelativeTime(log.timestamp)}</span>
              <span className="text-xs text-muted-foreground/70">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          </TableCell>
          <TableCell className="font-mono text-sm">
            {log.clientId.slice(0, 16)}...
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {log.fromVersion || "New"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
              <span className="font-mono text-sm font-medium">
                {log.toVersion}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {getPlatformIcon(log.platform)}
              <span className="capitalize">{log.platform}</span>
            </div>
          </TableCell>
          <TableCell>{getStatusBadge(log.status)}</TableCell>
          <TableCell>
            {hasError && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span className="sr-only">Toggle error details</span>
                </Button>
              </CollapsibleTrigger>
            )}
          </TableCell>
        </TableRow>
        {hasError && (
          <CollapsibleContent asChild>
            <TableRow className="bg-red-500/5">
              <TableCell colSpan={6} className="py-3">
                <div className="rounded-md bg-red-500/10 p-3">
                  <p className="text-sm font-medium text-red-600">Error Details</p>
                  <p className="mt-1 text-sm text-red-600/80">{log.errorMessage}</p>
                  {log.userAgent && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      User Agent: {log.userAgent}
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </CollapsibleContent>
        )}
      </>
    </Collapsible>
  )
}

export function LogsTable({ logs }: LogsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Time</TableHead>
            <TableHead>Client ID</TableHead>
            <TableHead>Version Change</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No update logs found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => <LogRow key={log.id} log={log} />)
          )}
        </TableBody>
      </Table>
    </div>
  )
}
