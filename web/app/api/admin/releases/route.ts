import { NextResponse } from "next/server"
import { releasesStore } from "@/lib/store"
import type { CreateReleaseInput } from "@/lib/types"

export async function GET() {
  const releases = releasesStore.getAll()
  return NextResponse.json(releases)
}

export async function POST(request: Request) {
  const body: CreateReleaseInput = await request.json()
  
  // Validate version format
  if (!body.version || !body.version.match(/^\d+\.\d+\.\d+$/)) {
    return NextResponse.json(
      { error: "Invalid version format. Use semantic versioning (e.g., 1.0.0)" },
      { status: 400 }
    )
  }
  
  // Check for duplicate version
  const existing = releasesStore.getByVersion(body.version)
  if (existing) {
    return NextResponse.json(
      { error: "A release with this version already exists" },
      { status: 400 }
    )
  }
  
  const release = releasesStore.create(body)
  return NextResponse.json(release, { status: 201 })
}
