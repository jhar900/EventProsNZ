import { GET } from '@/app/api/pricing/tiers/route';
import { NextRequest } from 'next/server';

describe('/api/pricing/tiers', () => {
  it('returns pricing tiers', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tiers).toBeDefined();
    expect(Array.isArray(data.tiers)).toBe(true);
    expect(data.tiers.length).toBe(3);
  });

  it('returns correct tier structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    const tier = data.tiers[0];
    expect(tier).toHaveProperty('id');
    expect(tier).toHaveProperty('name');
    expect(tier).toHaveProperty('price');
    expect(tier).toHaveProperty('price_annual');
    expect(tier).toHaveProperty('features');
    expect(tier).toHaveProperty('limits');
    expect(tier).toHaveProperty('is_trial_eligible');
  });

  it('includes essential tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    const essentialTier = data.tiers.find(
      (tier: any) => tier.id === 'essential'
    );
    expect(essentialTier).toBeDefined();
    expect(essentialTier.price).toBe(0);
    expect(essentialTier.is_trial_eligible).toBe(false);
  });

  it('includes showcase tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    const showcaseTier = data.tiers.find((tier: any) => tier.id === 'showcase');
    expect(showcaseTier).toBeDefined();
    expect(showcaseTier.price).toBe(29);
    expect(showcaseTier.is_trial_eligible).toBe(true);
  });

  it('includes spotlight tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    const spotlightTier = data.tiers.find(
      (tier: any) => tier.id === 'spotlight'
    );
    expect(spotlightTier).toBeDefined();
    expect(spotlightTier.price).toBe(69);
    expect(spotlightTier.is_trial_eligible).toBe(true);
  });

  it('has correct annual pricing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    const showcaseTier = data.tiers.find((tier: any) => tier.id === 'showcase');
    expect(showcaseTier.price_annual).toBe(299);

    const spotlightTier = data.tiers.find(
      (tier: any) => tier.id === 'spotlight'
    );
    expect(spotlightTier.price_annual).toBe(699);
  });

  it('includes features for each tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    data.tiers.forEach((tier: any) => {
      expect(Array.isArray(tier.features)).toBe(true);
      expect(tier.features.length).toBeGreaterThan(0);
    });
  });

  it('includes limits for each tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/pricing/tiers');
    const response = await GET(request);
    const data = await response.json();

    data.tiers.forEach((tier: any) => {
      expect(typeof tier.limits).toBe('object');
      expect(tier.limits).not.toBeNull();
    });
  });
});
