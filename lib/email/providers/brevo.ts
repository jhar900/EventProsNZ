/**
 * Brevo/Sendinblue email provider
 * This file is only loaded when BREVO_API_KEY is set
 */

export async function sendViaBrevo(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  fromName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const brevo = await import('@getbrevo/brevo');
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    sendSmtpEmail.textContent = options.text;
    sendSmtpEmail.sender = {
      name: options.fromName || 'EventProsNZ',
      email:
        options.from ||
        process.env.BREVO_FROM_EMAIL ||
        'noreply@eventprosnz.com',
    };
    sendSmtpEmail.to = Array.isArray(options.to)
      ? options.to.map(email => ({ email }))
      : [{ email: options.to }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    if (
      error?.code === 'MODULE_NOT_FOUND' ||
      error?.message?.includes('Cannot find module') ||
      error?.message?.includes("Can't resolve")
    ) {
      return {
        success: false,
        error: 'Brevo package not installed. Run: npm install @getbrevo/brevo',
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to send via Brevo',
    };
  }
}


