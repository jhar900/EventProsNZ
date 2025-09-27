/**
 * SendGrid Demo Page
 * Test page for SendGrid email integration
 */

"use client";

import React, { useState, useEffect } from "react";

export default function SendGridDemoPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [emailStatus, setEmailStatus] = useState<string>("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("test@example.com");

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch("/api/sendgrid/check-config");
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
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

  const handleTestSendGridConfig = async () => {
    addResult("Testing SendGrid configuration...");
    try {
      const response = await fetch("/api/sendgrid/check-config");
      const data = await response.json();

      if (data.configured) {
        addResult("✅ SendGrid API key is configured and ready to use!");
        addResult("✅ From Email: " + data.fromEmail);
        addResult("✅ Configuration test passed!");
        addResult("✅ Message: " + data.message);
      } else {
        addResult("❌ SendGrid API key is NOT configured.");
        addResult("❌ Please set SENDGRID_API_KEY environment variable");
        addResult("❌ Message: " + data.message);
      }
    } catch (error) {
      addResult("❌ Error checking configuration: " + (error as Error).message);
    }
  };

  const handleTestEmailSend = () => {
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!testEmailAddress.trim()) {
      addResult("❌ Please enter a valid email address");
      return;
    }

    addResult(`Testing SendGrid email sending to: ${testEmailAddress}`);
    try {
      const response = await fetch("/api/sendgrid/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmailAddress,
          subject:
            "Test Email from Event Pros NZ - " +
            new Date().toLocaleTimeString(),
          html: `
            <h1>🎉 SendGrid Integration Test</h1>
            <p>This is a test email from the Event Pros NZ SendGrid integration.</p>
            <p><strong>Sent to:</strong> ${testEmailAddress}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Test ID:</strong> ${Math.random()
              .toString(36)
              .substr(2, 9)}</p>
            <hr>
            <p><em>If you received this email, the SendGrid integration is working correctly!</em></p>
          `,
          text: `SendGrid Integration Test - ${new Date().toLocaleString()}\n\nSent to: ${testEmailAddress}\n\nThis is a test email from the Event Pros NZ SendGrid integration.\n\nIf you received this email, the SendGrid integration is working correctly!`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addResult("✅ Email sent successfully!");
        addResult("✅ Message ID: " + data.messageId);
        addResult(`✅ Check ${testEmailAddress} for the test message`);
        setEmailStatus(
          `Email sent successfully to ${testEmailAddress} - Message ID: ${data.messageId}`
        );
        setShowEmailModal(false);
      } else {
        const error = await response.json();
        addResult("❌ Failed to send email: " + error.message);
        setEmailStatus("Failed to send email");
      }
    } catch (error) {
      addResult("❌ Error sending email: " + (error as Error).message);
      setEmailStatus("Error sending email");
    }
  };

  const handleTestTemplateEmail = async () => {
    addResult("Testing SendGrid template email...");
    addResult("ℹ️ Note: This test uses a mock template ID for demonstration");

    try {
      const response = await fetch("/api/sendgrid/send-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "test@example.com",
          templateId: "d-demo-template-id", // Using a demo template ID
          dynamicTemplateData: {
            name: "Test User",
            eventName: "Event Pros NZ Demo",
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toLocaleString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addResult("✅ Template email sent successfully!");
        addResult("✅ Message ID: " + data.messageId);
        addResult(
          "ℹ️ Note: Template emails require valid template IDs in SendGrid"
        );
        setEmailStatus("Template email sent successfully");
      } else {
        const error = await response.json();
        addResult(
          "❌ Failed to send template email: " +
            (error.message || "Unknown error")
        );
        addResult(
          "ℹ️ This is expected - you need to create a template in SendGrid first"
        );
        addResult(
          "ℹ️ Go to SendGrid Dashboard > Email API > Dynamic Templates to create one"
        );
        setEmailStatus(
          "Template email failed (expected - no template created)"
        );
      }
    } catch (error) {
      addResult("❌ Error sending template email: " + (error as Error).message);
      addResult(
        "ℹ️ This is expected - template functionality requires setup in SendGrid"
      );
      setEmailStatus("Error sending template email");
    }
  };

  const handleTestWebhook = async () => {
    addResult("Testing SendGrid webhook endpoint...");
    try {
      const response = await fetch("/api/sendgrid/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "delivered",
          email: "test@example.com",
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      if (response.ok) {
        addResult("✅ Webhook endpoint is working!");
        setEmailStatus("Webhook endpoint working");
      } else {
        addResult("❌ Webhook endpoint failed: " + response.statusText);
        setEmailStatus("Webhook endpoint failed");
      }
    } catch (error) {
      addResult("❌ Error testing webhook: " + (error as Error).message);
      setEmailStatus("Error testing webhook");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SendGrid Email Integration Demo
          </h1>
          <p className="text-gray-600">
            Test the SendGrid email service components for Event Pros NZ
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
              SendGrid (
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
              SendGrid API key is properly configured and ready to use!
            </p>
          )}
          {!isLoading && !isConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Please set SENDGRID_API_KEY environment variable to test email
              functionality.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
            <button
              onClick={handleTestSendGridConfig}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Check API Key
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Email Send</h3>
            <button
              onClick={handleTestEmailSend}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Send Test Email
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Template</h3>
            <button
              onClick={handleTestTemplateEmail}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Send Template
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Webhook</h3>
            <button
              onClick={handleTestWebhook}
              className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Test Webhook
            </button>
          </div>
        </div>

        {/* Email Status */}
        {emailStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Email Status</h2>
            <div className="bg-gray-100 rounded-md p-4">
              <p className="text-sm text-gray-700">{emailStatus}</p>
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

        {/* Email Address Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Send Test Email</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address:
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter email address to test"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!testEmailAddress.trim()}
                >
                  Send Email
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                The test email will be sent to this address with a timestamp and
                test ID.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
