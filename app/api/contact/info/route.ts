import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: In production, this would fetch from a CMS or database
    const contactInfo = {
      business: {
        name: 'Event Pros NZ Ltd',
        address: {
          street: '123 Queen Street',
          city: 'Auckland',
          postalCode: '1010',
          country: 'New Zealand',
        },
        nzbn: '9429041234567',
        hours: {
          weekdays: '9:00 AM - 6:00 PM',
          saturday: '10:00 AM - 4:00 PM',
          sunday: 'Closed',
        },
      },
      contact: {
        phone: '+64 9 123 4567',
        email: 'hello@eventprosnz.co.nz',
        support: 'support@eventprosnz.co.nz',
        partnerships: 'partnerships@eventprosnz.co.nz',
      },
      responseTimes: {
        general: 'Within 24 hours',
        support: 'Within 4 hours',
        urgent: 'Within 1 hour',
        partnerships: 'Within 48 hours',
      },
      socialMedia: {
        facebook: 'https://facebook.com/eventprosnz',
        instagram: 'https://instagram.com/eventprosnz',
        linkedin: 'https://linkedin.com/company/eventprosnz',
        twitter: 'https://twitter.com/eventprosnz',
        youtube: 'https://youtube.com/@eventprosnz',
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(contactInfo);
  } catch (error) {
    // console.error('Failed to fetch contact info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    );
  }
}
