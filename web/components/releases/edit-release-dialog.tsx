"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { Release, UpdateReleaseInput } from "@/lib/types"

interface EditReleaseDialogProps {
  release: Release | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, data: UpdateReleaseInput) => void
}

export function EditReleaseDialog({
  release,
  open,
  onOpenChange,
  onSubmit,
}: EditReleaseDialogProps) {
  const [version, setVersion] = useState("")
  const [releaseNotes, setReleaseNotes] = useState("")
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (release) {
      setVersion(release.version)
      setReleaseNotes(release.releaseNotes)
      setIsEnabled(release.isEnabled)
    }
  }, [release])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!release) return
    setIsSubmitting(true)
    try {
      await onSubmit(release.id, { version, releaseNotes, isEnabled })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Release</DialogTitle>
            <DialogDescription>
              Update the release details. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-version">Version</Label>
              <Input
                id="edit-version"
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-releaseNotes">Release Notes</Label>
              <Textarea
                id="edit-releaseNotes"
                placeholder="What's new in this version..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enabled">Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Allow clients to download this release
                </p>
              </div>
              <Switch
                id="edit-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
