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
import type { CreateReleaseInput } from "@/lib/types";
import { useState } from "react";

interface AddReleaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateReleaseInput) => void;
}

export function AddReleaseDialog({
    open,
    onOpenChange,
    onSubmit,
}: AddReleaseDialogProps) {
    const [version, setVersion] = useState("");
    const [releaseNotes, setReleaseNotes] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ version, releaseNotes, isEnabled });
            setVersion("");
            setReleaseNotes("");
            setIsEnabled(false);
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Release</DialogTitle>
                        <DialogDescription>
                            Create a new release version. You can upload files
                            after creating the release.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="version">Version</Label>
                            <Input
                                id="version"
                                placeholder="1.0.0"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                required
                            />
                            <p className="text-muted-foreground text-xs">
                                Use semantic versioning (e.g., 1.0.0, 2.1.3)
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="releaseNotes">Release Notes</Label>
                            <Textarea
                                id="releaseNotes"
                                placeholder="What's new in this version..."
                                value={releaseNotes}
                                onChange={(e) =>
                                    setReleaseNotes(e.target.value)
                                }
                                rows={5}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="enabled">
                                    Enable immediately
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                    Make this release available for download
                                    right away
                                </p>
                            </div>
                            <Switch
                                id="enabled"
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
                            {isSubmitting ? "Creating..." : "Create Release"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
