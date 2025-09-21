/**
 * SendGrid Webhook API Route
 * Server-side endpoint for handling SendGrid webhooks
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Received SendGrid webhook:", body.event);

    switch (body.event) {
      case "delivered":
        console.log("Email delivered:", body.email);
        break;
      case "bounce":
        console.log("Email bounced:", body.email);
        break;
      case "spam_report":
        console.log("Spam report:", body.email);
        break;
      case "unsubscribe":
        console.log("Unsubscribe:", body.email);
        break;
      default:
        console.log(`Unhandled SendGrid event: ${body.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("SendGrid webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
