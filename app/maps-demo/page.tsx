/**
 * Maps Demo Page
 * Test page for Mapbox integration
 */

"use client";

import React, { useState, useEffect } from "react";

export default function MapsDemoPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch("/api/maps/check-config");
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
        console.error("Error checking configuration:", error);
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

  const handleTestMapbox = () => {
    addResult("Testing Mapbox integration...");
    if (isConfigured) {
      addResult("✅ Mapbox token is configured and ready to use!");
    } else {
      addResult("❌ Mapbox token is NOT configured.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maps Integration Demo
          </h1>
          <p className="text-gray-600">
            Test the Mapbox integration components for Event Pros NZ
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
              Mapbox (
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
              Mapbox token is properly configured and ready to use!
            </p>
          )}
          {!isLoading && !isConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable to test
              map functionality.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Mapbox Token</h3>
            <button
              onClick={handleTestMapbox}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Run Test
            </button>
          </div>
        </div>

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
