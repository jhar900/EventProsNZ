'use client';

import { ViewMode } from '@/types/contractors';
import { Button } from '@/components/ui/button';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  className = '',
}: ViewToggleProps) {
  return (
    <div className={`flex rounded-lg border border-gray-200 p-1 ${className}`}>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="flex items-center space-x-2"
      >
        <Squares2X2Icon className="h-4 w-4" />
        <span>Grid</span>
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center space-x-2"
      >
        <ListBulletIcon className="h-4 w-4" />
        <span>List</span>
      </Button>
    </div>
  );
}
