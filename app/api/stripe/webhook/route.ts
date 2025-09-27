/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/subscriptions/stripe-service';
import { headers } from 'next/headers';

const stripeService = new StripeService();

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Missing webhook secret' },
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
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the webhook event
    await stripeService.handleSubscriptionWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
