import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
    const hasPublicKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const isConfigured = hasSecretKey && hasPublicKey;

    const publicKeyPreview =
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) +
        "..." || "Not set";

    return NextResponse.json({
      configured: isConfigured,
      hasSecretKey,
      hasPublicKey,
      publicKeyPreview,
      message: isConfigured ? "Stripe is configured" : "Stripe keys not found",
    });
  } catch (error) {
    console.error("Stripe configuration check error:", error);
    return NextResponse.json(
      {
        configured: false,
        hasSecretKey: false,
        hasPublicKey: false,
        publicKeyPreview: "N/A",
        message: "Error checking configuration",
      },
      { status: 500 }
    );
  }
}
