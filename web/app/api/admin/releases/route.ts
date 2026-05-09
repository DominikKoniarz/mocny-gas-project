import {
    createReleaseSchema,
    validationError,
} from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
    const releases = releasesStore.getAll();
    return NextResponse.json(releases);
}

export async function POST(request: Request) {
    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createReleaseSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            validationError(parsed.error),
            { status: 400 },
        );
    }

    const body = parsed.data;

    const existing = releasesStore.getByVersion(body.version);
    if (existing) {
        return NextResponse.json(
            { error: "A release with this version already exists" },
            { status: 400 },
        );
    }

    const release = releasesStore.create(body);
    return NextResponse.json(release, { status: 201 });
}
