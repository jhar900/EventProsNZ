import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/testimonials/platform/[id]/quality-checks - Get quality checks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get quality checks for testimonial
    const { data: qualityChecks, error: qualityChecksError } = await supabase
      .from('testimonial_quality_checks')
      .select('*')
      .eq('testimonial_id', params.id)
      .order('created_at', { ascending: false });

    if (qualityChecksError) {
      console.error('Error fetching quality checks:', qualityChecksError);
      return NextResponse.json(
        { error: 'Failed to fetch quality checks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      qualityChecks: qualityChecks || [],
    });
  } catch (error) {
    console.error(
      'Error in GET /api/testimonials/platform/[id]/quality-checks:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/testimonials/platform/[id]/quality-checks - Run quality checks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .select('id, feedback, rating')
      .eq('id', params.id)
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Run quality checks
    const qualityChecks = await runQualityChecks(testimonial);

    // Save quality check results
    const { data: savedChecks, error: saveError } = await supabase
      .from('testimonial_quality_checks')
      .insert(
        qualityChecks.map(check => ({
          testimonial_id: params.id,
          check_type: check.check_type,
          status: check.status,
          score: check.score,
          details: check.details,
        }))
      )
      .select();

    if (saveError) {
      console.error('Error saving quality checks:', saveError);
      return NextResponse.json(
        { error: 'Failed to save quality checks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Quality checks completed successfully',
      qualityChecks: savedChecks,
    });
  } catch (error) {
    console.error(
      'Error in POST /api/testimonials/platform/[id]/quality-checks:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Run quality checks on testimonial
async function runQualityChecks(testimonial: any) {
  const checks = [];

  // Profanity check
  const profanityCheck = await checkProfanity(testimonial.feedback);
  checks.push({
    check_type: 'profanity',
    status: profanityCheck.hasProfanity ? 'failed' : 'passed',
    score: profanityCheck.score,
    details: profanityCheck.details,
  });

  // Spam check
  const spamCheck = await checkSpam(testimonial.feedback);
  checks.push({
    check_type: 'spam',
    status: spamCheck.isSpam ? 'failed' : 'passed',
    score: spamCheck.score,
    details: spamCheck.details,
  });

  // Quality check
  const qualityCheck = await checkQuality(testimonial.feedback);
  checks.push({
    check_type: 'quality',
    status: qualityCheck.status,
    score: qualityCheck.score,
    details: qualityCheck.details,
  });

  // Sentiment check
  const sentimentCheck = await checkSentiment(
    testimonial.feedback,
    testimonial.rating
  );
  checks.push({
    check_type: 'sentiment',
    status: sentimentCheck.status,
    score: sentimentCheck.score,
    details: sentimentCheck.details,
  });

  return checks;
}

// Check for profanity
async function checkProfanity(text: string) {
  // Simple profanity detection (in a real implementation, you would use a profanity library)
  const profanityWords = ['bad', 'terrible', 'awful', 'hate']; // Simplified list
  const words = text.toLowerCase().split(/\s+/);
  const foundProfanity = words.filter(word => profanityWords.includes(word));

  return {
    hasProfanity: foundProfanity.length > 0,
    score: foundProfanity.length > 0 ? 0 : 100,
    details:
      foundProfanity.length > 0
        ? `Found potentially inappropriate words: ${foundProfanity.join(', ')}`
        : 'No profanity detected',
  };
}

// Check for spam
async function checkSpam(text: string) {
  // Simple spam detection
  const spamIndicators = [
    text.length < 10, // Too short
    text.length > 1000, // Too long
    /(.)\1{4,}/.test(text), // Repeated characters
    /https?:\/\/\S+/.test(text), // URLs
    /\b(click here|buy now|free money|guaranteed)\b/i.test(text), // Spam phrases
  ];

  const spamScore = spamIndicators.filter(Boolean).length;
  const isSpam = spamScore >= 2;

  return {
    isSpam,
    score: isSpam ? 0 : Math.max(0, 100 - spamScore * 20),
    details: isSpam
      ? `Spam indicators detected (${spamScore} out of ${spamIndicators.length})`
      : 'No spam indicators detected',
  };
}

// Check content quality
async function checkQuality(text: string) {
  const qualityIndicators = {
    length: text.length >= 50 && text.length <= 500,
    readability: text.split(' ').length >= 10,
    structure: text.includes('.') || text.includes('!') || text.includes('?'),
    personal: /I|me|my|we|our/.test(text),
  };

  const qualityScore = Object.values(qualityIndicators).filter(Boolean).length;
  const totalIndicators = Object.keys(qualityIndicators).length;
  const score = Math.round((qualityScore / totalIndicators) * 100);

  return {
    status: score >= 75 ? 'passed' : score >= 50 ? 'warning' : 'failed',
    score,
    details: `Quality score: ${score}% (${qualityScore}/${totalIndicators} indicators met)`,
  };
}

// Check sentiment alignment
async function checkSentiment(text: string, rating: number) {
  // Simple sentiment analysis
  const positiveWords = [
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'perfect',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'hate',
    'disappointed',
    'poor',
  ];

  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word =>
    positiveWords.includes(word)
  ).length;
  const negativeCount = words.filter(word =>
    negativeWords.includes(word)
  ).length;

  const sentimentScore = positiveCount - negativeCount;
  const expectedSentiment = rating >= 4 ? 1 : rating <= 2 ? -1 : 0;
  const alignment = Math.sign(sentimentScore) === Math.sign(expectedSentiment);

  const score = alignment
    ? 100
    : Math.max(0, 100 - Math.abs(sentimentScore - expectedSentiment) * 20);

  return {
    status: score >= 75 ? 'passed' : score >= 50 ? 'warning' : 'failed',
    score,
    details: `Sentiment alignment: ${score}% (${alignment ? 'aligned' : 'misaligned'} with rating)`,
  };
}
