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
  private supabase;

  constructor(supabaseClient?: any) {
    // Allow passing in a Supabase client, otherwise use default
    this.supabase = supabaseClient || createClient();
  }

  async getProfileCompletionStatus(
    userId: string
  ): Promise<ProfileCompletionStatus> {
    try {
      // Fetch all data in parallel for better performance
      const [
        profileResult,
        businessProfileResult,
        userResult,
        onboardingResult,
      ] = await Promise.all([
        // Get user profile - only select needed fields
        this.supabase
          .from('profiles')
          .select(
            'first_name, last_name, phone, address, avatar_url, preferences'
          )
          .eq('user_id', userId)
          .single(),
        // Get business profile if exists - only select needed fields
        this.supabase
          .from('business_profiles')
          .select('company_name, location, description, service_categories')
          .eq('user_id', userId)
          .maybeSingle(), // Use maybeSingle to avoid error if doesn't exist
        // Get user data - only select needed fields
        this.supabase
          .from('users')
          .select('email, role')
          .eq('id', userId)
          .single(),
        // Get contractor onboarding status if exists
        this.supabase
          .from('contractor_onboarding_status')
          .select('is_submitted')
          .eq('user_id', userId)
          .maybeSingle(), // Use maybeSingle to avoid error if doesn't exist
      ]);

      const profile = profileResult.data;
      const profileError = profileResult.error;
      const businessProfile = businessProfileResult.data;
      const user = userResult.data;
      const userError = userResult.error;
      const onboardingStatus = onboardingResult.data;

      if (profileError) {
        throw new Error('Failed to fetch profile');
      }

      if (userError) {
        throw new Error('Failed to fetch user data');
      }

      // For contractors, check if onboarding is submitted
      // If submitted, mark as complete regardless of field completion
      if (user.role === 'contractor' && onboardingStatus?.is_submitted) {
        // Onboarding is submitted, mark as complete
        return {
          isComplete: true,
          completionPercentage: 100,
          missingFields: [],
          requirements: {
            personalInfo: true,
            contactInfo: true,
            businessInfo: true,
            profilePhoto: true,
          },
        };
      }

      // For event managers, check if onboarding is completed
      // If completed, mark as complete regardless of field completion
      if (user.role === 'event_manager') {
        const onboardingCompleted = (profile?.preferences as any)
          ?.onboarding_completed;
        if (onboardingCompleted) {
          // Onboarding is completed, mark as complete
          return {
            isComplete: true,
            completionPercentage: 100,
            missingFields: [],
            requirements: {
              personalInfo: true,
              contactInfo: true,
              businessInfo: true,
              profilePhoto: true,
            },
          };
        }
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
      throw error;
    }
  }
}
