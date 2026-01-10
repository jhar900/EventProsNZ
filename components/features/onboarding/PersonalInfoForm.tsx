'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { personalInfoSchema } from '@/lib/onboarding/validation';
import { AddressAutocomplete } from './AddressAutocomplete';

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  data: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    linkedin_url?: string;
    website_url?: string;
  };
  onComplete: (data: PersonalInfoFormData) => void;
  isLoading: boolean;
}

export function PersonalInfoForm({
  data,
  onComplete,
  isLoading,
}: PersonalInfoFormProps) {
  const [address, setAddress] = useState(data.address);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  });

  // Update form when data prop changes (e.g., when navigating back)
  useEffect(() => {
    reset(data);
    setAddress(data.address);
  }, [data, reset]);

  const onSubmit = (formData: PersonalInfoFormData) => {
    onComplete({ ...formData, address });
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setValue('address', newAddress, { shouldValidate: true });
  };

  // Handle phone number input - only allow numbers, brackets, +, and spaces
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right arrows
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'Home',
        'End',
        'ArrowLeft',
        'ArrowRight',
      ].includes(e.key)
    ) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }

    // Allow: numbers, brackets, +, and space
    const allowedChars = /[0-9()+ ]/;
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handle paste - filter out letters
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any letters (keep only numbers, brackets, +, spaces, and hyphens)
    const filtered = value.replace(/[^0-9()+ -]/g, '');
    if (filtered !== value) {
      setValue('phone', filtered, { shouldValidate: true });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personal Information
        </h2>
        <p className="text-gray-600">
          Let&apos;s start with your basic information
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First Name *
            </label>
            <input
              {...register('first_name')}
              type="text"
              id="first_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last Name *
            </label>
            <input
              {...register('last_name')}
              type="text"
              id="last_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number *
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Enter your phone number"
            onKeyDown={handlePhoneKeyDown}
            onInput={handlePhoneInput}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Address *
          </label>
          <AddressAutocomplete
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter your address"
            error={errors.address?.message}
          />
        </div>

        <div>
          <label
            htmlFor="linkedin_url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            LinkedIn Profile (Optional)
          </label>
          <input
            {...register('linkedin_url')}
            type="url"
            id="linkedin_url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="https://linkedin.com/in/yourprofile"
          />
          {errors.linkedin_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.linkedin_url.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="website_url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Personal Website (Optional)
          </label>
          <input
            {...register('website_url')}
            type="url"
            id="website_url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="https://yourwebsite.com"
          />
          {errors.website_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.website_url.message}
            </p>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
