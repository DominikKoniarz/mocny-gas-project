import {
    releaseIdParamsSchema,
    updateReleaseSchema,
    validationError,
} from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const parsedParams = releaseIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json(
            validationError(parsedParams.error),
            { status: 400 },
        );
    }

    const { id } = parsedParams.data;
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
    const parsedParams = releaseIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json(
            validationError(parsedParams.error),
            { status: 400 },
        );
    }

    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedBody = updateReleaseSchema.safeParse(json);
    if (!parsedBody.success) {
        return NextResponse.json(
            validationError(parsedBody.error),
            { status: 400 },
        );
    }

    const { id } = parsedParams.data;
    const body = parsedBody.data;

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
    const parsedParams = releaseIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json(
            validationError(parsedParams.error),
            { status: 400 },
        );
    }

    const { id } = parsedParams.data;
    const success = releasesStore.delete(id);

    if (!success) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true });
}
