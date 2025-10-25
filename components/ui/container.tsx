import * as React from 'react';
import { cn } from '@/lib/utils';

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('container mx-auto px-4 sm:px-6 lg:px-8', className)}
    {...props}
  />
));
Container.displayName = 'Container';

export { Container };
