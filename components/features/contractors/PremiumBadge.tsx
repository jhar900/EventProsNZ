'use client';

import { Badge } from '@/components/ui/badge';
import { StarIcon } from '@heroicons/react/24/solid';

interface PremiumBadgeProps {
  tier: 'professional' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PremiumBadge({
  tier,
  size = 'md',
  className = '',
}: PremiumBadgeProps) {
  const getBadgeConfig = () => {
    switch (tier) {
      case 'professional':
        return {
          label: 'Professional',
          className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          icon: <StarIcon className="h-3 w-3" />,
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          className:
            'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
          icon: <StarIcon className="h-3 w-3" />,
        };
      default:
        return {
          label: 'Premium',
          className:
            'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          icon: <StarIcon className="h-3 w-3" />,
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      default:
        return 'text-xs px-2.5 py-1';
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge
      className={`${config.className} ${getSizeClasses()} ${className} flex items-center space-x-1 font-medium`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
