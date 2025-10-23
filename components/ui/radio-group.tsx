import React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  id: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid gap-2', className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // Check if this is a RadioGroupItem
            if (child.type === RadioGroupItem) {
              const isChecked = value === child.props.value;
              return React.cloneElement(child, {
                checked: isChecked,
                onChange: () => onValueChange?.(child.props.value),
              });
            }
            // If it's not a RadioGroupItem, recursively process its children
            if (child.props.children) {
              return React.cloneElement(child, {
                children: React.Children.map(
                  child.props.children,
                  grandChild => {
                    if (
                      React.isValidElement(grandChild) &&
                      grandChild.type === RadioGroupItem
                    ) {
                      const isChecked = value === grandChild.props.value;
                      return React.cloneElement(grandChild, {
                        checked: isChecked,
                        onChange: () => onValueChange?.(grandChild.props.value),
                      });
                    }
                    return grandChild;
                  }
                ),
              });
            }
          }
          return child;
        })}
      </div>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, checked, onChange, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        id={id}
        value={value}
        checked={checked}
        onChange={onChange}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
