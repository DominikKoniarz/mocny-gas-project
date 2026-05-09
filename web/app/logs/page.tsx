"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { LogsTable } from "@/components/logs/logs-table"
import { LogFilters } from "@/components/logs/log-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { UpdateLog, Platform, UpdateStatus } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LogsPage() {
  const [platform, setPlatform] = useState<Platform | "all">("all")
  const [status, setStatus] = useState<UpdateStatus | "all">("all")

  const queryParams = new URLSearchParams()
  if (platform !== "all") queryParams.set("platform", platform)
  if (status !== "all") queryParams.set("status", status)
  const queryString = queryParams.toString()

  const { data: logs, isLoading, mutate } = useSWR<UpdateLog[]>(
    `/api/admin/logs${queryString ? `?${queryString}` : ""}`,
    fetcher
  )

  const { data: stats } = useSWR<{
    total: number
    successful: number
    failed: number
    inProgress: number
  }>("/api/admin/logs/stats", fetcher)

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  // Parse dates from JSON
  const parsedLogs = logs?.map((l) => ({
    ...l,
    timestamp: new Date(l.timestamp),
  }))

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Logs</h1>
            <p className="text-muted-foreground">
              Track client update events, successes, and failures
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
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
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-green-500"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.successful ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-red-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.failed ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-yellow-500"
                >
                  <path d="M12 2v4" />
                  <path d="m16.2 7.8 2.9-2.9" />
                  <path d="M18 12h4" />
                  <path d="m16.2 16.2 2.9 2.9" />
                  <path d="M12 18v4" />
                  <path d="m4.9 19.1 2.9-2.9" />
                  <path d="M2 12h4" />
                  <path d="m4.9 4.9 2.9 2.9" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <LogFilters
              platform={platform}
              status={status}
              onPlatformChange={setPlatform}
              onStatusChange={setStatus}
              onRefresh={handleRefresh}
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <LogsTable logs={parsedLogs || []} />
          )}
        </div>
      </main>
    </div>
  )
}
