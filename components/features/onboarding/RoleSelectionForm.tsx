'use client';

import { useState } from 'react';

interface RoleSelectionFormProps {
  data: 'personal' | 'business' | null;
  onComplete: (roleType: 'personal' | 'business') => void;
  isLoading: boolean;
}

export function RoleSelectionForm({
  data,
  onComplete,
  isLoading,
}: RoleSelectionFormProps) {
  const [selectedRole, setSelectedRole] = useState<
    'personal' | 'business' | null
  >(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      onComplete(selectedRole);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Are you an event manager for personal events or for a business?
        </h2>
        <p className="text-gray-600">
          This helps us customize your experience on the platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === 'personal'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('personal')}
          >
            <div className="flex items-start">
              <input
                type="radio"
                name="role_type"
                value="personal"
                checked={selectedRole === 'personal'}
                onChange={() => setSelectedRole('personal')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Personal Events
                </h3>
                <p className="text-gray-600 mt-1">
                  I manage events for myself, family, or friends (birthdays,
                  weddings, parties, etc.)
                </p>
                <div className="mt-3 text-sm text-gray-500">
                  <ul className="list-disc list-inside space-y-1">
                    <li>No business information required</li>
                    <li>Simplified profile setup</li>
                    <li>Access to all platform features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === 'business'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('business')}
          >
            <div className="flex items-start">
              <input
                type="radio"
                name="role_type"
                value="business"
                checked={selectedRole === 'business'}
                onChange={() => setSelectedRole('business')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Business Events
                </h3>
                <p className="text-gray-600 mt-1">
                  I manage events as part of a business or professional service
                </p>
                <div className="mt-3 text-sm text-gray-500">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Business information required</li>
                    <li>Company profile setup</li>
                    <li>Enhanced visibility to contractors</li>
                    <li>Business verification process</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={!selectedRole || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
