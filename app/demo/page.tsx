/**
 * External Services Demo Hub
 * Main demo page linking to all external service demos
 */

"use client";

import React from "react";
import Link from "next/link";

export default function DemoPage() {
  const demos = [
    {
      title: "Maps Integration",
      description:
        "Test Mapbox mapping, geocoding, and directions functionality",
      href: "/maps-demo",
      icon: "🗺️",
      status: "Available",
      color: "bg-blue-500",
    },
    {
      title: "Payment Processing",
      description:
        "Test Stripe payment intents, webhooks, and transaction handling",
      href: "/stripe-demo",
      icon: "💳",
      status: "Available",
      color: "bg-green-500",
    },
    {
      title: "Email Services",
      description:
        "Test SendGrid email sending, templates, and webhook handling",
      href: "/sendgrid-demo",
      icon: "📧",
      status: "Available",
      color: "bg-purple-500",
    },
    {
      title: "Analytics Tracking",
      description:
        "Test Google Analytics page views, events, and ecommerce tracking",
      href: "/analytics-demo",
      icon: "📊",
      status: "Available",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            External Services Demo Hub
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Test and validate all external service integrations for Event Pros
            NZ
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Note:</strong> Make sure to set up the required
              environment variables before testing each service. Check the
              individual demo pages for specific configuration requirements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {demos.map((demo, index) => (
            <Link
              key={index}
              href={demo.href}
              className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 ${demo.color} rounded-lg flex items-center justify-center text-2xl mr-4`}
                  >
                    {demo.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      {demo.title}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {demo.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{demo.description}</p>
                <div className="flex items-center text-blue-600 group-hover:text-blue-800">
                  <span className="text-sm font-medium">Test Integration</span>
                  <svg
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Environment Variables Reference */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Required Environment Variables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Maps (Mapbox)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_MAPBOX_TOKEN
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payments (Stripe)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    STRIPE_SECRET_KEY
                  </code>
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email (SendGrid)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    SENDGRID_API_KEY
                  </code>
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    SENDGRID_FROM_EMAIL
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Analytics (Google)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Status Check */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Quick Status Check
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-sm text-gray-600">Maps</div>
              <div className="text-xs text-gray-500">Mapbox</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-sm text-gray-600">Payments</div>
              <div className="text-xs text-gray-500">Stripe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📧</div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="text-xs text-gray-500">SendGrid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-600">Analytics</div>
              <div className="text-xs text-gray-500">Google</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
