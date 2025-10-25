import { POST } from '@/app/api/newsletter/signup/route';
import { NextRequest } from 'next/server';

describe('/api/newsletter/signup', () => {
  it('validates required fields', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: '',
          preferences: [],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid signup data');
  });

  it('accepts valid newsletter signup', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          preferences: ['tips', 'updates'],
          source: 'contact_page',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully subscribed to newsletter!');
  });

  it('validates email format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          preferences: ['tips'],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates preferences array', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          preferences: [],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates preference values', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          preferences: ['invalid_preference'],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid newsletter preferences');
  });

  it('accepts all valid preferences', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          preferences: [
            'tips',
            'updates',
            'success',
            'industry',
            'contractors',
            'events',
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('handles missing source field', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          preferences: ['tips'],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('handles malformed JSON', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/newsletter/signup',
      {
        method: 'POST',
        body: 'invalid json',
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
