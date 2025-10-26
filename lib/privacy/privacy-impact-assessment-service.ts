import { createClient } from '@/lib/supabase/server';

export interface PrivacyImpactAssessment {
  id: string;
  title: string;
  description: string;
  data_types: string[];
  processing_purposes: string[];
  data_subjects: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  mitigation_measures: string[];
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
  assessed_by: string;
  approved_by?: string;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  questions: AssessmentQuestion[];
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  question_type: 'text' | 'multiple_choice' | 'scale' | 'boolean';
  options?: string[];
  required: boolean;
  weight: number;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  response: string | number | boolean;
  created_at: Date;
}

export interface AssessmentReport {
  assessment_id: string;
  total_score: number;
  risk_score: number;
  compliance_score: number;
  recommendations: string[];
  next_review_date: Date;
}

export class PrivacyImpactAssessmentService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  static create(supabaseClient?: any): PrivacyImpactAssessmentService {
    return new PrivacyImpactAssessmentService(supabaseClient);
  }

  /**
   * Create privacy impact assessment
   */
  async createAssessment(
    assessmentData: Omit<
      PrivacyImpactAssessment,
      'id' | 'created_at' | 'updated_at'
    >
  ): Promise<{
    success: boolean;
    data?: PrivacyImpactAssessment;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_impact_assessments')
        .insert({
          ...assessmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create privacy impact assessment: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating privacy impact assessment:', error);
      return {
        success: false,
        error: 'Failed to create privacy impact assessment',
      };
    }
  }

  /**
   * Get privacy impact assessments
   */
  async getAssessments(
    filters: { status?: string; risk_level?: string; assessed_by?: string } = {}
  ): Promise<{
    success: boolean;
    data?: PrivacyImpactAssessment[];
    error?: string;
  }> {
    try {
      let query = this.supabase.from('privacy_impact_assessments').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      if (filters.assessed_by) {
        query = query.eq('assessed_by', filters.assessed_by);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(
          `Failed to get privacy impact assessments: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting privacy impact assessments:', error);
      return {
        success: false,
        error: 'Failed to get privacy impact assessments',
      };
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessmentById(
    assessmentId: string
  ): Promise<{
    success: boolean;
    data?: PrivacyImpactAssessment;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_impact_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) {
        throw new Error(
          `Failed to get privacy impact assessment: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting privacy impact assessment:', error);
      return {
        success: false,
        error: 'Failed to get privacy impact assessment',
      };
    }
  }

  /**
   * Update privacy impact assessment
   */
  async updateAssessment(
    assessmentId: string,
    updates: Partial<PrivacyImpactAssessment>
  ): Promise<{
    success: boolean;
    data?: PrivacyImpactAssessment;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_impact_assessments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to update privacy impact assessment: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating privacy impact assessment:', error);
      return {
        success: false,
        error: 'Failed to update privacy impact assessment',
      };
    }
  }

  /**
   * Create assessment template
   */
  async createAssessmentTemplate(
    templateData: Omit<AssessmentTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: AssessmentTemplate; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('assessment_templates')
        .insert({
          ...templateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to create assessment template: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating assessment template:', error);
      return { success: false, error: 'Failed to create assessment template' };
    }
  }

  /**
   * Get assessment templates
   */
  async getAssessmentTemplates(
    filters: { is_active?: boolean } = {}
  ): Promise<{
    success: boolean;
    data?: AssessmentTemplate[];
    error?: string;
  }> {
    try {
      let query = this.supabase.from('assessment_templates').select('*');

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get assessment templates: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting assessment templates:', error);
      return { success: false, error: 'Failed to get assessment templates' };
    }
  }

  /**
   * Submit assessment response
   */
  async submitAssessmentResponse(
    assessmentId: string,
    responses: Array<{
      question_id: string;
      response: string | number | boolean;
    }>
  ): Promise<{
    success: boolean;
    data?: AssessmentResponse[];
    error?: string;
  }> {
    try {
      const responseData = responses.map(response => ({
        assessment_id: assessmentId,
        question_id: response.question_id,
        response: response.response,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await this.supabase
        .from('assessment_responses')
        .insert(responseData)
        .select('*');

      if (error) {
        throw new Error(
          `Failed to submit assessment response: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error submitting assessment response:', error);
      return { success: false, error: 'Failed to submit assessment response' };
    }
  }

  /**
   * Get assessment responses
   */
  async getAssessmentResponses(
    assessmentId: string
  ): Promise<{
    success: boolean;
    data?: AssessmentResponse[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (error) {
        throw new Error(`Failed to get assessment responses: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting assessment responses:', error);
      return { success: false, error: 'Failed to get assessment responses' };
    }
  }

  /**
   * Generate assessment report
   */
  async generateAssessmentReport(
    assessmentId: string
  ): Promise<{ success: boolean; data?: AssessmentReport; error?: string }> {
    try {
      const [assessment, responses] = await Promise.all([
        this.getAssessmentById(assessmentId),
        this.getAssessmentResponses(assessmentId),
      ]);

      if (!assessment.success || !responses.success) {
        return { success: false, error: 'Failed to get assessment data' };
      }

      const report: AssessmentReport = {
        assessment_id: assessmentId,
        total_score: 0,
        risk_score: 0,
        compliance_score: 0,
        recommendations: [],
        next_review_date: new Date(),
      };

      // Calculate scores based on responses
      if (responses.data && responses.data.length > 0) {
        const totalScore = responses.data.reduce((sum, response) => {
          if (typeof response.response === 'number') {
            return sum + response.response;
          }
          return sum;
        }, 0);

        report.total_score = totalScore;
        report.risk_score = this.calculateRiskScore(responses.data);
        report.compliance_score = this.calculateComplianceScore(responses.data);
        report.recommendations = this.generateRecommendations(responses.data);
      }

      // Set next review date (1 year from now)
      report.next_review_date.setFullYear(
        report.next_review_date.getFullYear() + 1
      );

      return { success: true, data: report };
    } catch (error) {
      console.error('Error generating assessment report:', error);
      return { success: false, error: 'Failed to generate assessment report' };
    }
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(responses: AssessmentResponse[]): number {
    // Simple risk calculation based on response values
    const riskResponses = responses.filter(
      r => typeof r.response === 'number' && r.response > 3
    );

    return Math.round((riskResponses.length / responses.length) * 100);
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(responses: AssessmentResponse[]): number {
    // Simple compliance calculation
    const compliantResponses = responses.filter(
      r => typeof r.response === 'boolean' && r.response === true
    );

    return Math.round((compliantResponses.length / responses.length) * 100);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(responses: AssessmentResponse[]): string[] {
    const recommendations: string[] = [];

    // Analyze responses and generate recommendations
    const highRiskResponses = responses.filter(
      r => typeof r.response === 'number' && r.response > 3
    );

    if (highRiskResponses.length > 0) {
      recommendations.push(
        'Implement additional security measures for high-risk data processing'
      );
    }

    const lowComplianceResponses = responses.filter(
      r => typeof r.response === 'boolean' && r.response === false
    );

    if (lowComplianceResponses.length > 0) {
      recommendations.push(
        'Review and update data processing procedures to improve compliance'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Continue current privacy practices and regular monitoring'
      );
    }

    return recommendations;
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data: assessments, error } = await this.supabase
        .from('privacy_impact_assessments')
        .select('*');

      if (error) {
        throw new Error(`Failed to get assessment analytics: ${error.message}`);
      }

      const analytics = {
        total_assessments: assessments?.length || 0,
        by_status:
          assessments?.reduce((acc: any, assessment: any) => {
            acc[assessment.status] = (acc[assessment.status] || 0) + 1;
            return acc;
          }, {}) || {},
        by_risk_level:
          assessments?.reduce((acc: any, assessment: any) => {
            acc[assessment.risk_level] = (acc[assessment.risk_level] || 0) + 1;
            return acc;
          }, {}) || {},
        by_assessor:
          assessments?.reduce((acc: any, assessment: any) => {
            acc[assessment.assessed_by] =
              (acc[assessment.assessed_by] || 0) + 1;
            return acc;
          }, {}) || {},
        recent_assessments: assessments?.slice(0, 10) || [],
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting assessment analytics:', error);
      return { success: false, error: 'Failed to get assessment analytics' };
    }
  }

  /**
   * Monitor assessment compliance
   */
  async monitorAssessmentCompliance(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [assessments, analytics] = await Promise.all([
        this.getAssessments(),
        this.getAssessmentAnalytics(),
      ]);

      if (!assessments.success || !analytics.success) {
        return { success: false, error: 'Failed to get assessment data' };
      }

      const compliance = {
        total_assessments: analytics.data?.total_assessments || 0,
        approved_assessments: analytics.data?.by_status?.approved || 0,
        pending_assessments: analytics.data?.by_status?.in_review || 0,
        high_risk_assessments: analytics.data?.by_risk_level?.high || 0,
        critical_risk_assessments: analytics.data?.by_risk_level?.critical || 0,
        compliance_score: this.calculateOverallComplianceScore(analytics.data),
      };

      return { success: true, data: compliance };
    } catch (error) {
      console.error('Error monitoring assessment compliance:', error);
      return {
        success: false,
        error: 'Failed to monitor assessment compliance',
      };
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallComplianceScore(analytics: any): number {
    const total = analytics.total_assessments || 0;
    const approved = analytics.by_status?.approved || 0;

    if (total === 0) return 0;

    return Math.round((approved / total) * 100);
  }

  /**
   * Schedule assessment review
   */
  async scheduleAssessmentReview(
    assessmentId: string,
    reviewDate: Date
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('assessment_reviews')
        .insert({
          assessment_id: assessmentId,
          review_date: reviewDate.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(
          `Failed to schedule assessment review: ${error.message}`
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error scheduling assessment review:', error);
      return { success: false, error: 'Failed to schedule assessment review' };
    }
  }

  /**
   * Get upcoming assessments
   */
  async getUpcomingAssessments(
    days: number = 30
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await this.supabase
        .from('assessment_reviews')
        .select(
          `
          *,
          privacy_impact_assessments (
            title,
            risk_level,
            status
          )
        `
        )
        .gte('review_date', new Date().toISOString())
        .lte('review_date', futureDate.toISOString())
        .order('review_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to get upcoming assessments: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting upcoming assessments:', error);
      return { success: false, error: 'Failed to get upcoming assessments' };
    }
  }
}
