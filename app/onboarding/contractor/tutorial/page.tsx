import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContractorTutorialPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to EventProsNZ!
          </h1>
          <p className="text-lg text-gray-600">
            Learn how to make the most of your contractor profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Your Profile
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Fill out all sections of your profile to increase your visibility
              to event managers.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Add professional photos to your portfolio</li>
              <li>• Include detailed service descriptions</li>
              <li>• Set competitive pricing ranges</li>
              <li>• Specify your service areas</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Respond to Enquiries
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              When event managers contact you, respond promptly and
              professionally.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Check your dashboard regularly</li>
              <li>• Reply within 24 hours</li>
              <li>• Provide detailed quotes</li>
              <li>• Ask clarifying questions</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Build Your Reputation
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Collect reviews and testimonials to build trust with potential
              clients.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Deliver excellent service</li>
              <li>• Ask for reviews after events</li>
              <li>• Update your portfolio regularly</li>
              <li>• Maintain professional communication</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 font-semibold">4</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Your Availability
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Keep your availability up to date to avoid conflicts and missed
              opportunities.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Update your calendar regularly</li>
              <li>• Set realistic response times</li>
              <li>• Block out unavailable dates</li>
              <li>• Communicate schedule changes</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Pro Tips for Success
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-2">Profile Optimization:</p>
              <ul className="space-y-1">
                <li>• Use high-quality, professional photos</li>
                <li>• Write detailed, engaging descriptions</li>
                <li>• Include specific pricing information</li>
                <li>• Highlight your unique selling points</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Client Communication:</p>
              <ul className="space-y-1">
                <li>• Be prompt and professional</li>
                <li>• Ask detailed questions about their needs</li>
                <li>• Provide clear, itemized quotes</li>
                <li>• Follow up after events</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="space-y-4">
            <p className="text-gray-600">
              Ready to start your journey as a contractor?
            </p>
            <div className="space-x-4">
              <Link href="/onboarding/contractor">
                <Button>Complete Your Profile</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a
              href="mailto:support@eventprosnz.com"
              className="text-blue-600 hover:text-blue-500"
            >
              support@eventprosnz.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
