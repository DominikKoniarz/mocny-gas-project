import { NextResponse } from "next/server"
import { releasesStore } from "@/lib/store"

export async function GET() {
  const stats = releasesStore.getStats()
  return NextResponse.json(stats)
}
