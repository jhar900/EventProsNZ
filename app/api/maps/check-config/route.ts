/**
 * Check Maps Configuration API Route
 * Server-side endpoint for checking if Mapbox is configured
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const isConfigured = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured ? "Mapbox is configured" : "Mapbox token not found",
    });
  } catch (error) {
    console.error("Configuration check error:", error);

    return NextResponse.json(
      {
        configured: false,
        message: "Error checking configuration",
      },
      { status: 500 }
    );
  }
}
