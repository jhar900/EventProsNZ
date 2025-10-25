import { GET } from '@/app/api/pricing/faq/route';
import { NextRequest } from 'next/server';

describe('/api/pricing/faq', () => {
  it('returns pricing FAQ', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.faqs).toBeDefined();
    expect(Array.isArray(data.faqs)).toBe(true);
    expect(data.faqs.length).toBeGreaterThan(0);
  });

  it('returns correct FAQ structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    const faq = data.faqs[0];
    expect(faq).toHaveProperty('id');
    expect(faq).toHaveProperty('question');
    expect(faq).toHaveProperty('answer');
    expect(faq).toHaveProperty('category');
    expect(faq).toHaveProperty('display_order');
  });

  it('includes FAQs for different categories', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    const categories = data.faqs.map((faq: any) => faq.category);
    expect(categories).toContain('pricing');
    expect(categories).toContain('billing');
    expect(categories).toContain('trial');
    expect(categories).toContain('security');
  });

  it('has non-empty questions and answers', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    data.faqs.forEach((faq: any) => {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
    });
  });

  it('has valid display order', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    data.faqs.forEach((faq: any) => {
      expect(typeof faq.display_order).toBe('number');
      expect(faq.display_order).toBeGreaterThan(0);
    });
  });

  it('includes common pricing questions', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    const questions = data.faqs.map((faq: any) => faq.question);
    expect(
      questions.some((q: string) => q.includes('change my subscription'))
    ).toBe(true);
    expect(questions.some((q: string) => q.includes('payment methods'))).toBe(
      true
    );
    expect(questions.some((q: string) => q.includes('free trial'))).toBe(true);
  });

  it('includes billing questions', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    const billingFaqs = data.faqs.filter(
      (faq: any) => faq.category === 'billing'
    );
    expect(billingFaqs.length).toBeGreaterThan(0);
  });

  it('includes security questions', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/faq');
    const response = await GET(request);
    const data = await response.json();

    const securityFaqs = data.faqs.filter(
      (faq: any) => faq.category === 'security'
    );
    expect(securityFaqs.length).toBeGreaterThan(0);
  });
});
