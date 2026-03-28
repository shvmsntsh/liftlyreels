import { NextResponse } from "next/server";
import { BUILD_VERSION, BUILD_NUMBER, BUILD_DATE, LATEST_CHANGES } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: BUILD_VERSION,
    number: BUILD_NUMBER,
    date: BUILD_DATE,
    changes: LATEST_CHANGES,
  });
}
