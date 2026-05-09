import { releasesStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
    const stats = releasesStore.getStats();
    return NextResponse.json(stats);
}
