import { NextRequest, NextResponse } from 'next/server';
import { SendGridService } from '@/lib/email/sendgrid-service';
import { BounceHandler } from '@/lib/email/bounce-handler';
import { EmailDeliveryMonitor } from '@/lib/email/email-delivery-monitor';
import { rateLimit } from '@/lib/rate-limiting';

// Rate limiting configuration
const webhookRateLimiter = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many webhook requests, please try again later',
};

export const POST = async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, webhookRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Verify webhook signature (in production, you should verify SendGrid signature)
    const signature = request.headers.get('x-sendgrid-signature');
    const timestamp = request.headers.get('x-sendgrid-timestamp');

    // In production, verify the signature here
    // if (!verifySendGridSignature(request.body, signature, timestamp)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const events = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const sendGridService = new SendGridService();
    const bounceHandler = new BounceHandler();
    const deliveryMonitor = new EmailDeliveryMonitor();

    // Process each event
    for (const event of events) {
      try {
        // Handle delivery events
        if (
          ['processed', 'delivered', 'bounce', 'complaint', 'dropped'].includes(
            event.event
          )
        ) {
          await sendGridService.handleWebhookEvent(event);
        }

        // Handle bounce and complaint events
        if (['bounce', 'complaint'].includes(event.event)) {
          await bounceHandler.processWebhookEvents([event]);
        }

        // Update delivery monitoring
        if (['delivered', 'bounce', 'complaint'].includes(event.event)) {
          await deliveryMonitor.monitorDeliveryPerformance();
        }
      } catch (error) {
        console.error('Error processing webhook event:', error);
        // Continue processing other events even if one fails
      }
    }

    const response = NextResponse.json({
      success: true,
      processed: events.length,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
};
