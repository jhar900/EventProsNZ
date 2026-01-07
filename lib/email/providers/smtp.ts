/**
 * SMTP email provider (Gmail, Outlook, custom SMTP)
 * This file is only loaded when SMTP_HOST is set
 */

export async function sendViaSMTP(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions: any = {
      from: options.from
        ? `${options.fromName || 'EventProsNZ'} <${options.from}>`
        : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    if (options.replyTo) {
      mailOptions.replyTo = options.replyTo;
    }

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    if (
      error?.code === 'MODULE_NOT_FOUND' ||
      error?.message?.includes('Cannot find module') ||
      error?.message?.includes("Can't resolve")
    ) {
      return {
        success: false,
        error: 'Nodemailer package not installed. Run: npm install nodemailer',
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to send via SMTP',
    };
  }
}
