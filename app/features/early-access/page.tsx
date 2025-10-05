import { Metadata } from 'next';
import { EarlyAccess } from '@/components/features/premium/EarlyAccess';

export const metadata: Metadata = {
  title: 'Early Access | EventPros NZ',
  description:
    "Get early access to new platform features before they're released to everyone.",
};

export default function EarlyAccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Early Access</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Be the first to try new platform features and help shape the future of
          EventPros NZ.
        </p>
      </div>

      <EarlyAccess />
    </div>
  );
}
