"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Release, UpdateReleaseInput } from "@/lib/types";
import type { FormEvent } from "react";
import { useState } from "react";

interface EditReleaseDialogProps {
    release: Release | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (id: string, data: UpdateReleaseInput) => void;
}

export function EditReleaseDialog({
    release,
    open,
    onOpenChange,
    onSubmit,
}: EditReleaseDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                {release ? (
                    <EditReleaseForm
                        key={release.id}
                        release={release}
                        onOpenChange={onOpenChange}
                        onSubmit={onSubmit}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function EditReleaseForm({
    release,
    onOpenChange,
    onSubmit,
}: {
    release: Release;
    onOpenChange: (open: boolean) => void;
    onSubmit: (id: string, data: UpdateReleaseInput) => void;
}) {
    const [version, setVersion] = useState(release.version);
    const [releaseNotes, setReleaseNotes] = useState(release.releaseNotes);
    const [isEnabled, setIsEnabled] = useState(release.isEnabled);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(release.id, { version, releaseNotes, isEnabled });
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Release</DialogTitle>
                <DialogDescription>
                    Update the release details. Changes will take effect
                    immediately.
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
                        <p className="text-muted-foreground text-xs">
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
    );
}
