"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn, formatBytes } from "@/lib/utils"
import type { Release, Platform } from "@/lib/types"

interface UploadDialogProps {
  release: Release | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (id: string, platform: Platform, file: File) => Promise<void>
}

interface FileUploadProps {
  platform: Platform
  label: string
  accept: string
  currentFile?: { fileName: string; fileSize: number }
  file: File | null
  onFileChange: (file: File | null) => void
  isUploading: boolean
}

function FileUpload({
  platform,
  label,
  accept,
  currentFile,
  file,
  onFileChange,
  isUploading,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      onFileChange(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {currentFile && !file && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="text-sm font-medium">Current file:</p>
          <p className="text-sm text-muted-foreground">
            {currentFile.fileName} ({formatBytes(currentFile.fileSize)})
          </p>
        </div>
      )}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          disabled={isUploading}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-primary"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onFileChange(null)
              }}
            >
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-8 w-8 text-muted-foreground"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <p className="text-sm text-muted-foreground">
              Drop {platform === "mac" ? ".dmg or .zip" : ".exe or .nupkg"} file
              here or click to browse
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function UploadDialog({
  release,
  open,
  onOpenChange,
  onUpload,
}: UploadDialogProps) {
  const [macFile, setMacFile] = useState<File | null>(null)
  const [windowsFile, setWindowsFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!release) return

    setIsUploading(true)
    try {
      if (macFile) {
        await onUpload(release.id, "mac", macFile)
      }
      if (windowsFile) {
        await onUpload(release.id, "windows", windowsFile)
      }
      setMacFile(null)
      setWindowsFile(null)
      onOpenChange(false)
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMacFile(null)
      setWindowsFile(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Release Files</DialogTitle>
            <DialogDescription>
              Upload installer files for v{release?.version}. You can upload Mac
              and Windows files separately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <FileUpload
              platform="mac"
              label="Mac Installer"
              accept=".dmg,.zip"
              currentFile={release?.macFile}
              file={macFile}
              onFileChange={setMacFile}
              isUploading={isUploading}
            />
            <FileUpload
              platform="windows"
              label="Windows Installer"
              accept=".exe,.msi,.nupkg"
              currentFile={release?.windowsFile}
              file={windowsFile}
              onFileChange={setWindowsFile}
              isUploading={isUploading}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || (!macFile && !windowsFile)}
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
