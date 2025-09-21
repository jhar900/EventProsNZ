/**
 * SendGrid Send Template API Route
 * Server-side endpoint for sending template emails via SendGrid
 */

import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { to, templateId, dynamicTemplateData } = await request.json();

    if (!to || !templateId) {
      return NextResponse.json(
        { error: "Missing required fields: to and templateId" },
        { status: 400 }
      );
    }

    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@eventpros.co.nz",
      templateId: templateId,
      dynamicTemplateData: dynamicTemplateData || {},
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers["x-message-id"];

    return NextResponse.json({
      success: true,
      messageId: messageId,
    });
  } catch (error) {
    console.error("SendGrid template email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send template email",
        message: error instanceof Error ? error.message : "Unknown error",
        details: "Template ID may not exist or API key may be invalid",
      },
      { status: 500 }
    );
  }
}
