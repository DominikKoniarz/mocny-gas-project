import { releasesStore } from "@/lib/store";
import type { UpdateReleaseInput } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const release = releasesStore.getById(id);

    if (!release) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    return NextResponse.json(release);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const body: UpdateReleaseInput = await request.json();

    // If updating version, validate format
    if (body.version && !body.version.match(/^\d+\.\d+\.\d+$/)) {
        return NextResponse.json(
            {
                error: "Invalid version format. Use semantic versioning (e.g., 1.0.0)",
            },
            { status: 400 },
        );
    }

    // Check for duplicate version (excluding current release)
    if (body.version) {
        const existing = releasesStore.getByVersion(body.version);
        if (existing && existing.id !== id) {
            return NextResponse.json(
                { error: "A release with this version already exists" },
                { status: 400 },
            );
        }
    }

    const release = releasesStore.update(id, body);

    if (!release) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    return NextResponse.json(release);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const success = releasesStore.delete(id);

    if (!success) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true });
}
