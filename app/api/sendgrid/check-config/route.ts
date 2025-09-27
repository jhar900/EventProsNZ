/**
 * Check SendGrid Configuration API Route
 * Server-side endpoint for checking if SendGrid is configured
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const isConfigured = !!process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "Not set";

    return NextResponse.json({
      configured: isConfigured,
      fromEmail: fromEmail,
      message: isConfigured
        ? "SendGrid is configured"
        : "SendGrid API key not found",
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        fromEmail: "Not set",
        message: "Error checking configuration",
      },
      { status: 500 }
    );
  }
}
