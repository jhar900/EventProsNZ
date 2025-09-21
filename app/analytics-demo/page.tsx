/**
 * Analytics Demo Page
 * Test page for Google Analytics integration
 */

"use client";

import React, { useState, useEffect } from "react";

export default function AnalyticsDemoPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [analyticsStatus, setAnalyticsStatus] = useState<string>("");

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        // Check if Google Analytics ID is configured
        const hasAnalyticsId = !!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
        setIsConfigured(hasAnalyticsId);
      } catch (error) {
        console.error("Error checking Analytics configuration:", error);
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

  const handleTestAnalyticsConfig = () => {
    addResult("Testing Google Analytics configuration...");
    if (isConfigured) {
      addResult("✅ Google Analytics ID is configured and ready to use!");
      addResult(
        "✅ Analytics ID: " + process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
      );
    } else {
      addResult("❌ Google Analytics ID is NOT configured.");
      addResult(
        "❌ Please set NEXT_PUBLIC_GOOGLE_ANALYTICS_ID environment variable"
      );
    }
  };

  const handleTestPageView = () => {
    addResult("Testing Google Analytics page view tracking...");
    try {
      // Simulate page view tracking
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag(
          "config",
          process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
          {
            page_title: "Analytics Demo Page",
            page_location: window.location.href,
          }
        );
        addResult("✅ Page view tracked successfully!");
        setAnalyticsStatus("Page view tracked");
      } else {
        addResult("❌ Google Analytics gtag not loaded");
        setAnalyticsStatus("Google Analytics not loaded");
      }
    } catch (error) {
      addResult("❌ Error tracking page view: " + (error as Error).message);
      setAnalyticsStatus("Error tracking page view");
    }
  };

  const handleTestCustomEvent = () => {
    addResult("Testing Google Analytics custom event tracking...");
    try {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "demo_button_click", {
          event_category: "Demo",
          event_label: "Analytics Demo Page",
          value: 1,
        });
        addResult("✅ Custom event tracked successfully!");
        setAnalyticsStatus("Custom event tracked");
      } else {
        addResult("❌ Google Analytics gtag not loaded");
        setAnalyticsStatus("Google Analytics not loaded");
      }
    } catch (error) {
      addResult("❌ Error tracking custom event: " + (error as Error).message);
      setAnalyticsStatus("Error tracking custom event");
    }
  };

  const handleTestEcommerceEvent = () => {
    addResult("Testing Google Analytics ecommerce event tracking...");
    try {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "purchase", {
          transaction_id: "demo-transaction-123",
          value: 25.0,
          currency: "NZD",
          items: [
            {
              item_id: "demo-item-1",
              item_name: "Demo Event Service",
              category: "Event Services",
              quantity: 1,
              price: 25.0,
            },
          ],
        });
        addResult("✅ Ecommerce event tracked successfully!");
        setAnalyticsStatus("Ecommerce event tracked");
      } else {
        addResult("❌ Google Analytics gtag not loaded");
        setAnalyticsStatus("Google Analytics not loaded");
      }
    } catch (error) {
      addResult(
        "❌ Error tracking ecommerce event: " + (error as Error).message
      );
      setAnalyticsStatus("Error tracking ecommerce event");
    }
  };

  const handleTestConversionEvent = () => {
    addResult("Testing Google Analytics conversion event tracking...");
    try {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "conversion", {
          send_to:
            process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID + "/demo-conversion",
          value: 1.0,
          currency: "NZD",
        });
        addResult("✅ Conversion event tracked successfully!");
        setAnalyticsStatus("Conversion event tracked");
      } else {
        addResult("❌ Google Analytics gtag not loaded");
        setAnalyticsStatus("Google Analytics not loaded");
      }
    } catch (error) {
      addResult(
        "❌ Error tracking conversion event: " + (error as Error).message
      );
      setAnalyticsStatus("Error tracking conversion event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Analytics Integration Demo
          </h1>
          <p className="text-gray-600">
            Test the Google Analytics tracking components for Event Pros NZ
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
              Google Analytics (
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
              Google Analytics ID is properly configured and ready to use!
            </p>
          )}
          {!isLoading && !isConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Please set NEXT_PUBLIC_GOOGLE_ANALYTICS_ID environment variable to
              test analytics functionality.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
            <button
              onClick={handleTestAnalyticsConfig}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Check Analytics ID
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Page View</h3>
            <button
              onClick={handleTestPageView}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Track Page View
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Custom Event</h3>
            <button
              onClick={handleTestCustomEvent}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Track Custom Event
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Ecommerce</h3>
            <button
              onClick={handleTestEcommerceEvent}
              className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Track Purchase
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Conversion</h3>
            <button
              onClick={handleTestConversionEvent}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Track Conversion
            </button>
          </div>
        </div>

        {/* Analytics Status */}
        {analyticsStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Analytics Status</h2>
            <div className="bg-gray-100 rounded-md p-4">
              <p className="text-sm text-gray-700">{analyticsStatus}</p>
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

        {/* Analytics Debug Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="bg-gray-100 rounded-md p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Analytics ID:</strong>{" "}
              {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "Not set"}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>gtag Available:</strong>{" "}
              {typeof window !== "undefined" && (window as any).gtag
                ? "Yes"
                : "No"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Environment:</strong>{" "}
              {process.env.NODE_ENV || "development"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
