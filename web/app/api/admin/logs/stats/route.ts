import { logsStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
    const stats = logsStore.getStats();
    return NextResponse.json(stats);
}
