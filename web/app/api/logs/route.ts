import {
    createLogSchema,
    validationError,
} from "@/lib/api/validation";
import { logsStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    let json: unknown;
    try {
        json = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createLogSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            validationError(parsed.error),
            { status: 400 },
        );
    }

    const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const log = logsStore.create(parsed.data, { ipAddress, userAgent });

    return NextResponse.json(log, { status: 201 });
}
