import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: In production, this would fetch from a CMS or database
    const aboutContent = {
      companyStory: {
        title: "Building New Zealand's Event Community",
        content:
          'Founded in 2024, Event Pros NZ was born from a simple belief: that every event in New Zealand deserves access to the best contractors and services. We saw the challenges event managers faced in finding reliable, verified contractors across our beautiful country.',
      },
      mission: {
        title: 'Our Mission',
        content:
          'To revolutionize event planning in New Zealand by creating a trusted, efficient platform that connects event managers with verified contractors, fostering a thriving event community.',
      },
      vision: {
        title: 'Our Vision',
        content:
          "To be New Zealand's leading event planning platform, known for quality, reliability, and innovation in connecting event professionals.",
      },
      values: [
        {
          title: 'Passion for Excellence',
          description:
            'We are passionate about delivering exceptional event experiences that exceed expectations and create lasting memories.',
        },
        {
          title: 'Trust & Reliability',
          description:
            'Every contractor on our platform is thoroughly verified, ensuring you can trust the professionals you work with.',
        },
        {
          title: 'Community First',
          description:
            'We believe in building a strong, supportive community of event professionals across New Zealand.',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(aboutContent);
  } catch (error) {
    // console.error('Failed to fetch about content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about content' },
      { status: 500 }
    );
  }
}
