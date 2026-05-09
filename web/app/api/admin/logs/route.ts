import { logsStore } from "@/lib/store";
import type { LogFilters, Platform, UpdateStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const filters: LogFilters = {};

    const platform = searchParams.get("platform");
    if (platform && ["mac", "windows"].includes(platform)) {
        filters.platform = platform as Platform;
    }

    const status = searchParams.get("status");
    if (
        status &&
        ["started", "downloaded", "installed", "failed"].includes(status)
    ) {
        filters.status = status as UpdateStatus;
    }

    const version = searchParams.get("version");
    if (version) {
        filters.version = version;
    }

    const logs = logsStore.getAll(filters);
    return NextResponse.json(logs);
}
