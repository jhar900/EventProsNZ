/**
 * Stripe Demo Page
 * Test page for Stripe payment integration
 */

"use client";

import React, { useState, useEffect } from "react";

export default function StripeDemoPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch("/api/stripe/check-config");
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
        console.error("Error checking Stripe configuration:", error);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkConfiguration();
  }, []);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleTestStripeConfig = async () => {
    addResult("Testing Stripe configuration...");
    try {
      const response = await fetch("/api/stripe/check-config");
      const data = await response.json();

      if (data.configured) {
        addResult("✅ Stripe keys are configured and ready to use!");
        addResult("✅ Public key: " + data.publicKeyPreview);
        addResult(
          "✅ Secret key: " + (data.hasSecretKey ? "Configured" : "Missing")
        );
      } else {
        addResult("❌ Stripe keys are NOT configured.");
        addResult(
          "❌ Secret key: " + (data.hasSecretKey ? "Configured" : "Missing")
        );
        addResult(
          "❌ Public key: " + (data.hasPublicKey ? "Configured" : "Missing")
        );
      }
    } catch (error) {
      addResult("❌ Error checking configuration: " + (error as Error).message);
    }
  };

  const handleTestPaymentIntent = async () => {
    addResult("Testing Stripe Payment Intent creation...");
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 2000, // $20.00 in cents
          currency: "nzd",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addResult("✅ Payment Intent created successfully!");
        addResult(
          "✅ Client Secret: " + data.clientSecret?.substring(0, 20) + "..."
        );
        setPaymentStatus("Payment Intent created successfully");
      } else {
        const error = await response.json();
        addResult("❌ Failed to create Payment Intent: " + error.message);
        setPaymentStatus("Failed to create Payment Intent");
      }
    } catch (error) {
      addResult("❌ Error testing Payment Intent: " + (error as Error).message);
      setPaymentStatus("Error testing Payment Intent");
    }
  };

  const handleTestWebhook = async () => {
    addResult("Testing Stripe webhook endpoint...");
    try {
      const response = await fetch("/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_test_123",
              amount: 2000,
              currency: "nzd",
            },
          },
        }),
      });

      if (response.ok) {
        addResult("✅ Webhook endpoint is working!");
        setPaymentStatus("Webhook endpoint working");
      } else {
        addResult("❌ Webhook endpoint failed: " + response.statusText);
        setPaymentStatus("Webhook endpoint failed");
      }
    } catch (error) {
      addResult("❌ Error testing webhook: " + (error as Error).message);
      setPaymentStatus("Error testing webhook");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stripe Payment Integration Demo
          </h1>
          <p className="text-gray-600">
            Test the Stripe payment processing components for Event Pros NZ
          </p>
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isLoading
                  ? "bg-gray-400"
                  : isConfigured
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm">
              Stripe (
              {isLoading
                ? "Checking..."
                : isConfigured
                ? "Configured"
                : "Not Configured"}
              )
            </span>
          </div>
          {!isLoading && isConfigured && (
            <p className="text-sm text-gray-600 mt-2">
              Stripe keys are properly configured and ready to use!
            </p>
          )}
          {!isLoading && !isConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Please set STRIPE_SECRET_KEY and
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variables.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
            <button
              onClick={handleTestStripeConfig}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Check Keys
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Payment Intent</h3>
            <button
              onClick={handleTestPaymentIntent}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Create Payment Intent
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Webhook</h3>
            <button
              onClick={handleTestWebhook}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Test Webhook
            </button>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
            <div className="bg-gray-100 rounded-md p-4">
              <p className="text-sm text-gray-700">{paymentStatus}</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 rounded-md p-4 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {result}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
