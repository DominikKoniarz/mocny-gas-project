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
import { Label } from "@/components/ui/label";
import type { Platform, Release, ReleaseFileKind } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import { useRef, useState } from "react";

interface UploadDialogProps {
    release: Release | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (
        id: string,
        platform: Platform,
        kind: ReleaseFileKind,
        file: File,
    ) => Promise<void>;
}

interface FileUploadProps {
    label: string;
    accept: string;
    helperText: string;
    currentFile?: { fileName: string; fileSize: number };
    file: File | null;
    onFileChange: (file: File | null) => void;
    isUploading: boolean;
    isDisabled?: boolean;
}

function FileUpload({
    label,
    accept,
    helperText,
    currentFile,
    file,
    onFileChange,
    isUploading,
    isDisabled = false,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            onFileChange(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {currentFile && !file && (
                <div className="bg-muted/50 rounded-md border p-3">
                    <p className="text-sm font-medium">Current file:</p>
                    <p className="text-muted-foreground text-sm">
                        {currentFile.fileName} (
                        {formatBytes(currentFile.fileSize)})
                    </p>
                </div>
            )}
            <div
                className={cn(
                    "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                    isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25",
                    (isUploading || isDisabled) &&
                        "pointer-events-none opacity-50",
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
                    disabled={isUploading || isDisabled}
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
                            className="text-primary h-5 w-5"
                        >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div className="text-left">
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                                {formatBytes(file.size)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileChange(null);
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
                            className="text-muted-foreground mx-auto h-8 w-8"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                        <p className="text-muted-foreground text-sm">
                            {helperText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function UploadDialog({
    release,
    open,
    onOpenChange,
    onUpload,
}: UploadDialogProps) {
    const [macFiles, setMacFiles] = useState<
        Record<ReleaseFileKind, File | null>
    >({
        artifact: null,
        blockmap: null,
        metadata: null,
    });
    const [windowsFiles, setWindowsFiles] = useState<
        Record<ReleaseFileKind, File | null>
    >({
        artifact: null,
        blockmap: null,
        metadata: null,
    });
    const [isUploading, setIsUploading] = useState(false);

    const requirements: Record<
        Platform,
        Array<{
            kind: ReleaseFileKind;
            label: string;
            accept: string;
            helperText: string;
        }>
    > = {
        mac: [
            {
                kind: "artifact",
                label: "Mac Update (.zip)",
                accept: ".zip",
                helperText:
                    "Drop the .zip update file here or click to browse",
            },
            {
                kind: "blockmap",
                label: "Mac Blockmap (.zip.blockmap)",
                accept: ".blockmap",
                helperText:
                    "Drop the .zip.blockmap file here or click to browse",
            },
            {
                kind: "metadata",
                label: "Mac Metadata (latest-mac.yml)",
                accept: ".yml",
                helperText:
                    "Drop latest-mac.yml here or click to browse (upload last)",
            },
        ],
        windows: [
            {
                kind: "artifact",
                label: "Windows Update (.exe)",
                accept: ".exe",
                helperText:
                    "Drop the .exe update file here or click to browse",
            },
            {
                kind: "blockmap",
                label: "Windows Blockmap (.exe.blockmap)",
                accept: ".blockmap",
                helperText:
                    "Drop the .exe.blockmap file here or click to browse",
            },
            {
                kind: "metadata",
                label: "Windows Metadata (latest.yml)",
                accept: ".yml",
                helperText:
                    "Drop latest.yml here or click to browse (upload last)",
            },
        ],
    };

    const currentFiles = (platform: Platform, kind: ReleaseFileKind) =>
        release?.files.find(
            (file) => file.platform === platform && file.kind === kind,
        );

    const macHasArtifact =
        Boolean(macFiles.artifact) || Boolean(currentFiles("mac", "artifact"));
    const macHasBlockmap =
        Boolean(macFiles.blockmap) || Boolean(currentFiles("mac", "blockmap"));
    const windowsHasArtifact =
        Boolean(windowsFiles.artifact) ||
        Boolean(currentFiles("windows", "artifact"));
    const windowsHasBlockmap =
        Boolean(windowsFiles.blockmap) ||
        Boolean(currentFiles("windows", "blockmap"));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!release) return;

        setIsUploading(true);
        try {
            const uploadOrder: ReleaseFileKind[] = [
                "artifact",
                "blockmap",
                "metadata",
            ];

            for (const kind of uploadOrder) {
                const file = macFiles[kind];
                if (file) {
                    await onUpload(release.id, "mac", kind, file);
                }
            }

            for (const kind of uploadOrder) {
                const file = windowsFiles[kind];
                if (file) {
                    await onUpload(release.id, "windows", kind, file);
                }
            }

            setMacFiles({ artifact: null, blockmap: null, metadata: null });
            setWindowsFiles({
                artifact: null,
                blockmap: null,
                metadata: null,
            });
            onOpenChange(false);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setMacFiles({ artifact: null, blockmap: null, metadata: null });
            setWindowsFiles({
                artifact: null,
                blockmap: null,
                metadata: null,
            });
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Upload Release Files</DialogTitle>
                        <DialogDescription>
                            Upload installer files for v{release?.version}. You
                            can upload Mac and Windows files separately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-6">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                    Mac files
                                </p>
                            </div>
                            {requirements.mac.map((requirement) => (
                                <FileUpload
                                    key={`mac-${requirement.kind}`}
                                    label={requirement.label}
                                    accept={requirement.accept}
                                    helperText={requirement.helperText}
                                    currentFile={currentFiles(
                                        "mac",
                                        requirement.kind,
                                    )}
                                    isDisabled={
                                        requirement.kind === "metadata" &&
                                        !(macHasArtifact && macHasBlockmap)
                                    }
                                    file={macFiles[requirement.kind]}
                                    onFileChange={(file) =>
                                        setMacFiles((prev) => ({
                                            ...prev,
                                            [requirement.kind]: file,
                                        }))
                                    }
                                    isUploading={isUploading}
                                />
                            ))}
                        </div>
                        <div className="space-y-6">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                    Windows files
                                </p>
                            </div>
                            {requirements.windows.map((requirement) => (
                                <FileUpload
                                    key={`windows-${requirement.kind}`}
                                    label={requirement.label}
                                    accept={requirement.accept}
                                    helperText={requirement.helperText}
                                    currentFile={currentFiles(
                                        "windows",
                                        requirement.kind,
                                    )}
                                    isDisabled={
                                        requirement.kind === "metadata" &&
                                        !(windowsHasArtifact && windowsHasBlockmap)
                                    }
                                    file={windowsFiles[requirement.kind]}
                                    onFileChange={(file) =>
                                        setWindowsFiles((prev) => ({
                                            ...prev,
                                            [requirement.kind]: file,
                                        }))
                                    }
                                    isUploading={isUploading}
                                />
                            ))}
                        </div>
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
                            disabled={
                                isUploading ||
                                (!Object.values(macFiles).some(Boolean) &&
                                    !Object.values(windowsFiles).some(Boolean))
                            }
                        >
                            {isUploading ? "Uploading..." : "Upload Files"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
