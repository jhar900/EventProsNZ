/**
 * SendGrid Send Email API Route
 * Server-side endpoint for sending emails via SendGrid
 */

import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html or text" },
        { status: 400 }
      );
    }

    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@eventpros.co.nz",
      subject: subject,
      text: text,
      html: html,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers["x-message-id"];

    return NextResponse.json({
      success: true,
      messageId: messageId,
    });
  } catch (error) {
    console.error("SendGrid email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
