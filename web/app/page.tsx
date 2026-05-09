"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { AddReleaseDialog } from "@/components/releases/add-release-dialog";
import { EditReleaseDialog } from "@/components/releases/edit-release-dialog";
import { ReleasesTable } from "@/components/releases/releases-table";
import { StatsCards } from "@/components/releases/stats-cards";
import { UploadDialog } from "@/components/releases/upload-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
    CreateReleaseInput,
    Platform,
    Release,
    ReleaseFileKind,
    UpdateReleaseInput,
} from "@/lib/types";
import { useCallback, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReleasesPage() {
    const { data: releases, isLoading: releasesLoading } = useSWR<Release[]>(
        "/api/admin/releases",
        fetcher,
    );
    const { data: stats, isLoading: statsLoading } = useSWR<{
        totalReleases: number;
        activeReleases: number;
        totalDownloads: number;
        macDownloads: number;
        windowsDownloads: number;
    }>("/api/admin/releases/stats", fetcher);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(
        null,
    );

    const handleAddRelease = useCallback(async (data: CreateReleaseInput) => {
        await fetch("/api/admin/releases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        mutate("/api/admin/releases");
        mutate("/api/admin/releases/stats");
    }, []);

    const handleToggleEnabled = useCallback(
        async (id: string, enabled: boolean) => {
            await fetch(`/api/admin/releases/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isEnabled: enabled }),
            });
            mutate("/api/admin/releases");
            mutate("/api/admin/releases/stats");
        },
        [],
    );

    const handleEditRelease = useCallback(
        async (id: string, data: UpdateReleaseInput) => {
            await fetch(`/api/admin/releases/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            mutate("/api/admin/releases");
            mutate("/api/admin/releases/stats");
        },
        [],
    );

    const handleDeleteRelease = useCallback(async (id: string) => {
        await fetch(`/api/admin/releases/${id}`, {
            method: "DELETE",
        });
        mutate("/api/admin/releases");
        mutate("/api/admin/releases/stats");
    }, []);

    const handleUploadFile = useCallback(
        async (
            id: string,
            platform: Platform,
            kind: ReleaseFileKind,
            file: File,
        ) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("platform", platform);
            formData.append("kind", kind);

            await fetch(`/api/admin/releases/${id}/upload`, {
                method: "POST",
                body: formData,
            });
            mutate("/api/admin/releases");
            mutate("/api/admin/releases/stats");
        },
        [],
    );

    const openEditDialog = (release: Release) => {
        setSelectedRelease(release);
        setEditDialogOpen(true);
    };

    const openUploadDialog = (release: Release) => {
        setSelectedRelease(release);
        setUploadDialogOpen(true);
    };

    // Parse dates from JSON
    const parsedReleases = releases?.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt),
    }));

    return (
        <div className="bg-background min-h-screen">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex w-full items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Releases
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your Electron app releases for Mac
                                    and Windows
                                </p>
                            </div>
                            <Button onClick={() => setAddDialogOpen(true)}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2 h-4 w-4"
                                >
                                    <path d="M5 12h14" />
                                    <path d="M12 5v14" />
                                </svg>
                                Add Release
                            </Button>
                        </div>
                    </div>

                    {statsLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-[120px]" />
                            ))}
                        </div>
                    ) : stats ? (
                        <StatsCards stats={stats} />
                    ) : null}

                    {releasesLoading ? (
                        <Skeleton className="h-[400px]" />
                    ) : (
                        <ReleasesTable
                            releases={parsedReleases || []}
                            onToggleEnabled={handleToggleEnabled}
                            onEdit={openEditDialog}
                            onDelete={handleDeleteRelease}
                            onUploadFile={openUploadDialog}
                        />
                    )}
                </div>
            </main>

            <AddReleaseDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSubmit={handleAddRelease}
            />

            <EditReleaseDialog
                release={selectedRelease}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSubmit={handleEditRelease}
            />

            <UploadDialog
                release={selectedRelease}
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                onUpload={handleUploadFile}
            />
        </div>
    );
}
