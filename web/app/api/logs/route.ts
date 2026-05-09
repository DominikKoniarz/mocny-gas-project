import { logsStore } from "@/lib/store";
import type { CreateLogInput, UpdateStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body: CreateLogInput = await request.json();

    // Validate required fields
    if (!body.clientId || typeof body.clientId !== "string") {
        return NextResponse.json(
            { error: "clientId is required" },
            { status: 400 },
        );
    }

    if (!body.toVersion || typeof body.toVersion !== "string") {
        return NextResponse.json(
            { error: "toVersion is required" },
            { status: 400 },
        );
    }

    if (!body.platform || !["mac", "windows"].includes(body.platform)) {
        return NextResponse.json(
            { error: "platform must be 'mac' or 'windows'" },
            { status: 400 },
        );
    }

    const validStatuses: UpdateStatus[] = [
        "started",
        "downloaded",
        "installed",
        "failed",
    ];
    if (!body.status || !validStatuses.includes(body.status)) {
        return NextResponse.json(
            {
                error: "status must be one of: started, downloaded, installed, failed",
            },
            { status: 400 },
        );
    }

    // Extract headers for logging
    const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const log = logsStore.create(body, { ipAddress, userAgent });

    return NextResponse.json(log, { status: 201 });
}
