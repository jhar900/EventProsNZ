import { createClient } from '@/lib/supabase/server';
import { Profile, BusinessProfile } from '@/lib/supabase/types';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requirements: {
    personalInfo: boolean;
    contactInfo: boolean;
    businessInfo: boolean;
    profilePhoto: boolean;
  };
}

export interface ProfileCompletionRequirements {
  personalInfo: {
    first_name: boolean;
    last_name: boolean;
    phone: boolean;
    address: boolean;
  };
  contactInfo: {
    email: boolean;
    phone: boolean;
    address: boolean;
  };
  businessInfo: {
    company_name: boolean;
    business_address: boolean;
    description: boolean;
    service_areas: boolean;
  };
  profilePhoto: boolean;
}

export class ProfileCompletionService {
  private supabase = createClient();

  async getProfileCompletionStatus(
    userId: string
  ): Promise<ProfileCompletionStatus> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch profile');
      }

      // Get business profile if exists
      const { data: businessProfile } = await this.supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get user data
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, role')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user data');
      }

      // Check requirements based on user role
      const requirements = this.checkRequirements(
        profile,
        businessProfile,
        user
      );

      // Calculate completion percentage
      const totalFields = this.getTotalFields(user.role);
      const completedFields = this.getCompletedFields(requirements);
      const completionPercentage = Math.round(
        (completedFields / totalFields) * 100
      );

      // Get missing fields
      const missingFields = this.getMissingFields(requirements, user.role);

      return {
        isComplete: completionPercentage === 100,
        completionPercentage,
        missingFields,
        requirements: {
          personalInfo:
            requirements.personalInfo.first_name &&
            requirements.personalInfo.last_name,
          contactInfo:
            requirements.contactInfo.email &&
            requirements.contactInfo.phone &&
            requirements.contactInfo.address,
          businessInfo:
            user.role === 'event_manager'
              ? businessProfile
                ? requirements.businessInfo.company_name &&
                  requirements.businessInfo.business_address &&
                  requirements.businessInfo.description &&
                  requirements.businessInfo.service_areas
                : true
              : requirements.businessInfo.company_name &&
                requirements.businessInfo.business_address &&
                requirements.businessInfo.description &&
                requirements.businessInfo.service_areas,
          profilePhoto: requirements.profilePhoto,
        },
      };
    } catch (error) {
      console.error('Profile completion check error:', error);
      throw error;
    }
  }

  private checkRequirements(
    profile: Profile | null,
    businessProfile: BusinessProfile | null,
    user: { email: string; role: string }
  ): ProfileCompletionRequirements {
    return {
      personalInfo: {
        first_name: !!profile?.first_name,
        last_name: !!profile?.last_name,
        phone: !!profile?.phone,
        address: !!profile?.address,
      },
      contactInfo: {
        email: !!user.email,
        phone: !!profile?.phone,
        address: !!profile?.address,
      },
      businessInfo: {
        company_name: !!businessProfile?.company_name,
        business_address: !!businessProfile?.location,
        description: !!businessProfile?.description,
        service_areas: !!(
          businessProfile?.service_categories &&
          businessProfile.service_categories.length > 0
        ),
      },
      profilePhoto: !!profile?.avatar_url,
    };
  }

  private getTotalFields(role: string): number {
    const baseFields = 6; // first_name, last_name, phone, address, email, profile_photo
    const businessFields = role === 'event_manager' ? 0 : 4; // company_name, business_address, description, service_areas
    return baseFields + businessFields;
  }

  private getCompletedFields(
    requirements: ProfileCompletionRequirements
  ): number {
    let completed = 0;

    // Personal info
    if (requirements.personalInfo.first_name) completed++;
    if (requirements.personalInfo.last_name) completed++;
    if (requirements.personalInfo.phone) completed++;
    if (requirements.personalInfo.address) completed++;

    // Contact info (email is always present for authenticated users)
    completed++; // email
    if (requirements.contactInfo.phone) completed++;
    if (requirements.contactInfo.address) completed++;

    // Profile photo
    if (requirements.profilePhoto) completed++;

    // Business info (only for contractors or event managers with business profiles)
    if (requirements.businessInfo.company_name) completed++;
    if (requirements.businessInfo.business_address) completed++;
    if (requirements.businessInfo.description) completed++;
    if (requirements.businessInfo.service_areas) completed++;

    return completed;
  }

  private getMissingFields(
    requirements: ProfileCompletionRequirements,
    role: string
  ): string[] {
    const missing: string[] = [];

    if (!requirements.personalInfo.first_name) missing.push('First name');
    if (!requirements.personalInfo.last_name) missing.push('Last name');
    if (!requirements.personalInfo.phone) missing.push('Phone number');
    if (!requirements.personalInfo.address) missing.push('Address');
    if (!requirements.profilePhoto) missing.push('Profile photo');

    // Business fields only required for contractors or event managers with business profiles
    if (
      role === 'contractor' ||
      (role === 'event_manager' && requirements.businessInfo.company_name)
    ) {
      if (!requirements.businessInfo.company_name) missing.push('Company name');
      if (!requirements.businessInfo.business_address)
        missing.push('Business address');
      if (!requirements.businessInfo.description)
        missing.push('Business description');
      if (!requirements.businessInfo.service_areas)
        missing.push('Service areas');
    }

    return missing;
  }

  async updateProfileCompletionStatus(userId: string): Promise<void> {
    try {
      const status = await this.getProfileCompletionStatus(userId);

      // Update profile with completion status
      await this.supabase
        .from('profiles')
        .update({
          preferences: {
            profile_completion: {
              is_complete: status.isComplete,
              completion_percentage: status.completionPercentage,
              last_updated: new Date().toISOString(),
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // If profile is complete and user is event manager, auto-verify
      if (status.isComplete) {
        const { data: user } = await this.supabase
          .from('users')
          .select('role, is_verified')
          .eq('id', userId)
          .single();

        if (user?.role === 'event_manager' && !user.is_verified) {
          await this.supabase
            .from('users')
            .update({
              is_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }
    } catch (error) {
      console.error('Profile completion update error:', error);
      throw error;
    }
  }
}
