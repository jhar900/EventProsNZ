/**
 * Test script for Stripe webhook endpoint
 * This script helps test the webhook handler locally
 *
 * Usage:
 *   1. Make sure your dev server is running: npm run dev
 *   2. Set STRIPE_WEBHOOK_SECRET in your .env file
 *   3. Run: node scripts/test-webhook.js
 */

const crypto = require('crypto');

// Test webhook secret (use your actual secret from .env)
const WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret';
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';

// Helper function to create Stripe webhook signature
function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Sample webhook event payloads
const testEvents = {
  'customer.subscription.created': {
    id: 'evt_test_subscription_created',
    object: 'event',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test123',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        canceled_at: null,
      },
    },
  },
  'customer.subscription.updated': {
    id: 'evt_test_subscription_updated',
    object: 'event',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test123',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        canceled_at: null,
      },
    },
  },
  'invoice.payment_succeeded': {
    id: 'evt_test_invoice_succeeded',
    object: 'event',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test123',
        object: 'invoice',
        subscription: 'sub_test123',
        customer: 'cus_test123',
        amount_paid: 1000,
        currency: 'nzd',
        status: 'paid',
      },
    },
  },
  'invoice.payment_failed': {
    id: 'evt_test_invoice_failed',
    object: 'event',
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_test456',
        object: 'invoice',
        subscription: 'sub_test123',
        customer: 'cus_test123',
        amount_due: 1000,
        currency: 'nzd',
        attempt_count: 1,
        status: 'open',
      },
    },
  },
  'payment_intent.succeeded': {
    id: 'evt_test_payment_succeeded',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test123',
        object: 'payment_intent',
        status: 'succeeded',
        amount: 1000,
        currency: 'nzd',
        customer: 'cus_test123',
      },
    },
  },
};

// Function to send test webhook
async function sendTestWebhook(eventType) {
  const event = testEvents[eventType];
  if (!event) {
    console.error(`Unknown event type: ${eventType}`);
    return;
  }

  const payload = JSON.stringify(event);
  const signature = createStripeSignature(payload, WEBHOOK_SECRET);

  try {
    console.log(`\n📤 Sending ${eventType} webhook...`);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (response.ok) {
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`Response:`, responseData);
    } else {
      console.log(`❌ Failed! Status: ${response.status}`);
      console.log(`Response:`, responseData);
    }
  } catch (error) {
    console.error(`❌ Error sending webhook:`, error.message);
    console.error(`Make sure your dev server is running on ${WEBHOOK_URL}`);
  }
}

// Main function
async function main() {
  console.log('🧪 Stripe Webhook Test Script');
  console.log('============================');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Using secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  console.log('\nAvailable test events:');
  Object.keys(testEvents).forEach((eventType, index) => {
    console.log(`  ${index + 1}. ${eventType}`);
  });

  // Get event type from command line or use first one
  const eventType = process.argv[2] || Object.keys(testEvents)[0];

  if (eventType === 'all') {
    // Test all events
    for (const type of Object.keys(testEvents)) {
      await sendTestWebhook(type);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
  } else if (testEvents[eventType]) {
    await sendTestWebhook(eventType);
  } else {
    console.error(`\n❌ Unknown event type: ${eventType}`);
    console.log('\nUsage:');
    console.log('  node scripts/test-webhook.js [event_type]');
    console.log('  node scripts/test-webhook.js all  # Test all events');
    console.log('\nExample:');
    console.log('  node scripts/test-webhook.js customer.subscription.created');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { sendTestWebhook, testEvents };
