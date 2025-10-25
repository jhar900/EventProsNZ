'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Shield,
  Users,
  Lightbulb,
  Award,
  Handshake,
} from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Passion for Excellence',
    description:
      'We are passionate about delivering exceptional event experiences that exceed expectations and create lasting memories.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: Shield,
    title: 'Trust & Reliability',
    description:
      'Every contractor on our platform is thoroughly verified, ensuring you can trust the professionals you work with.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Users,
    title: 'Community First',
    description:
      'We believe in building a strong, supportive community of event professionals across New Zealand.',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We continuously innovate to provide cutting-edge tools and features that make event planning easier and more efficient.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: Award,
    title: 'Quality Standards',
    description:
      'We maintain the highest standards in everything we do, from contractor verification to customer service.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Handshake,
    title: 'Partnership',
    description:
      'We work as partners with both event managers and contractors, fostering mutual success and growth.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
];

export default function CompanyValuesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These core values guide everything we do and shape how we serve our
            community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 ${value.bgColor} rounded-full flex items-center justify-center mb-4`}
                  >
                    <IconComponent className={`w-8 h-8 ${value.color}`} />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Our Commitment to New Zealand
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-3xl">
                We are committed to supporting New Zealand&apos;s event industry
                by providing a platform that celebrates local talent, fosters
                economic growth, and maintains the high standards that New
                Zealand is known for worldwide.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    100%
                  </div>
                  <div className="text-sm text-gray-600">New Zealand Based</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600">Local Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    NZ$
                  </div>
                  <div className="text-sm text-gray-600">Local Currency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
