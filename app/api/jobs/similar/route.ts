import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const findSimilarJobsSchema = z.object({
  job_ids: z.array(z.string().uuid()).min(1),
  limit: z.number().min(1).max(50).default(10),
});

// POST /api/jobs/similar - Find similar jobs
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = findSimilarJobsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors:
            validationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const { job_ids, limit } = validationResult.data;

    // Get the reference jobs
    const { data: referenceJobs, error: referenceError } = await supabase
      .from('jobs')
      .select('*')
      .in('id', job_ids)
      .eq('status', 'active');

    if (referenceError || !referenceJobs || referenceJobs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reference jobs not found' },
        { status: 404 }
      );
    }

    // Get all active jobs (excluding the reference jobs)
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .not('id', 'in', `(${job_ids.join(',')})`);

    if (allJobsError) {
      throw new Error(`Failed to fetch jobs: ${allJobsError.message}`);
    }

    // Calculate similarity for each job
    const similarJobs = allJobs
      ?.map(job => {
        const similarity = calculateJobSimilarity(referenceJobs, job);
        return {
          job,
          similarity: similarity.score,
          reasons: similarity.reasons,
        };
      })
      .filter(item => item.similarity > 30) // Only include jobs with >30% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      similar_jobs: similarJobs,
    });
  } catch (error) {
    console.error('POST /api/jobs/similar error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to find similar jobs',
      },
      { status: 500 }
    );
  }
}

// Calculate similarity between reference jobs and a target job
function calculateJobSimilarity(
  referenceJobs: any[],
  targetJob: any
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Service category match (40% weight)
  const referenceCategories = referenceJobs.map(job => job.service_category);
  if (referenceCategories.includes(targetJob.service_category)) {
    score += 40;
    reasons.push('Same service category');
  }

  // Location match (25% weight)
  const referenceLocations = referenceJobs.map(job =>
    job.location.toLowerCase()
  );
  if (referenceLocations.includes(targetJob.location.toLowerCase())) {
    score += 25;
    reasons.push('Same location');
  }

  // Budget range overlap (20% weight)
  const referenceBudgets = referenceJobs.map(job => ({
    min: job.budget_range_min || 0,
    max: job.budget_range_max || 0,
  }));

  const targetBudget = {
    min: targetJob.budget_range_min || 0,
    max: targetJob.budget_range_max || 0,
  };

  const hasBudgetOverlap = referenceBudgets.some(refBudget => {
    return (
      (targetBudget.min <= refBudget.max &&
        targetBudget.max >= refBudget.min) ||
      (refBudget.min <= targetBudget.max && refBudget.max >= targetBudget.min)
    );
  });

  if (hasBudgetOverlap) {
    score += 20;
    reasons.push('Similar budget range');
  }

  // Job type match (10% weight)
  const referenceTypes = referenceJobs.map(job => job.job_type);
  if (referenceTypes.includes(targetJob.job_type)) {
    score += 10;
    reasons.push('Same job type');
  }

  // Remote work match (5% weight)
  const referenceRemote = referenceJobs.map(job => job.is_remote);
  if (referenceRemote.includes(targetJob.is_remote)) {
    score += 5;
    reasons.push('Same remote work preference');
  }

  // Title similarity (bonus)
  const referenceTitles = referenceJobs.map(job => job.title.toLowerCase());
  const targetTitle = targetJob.title.toLowerCase();

  const titleSimilarity = referenceTitles.some(refTitle => {
    const commonWords = refTitle
      .split(' ')
      .filter(word => targetTitle.includes(word) && word.length > 3);
    return commonWords.length > 0;
  });

  if (titleSimilarity) {
    score += 5;
    reasons.push('Similar job title');
  }

  return { score: Math.min(score, 100), reasons };
}
