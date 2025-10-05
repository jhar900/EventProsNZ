import { Metadata } from 'next';
import { PrioritySupport } from '@/components/features/premium/PrioritySupport';

export const metadata: Metadata = {
  title: 'Priority Support | EventPros NZ',
  description: 'Get help when you need it with priority support.',
};

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Priority Support</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get help when you need it with priority support based on your
          subscription tier.
        </p>
      </div>

      <PrioritySupport />
    </div>
  );
}
