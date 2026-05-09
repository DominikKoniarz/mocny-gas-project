import {
    adminLogsQuerySchema,
    validationError,
} from "@/lib/api/validation";
import { logsStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsedQuery = adminLogsQuerySchema.safeParse(
        Object.fromEntries(searchParams),
    );

    if (!parsedQuery.success) {
        return NextResponse.json(
            validationError(parsedQuery.error),
            { status: 400 },
        );
    }

    const logs = logsStore.getAll(parsedQuery.data);
    return NextResponse.json(logs);
}
