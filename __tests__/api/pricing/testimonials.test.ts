import { GET } from '@/app/api/pricing/testimonials/route';
import { NextRequest } from 'next/server';

describe('/api/pricing/testimonials', () => {
  it('returns pricing testimonials', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.testimonials).toBeDefined();
    expect(Array.isArray(data.testimonials)).toBe(true);
    expect(data.testimonials.length).toBeGreaterThan(0);
  });

  it('returns correct testimonial structure', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    const testimonial = data.testimonials[0];
    expect(testimonial).toHaveProperty('id');
    expect(testimonial).toHaveProperty('contractor_id');
    expect(testimonial).toHaveProperty('contractor_name');
    expect(testimonial).toHaveProperty('content');
    expect(testimonial).toHaveProperty('rating');
    expect(testimonial).toHaveProperty('tier');
    expect(testimonial).toHaveProperty('is_featured');
  });

  it('includes testimonials for different tiers', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    const tiers = data.testimonials.map((t: any) => t.tier);
    expect(tiers).toContain('essential');
    expect(tiers).toContain('showcase');
    expect(tiers).toContain('spotlight');
  });

  it('includes featured testimonials', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    const featuredTestimonials = data.testimonials.filter(
      (t: any) => t.is_featured
    );
    expect(featuredTestimonials.length).toBeGreaterThan(0);
  });

  it('has valid ratings', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    data.testimonials.forEach((testimonial: any) => {
      expect(testimonial.rating).toBeGreaterThanOrEqual(1);
      expect(testimonial.rating).toBeLessThanOrEqual(5);
    });
  });

  it('has non-empty content', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    data.testimonials.forEach((testimonial: any) => {
      expect(testimonial.content.length).toBeGreaterThan(0);
      expect(testimonial.contractor_name.length).toBeGreaterThan(0);
    });
  });

  it('includes contractor information', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/pricing/testimonials'
    );
    const response = await GET(request);
    const data = await response.json();

    data.testimonials.forEach((testimonial: any) => {
      expect(testimonial.contractor_id).toBeDefined();
      expect(testimonial.contractor_name).toBeDefined();
    });
  });
});
