import { NextResponse } from "next/server";

export async function GET() {
  try {
    const isConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
    const analyticsId =
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "Not set";

    return NextResponse.json({
      configured: isConfigured,
      analyticsId: analyticsId,
      message: isConfigured
        ? "Google Analytics is configured"
        : "Google Analytics ID not found",
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        analyticsId: "N/A",
        message: "Error checking configuration",
      },
      { status: 500 }
    );
  }
}
