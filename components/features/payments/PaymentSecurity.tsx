/**
 * Payment Security Component
 * Displays payment security indicators and compliance information
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  FileCheck,
} from 'lucide-react';

interface PaymentSecurityProps {
  showDetails?: boolean;
}

export function PaymentSecurity({ showDetails = false }: PaymentSecurityProps) {
  const securityFeatures = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'PCI DSS Compliant',
      description:
        'We meet the highest security standards for payment processing',
      status: 'active',
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'End-to-End Encryption',
      description: 'All payment data is encrypted in transit and at rest',
      status: 'active',
    },
    {
      icon: <Server className="h-5 w-5" />,
      title: 'Secure Infrastructure',
      description: 'Hosted on enterprise-grade secure servers',
      status: 'active',
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: 'Regular Security Audits',
      description: 'Our systems undergo regular security assessments',
      status: 'active',
    },
  ];

  const complianceStandards = [
    'PCI DSS Level 1',
    'SOC 2 Type II',
    'ISO 27001',
    'GDPR Compliant',
    'New Zealand Privacy Act 2020',
  ];

  const dataProtection = [
    'Card details are never stored on our servers',
    'Payment processing handled by Stripe',
    'All communications use TLS 1.3 encryption',
    'Regular penetration testing',
    '24/7 security monitoring',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Security
        </h2>
        <p className="text-gray-600">
          Your payment information is protected by industry-leading security
          measures.
        </p>
      </div>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border rounded-lg"
              >
                <div className="text-green-600 mt-0.5">{feature.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{feature.title}</h3>
                    <Badge className="bg-green-100 text-green-800">
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Compliance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{standard}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Data Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataProtection.map((protection, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <span className="text-sm">{protection}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800 mb-2">
                Your Security is Our Priority
              </h3>
              <p className="text-sm text-green-700">
                We use industry-leading security measures to protect your
                payment information. All transactions are processed securely
                through Stripe, a PCI DSS Level 1 certified payment processor
                trusted by millions of businesses worldwide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Security Information */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Security Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Fraud Protection</h4>
              <p className="text-sm text-gray-600">
                Our payment system includes advanced fraud detection algorithms
                that monitor transactions for suspicious activity and protect
                against unauthorized charges.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Secure Communication</h4>
              <p className="text-sm text-gray-600">
                All communication between your browser and our servers is
                encrypted using TLS 1.3, the latest and most secure encryption
                protocol.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Regular Updates</h4>
              <p className="text-sm text-gray-600">
                We regularly update our security measures and infrastructure to
                protect against the latest threats and vulnerabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            If you have any questions about our security measures or notice any
            suspicious activity, please contact our security team.
          </p>
          <div className="flex gap-3">
            <a
              href="mailto:security@eventprosnz.com"
              className="text-sm text-blue-600 hover:underline"
            >
              security@eventprosnz.com
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="/security"
              className="text-sm text-blue-600 hover:underline"
            >
              Security Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
