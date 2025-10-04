/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment and subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/payments/stripe-service';
import { PaymentService } from '@/lib/payments/payment-service';
import { FailedPaymentService } from '@/lib/payments/failed-payment-service';
import { NotificationService } from '@/lib/payments/notification-service';
import { rateLimit, paymentRateLimiter } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

// Services will be instantiated in the handler to allow for proper mocking in tests
let stripeService: StripeService;
let paymentService: PaymentService;
let failedPaymentService: FailedPaymentService;
let notificationService: NotificationService;

export async function POST(request: NextRequest) {
  try {
    // Initialize services (allows for proper mocking in tests)
    if (!stripeService) {
      stripeService = new StripeService();
      paymentService = new PaymentService();
      failedPaymentService = new FailedPaymentService();
      notificationService = new NotificationService();
    }

    // In test environment, use the mocked instance
    if (process.env.NODE_ENV === 'test') {
      const {
        StripeService: MockedStripeService,
      } = require('@/lib/payments/stripe-service');
      stripeService = new MockedStripeService();
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(request, paymentRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripeService.verifyWebhookSignature(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.log('Signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the webhook event
    try {
      await stripeService.handlePaymentWebhook(event);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return NextResponse.json(
        { error: 'Failed to process webhook event' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(event: any) {
  try {
    // Validate event object
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid event object');
    }

    if (!event.type) {
      throw new Error('Event missing type property');
    }

    if (!event.data || !event.data.object) {
      throw new Error('Event missing data.object property');
    }

    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      // Payment Method Events
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object);
        break;

      // Customer Events
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;

      // Subscription Events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object, event.type);
        break;

      // Invoice Events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Dispute Events
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(
      `Error handling webhook event ${event?.type || 'unknown'}:`,
      error
    );
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    // Update payment status in database
    const payment = await paymentService.getPaymentByIntentId(paymentIntent.id);
    if (payment) {
      await paymentService.updatePaymentStatus(payment.id, 'succeeded');
    }

    // Send success notification
    if (payment) {
      await notificationService.sendPaymentNotification(
        payment.id,
        'payment_success'
      );
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    // Update payment status in database
    const payment = await paymentService.getPaymentByIntentId(paymentIntent.id);
    if (payment) {
      await paymentService.updatePaymentStatus(
        payment.id,
        'failed',
        paymentIntent.last_payment_error?.message
      );

      // Create failed payment record
      await failedPaymentService.createFailedPayment({
        payment_id: payment.id,
        grace_period_days: 7,
      });

      // Send failure notification
      await notificationService.sendPaymentNotification(
        payment.id,
        'payment_failed'
      );
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  try {
    // Update payment status in database
    const payment = await paymentService.getPaymentByIntentId(paymentIntent.id);
    if (payment) {
      await paymentService.updatePaymentStatus(payment.id, 'canceled');
    }
  } catch (error) {
    console.error('Error handling payment intent canceled:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: any) {
  try {
    // Log payment method attachment
    console.log('Payment method attached:', paymentMethod.id);
  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

async function handlePaymentMethodDetached(paymentMethod: any) {
  try {
    // Log payment method detachment
    console.log('Payment method detached:', paymentMethod.id);
  } catch (error) {
    console.error('Error handling payment method detached:', error);
  }
}

async function handleCustomerCreated(customer: any) {
  try {
    // Log customer creation
    console.log('Customer created:', customer.id);
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handleCustomerUpdated(customer: any) {
  try {
    // Log customer update
    console.log('Customer updated:', customer.id);
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}

async function handleSubscriptionEvent(subscription: any, eventType: string) {
  try {
    // Handle subscription events
    console.log(`Subscription ${eventType}:`, subscription.id);
  } catch (error) {
    console.error(`Error handling subscription ${eventType}:`, error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    // Handle successful invoice payment
    console.log('Invoice payment succeeded:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  try {
    // Handle failed invoice payment
    console.log('Invoice payment failed:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleDisputeCreated(dispute: any) {
  try {
    // Handle dispute creation
    console.log('Dispute created:', dispute.id);
  } catch (error) {
    console.error('Error handling dispute created:', error);
  }
}
