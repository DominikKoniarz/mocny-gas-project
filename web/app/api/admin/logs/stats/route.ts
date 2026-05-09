import { NextResponse } from "next/server"
import { logsStore } from "@/lib/store"

export async function GET() {
  const stats = logsStore.getStats()
  return NextResponse.json(stats)
}
