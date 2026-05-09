import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { releasesStore } from "@/lib/store"
import type { Platform } from "@/lib/types"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const release = releasesStore.getById(id)
  
  if (!release) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const platform = formData.get("platform") as Platform | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!platform || !["mac", "windows"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  // Validate file extension
  const fileName = file.name
  const validExtensions = platform === "mac" 
    ? [".dmg", ".zip"] 
    : [".exe", ".msi", ".nupkg"]
  
  const hasValidExtension = validExtensions.some(ext => 
    fileName.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidExtension) {
    return NextResponse.json(
      { error: `Invalid file type. Expected: ${validExtensions.join(", ")}` },
      { status: 400 }
    )
  }

  // Create upload directory
  const uploadDir = path.join(process.cwd(), "public", "uploads", release.version)
  await mkdir(uploadDir, { recursive: true })

  // Write file to disk
  const filePath = path.join(uploadDir, fileName)
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  // Update release with file info
  const downloadUrl = `/uploads/${release.version}/${fileName}`
  releasesStore.setFile(id, platform, {
    fileName,
    fileSize: file.size,
    downloadUrl,
  })

  return NextResponse.json({
    success: true,
    fileName,
    fileSize: file.size,
    downloadUrl,
  })
}
