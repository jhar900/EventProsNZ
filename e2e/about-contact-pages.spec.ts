import { test, expect } from '@playwright/test';

test.describe('About & Contact Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the about page before each test
    await page.goto('/about');
  });

  test('About page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/About Event Pros NZ/);

    // Check main heading
    await expect(
      page.getByRole('heading', { name: 'About Event Pros NZ' })
    ).toBeVisible();

    // Check key sections
    await expect(page.getByText('Our Story')).toBeVisible();
    await expect(page.getByText('Our Values')).toBeVisible();
    await expect(page.getByText('Meet Our Team')).toBeVisible();
    await expect(page.getByText('Proudly New Zealand')).toBeVisible();
  });

  test('About page displays team information', async ({ page }) => {
    // Check team section
    await expect(page.getByText('Meet Our Team')).toBeVisible();

    // Check team members
    await expect(page.getByText('Sarah Mitchell')).toBeVisible();
    await expect(page.getByText('Founder & CEO')).toBeVisible();
    await expect(page.getByText('James Chen')).toBeVisible();
    await expect(page.getByText('CTO')).toBeVisible();
    await expect(page.getByText('Emma Thompson')).toBeVisible();
    await expect(page.getByText('Head of Operations')).toBeVisible();
    await expect(page.getByText("Mike O'Connor")).toBeVisible();
    await expect(page.getByText('Head of Partnerships')).toBeVisible();
  });

  test('About page displays company values', async ({ page }) => {
    // Check values section
    await expect(page.getByText('Our Values')).toBeVisible();

    // Check individual values
    await expect(page.getByText('Passion for Excellence')).toBeVisible();
    await expect(page.getByText('Trust & Reliability')).toBeVisible();
    await expect(page.getByText('Community First')).toBeVisible();
    await expect(page.getByText('Innovation')).toBeVisible();
    await expect(page.getByText('Quality Standards')).toBeVisible();
    await expect(page.getByText('Partnership')).toBeVisible();
  });

  test('About page displays New Zealand focus', async ({ page }) => {
    // Check NZ focus section
    await expect(page.getByText('Proudly New Zealand')).toBeVisible();

    // Check NZ-specific content
    await expect(page.getByText('Nationwide Coverage')).toBeVisible();
    await expect(page.getByText('Local Expertise')).toBeVisible();
    await expect(page.getByText('Quality Standards')).toBeVisible();

    // Check badges
    await expect(page.getByText('Proudly New Zealand')).toBeVisible();
    await expect(page.getByText('500+ Verified Contractors')).toBeVisible();
    await expect(page.getByText('Trusted by 1000+ Events')).toBeVisible();
  });

  test('Contact page loads correctly', async ({ page }) => {
    await page.goto('/contact');

    await expect(page).toHaveTitle(/Contact Event Pros NZ/);

    // Check main heading
    await expect(
      page.getByRole('heading', { name: 'Get in Touch' })
    ).toBeVisible();

    // Check key sections
    await expect(page.getByText('Business Information')).toBeVisible();
    await expect(page.getByText('Contact Methods')).toBeVisible();
    await expect(page.getByText('Response Times')).toBeVisible();
    await expect(page.getByText('Send Us a Message')).toBeVisible();
  });

  test('Contact page displays business information', async ({ page }) => {
    await page.goto('/contact');

    // Check business details
    await expect(page.getByText('Event Pros NZ Ltd')).toBeVisible();
    await expect(page.getByText('123 Queen Street')).toBeVisible();
    await expect(page.getByText('Auckland 1010')).toBeVisible();
    await expect(page.getByText('New Zealand')).toBeVisible();

    // Check business hours
    await expect(
      page.getByText('Monday - Friday: 9:00 AM - 6:00 PM')
    ).toBeVisible();
    await expect(page.getByText('Saturday: 10:00 AM - 4:00 PM')).toBeVisible();
    await expect(page.getByText('Sunday: Closed')).toBeVisible();
  });

  test('Contact page displays contact methods', async ({ page }) => {
    await page.goto('/contact');

    // Check contact details
    await expect(page.getByText('+64 9 123 4567')).toBeVisible();
    await expect(page.getByText('hello@eventprosnz.co.nz')).toBeVisible();
    await expect(page.getByText('support@eventprosnz.co.nz')).toBeVisible();
    await expect(
      page.getByText('partnerships@eventprosnz.co.nz')
    ).toBeVisible();
  });

  test('Contact page displays response times', async ({ page }) => {
    await page.goto('/contact');

    // Check response times
    await expect(page.getByText('Within 24 hours')).toBeVisible();
    await expect(page.getByText('Within 4 hours')).toBeVisible();
    await expect(page.getByText('Within 1 hour')).toBeVisible();
    await expect(page.getByText('Within 48 hours')).toBeVisible();
  });

  test('Contact form submission works', async ({ page }) => {
    await page.goto('/contact');

    // Fill out the contact form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+64 9 123 4567');
    await page.fill('input[name="company"]', 'Test Company');

    // Select category
    await page.click('[role="combobox"]');
    await page.click('text=General Inquiry');

    await page.fill('input[name="subject"]', 'Test Subject');
    await page.fill(
      'textarea[name="message"]',
      'This is a test message with enough characters to pass validation'
    );

    // Check newsletter subscription
    await page.check('input[name="newsletter"]');

    // Submit the form
    await page.click('button[type="submit"]');

    // Check for success message
    await expect(
      page.getByText(
        "Thank you for your message! We'll get back to you within 24 hours."
      )
    ).toBeVisible();
  });

  test('Contact form validation works', async ({ page }) => {
    await page.goto('/contact');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(
      page.getByText('Please select an inquiry category')
    ).toBeVisible();
    await expect(page.getByText('Subject is required')).toBeVisible();
    await expect(page.getByText('Message is required')).toBeVisible();
  });

  test('Newsletter signup works', async ({ page }) => {
    await page.goto('/contact');

    // Scroll to newsletter section
    await page.scrollTo({ selector: 'text=Stay in the Loop' });

    // Fill out newsletter form
    await page.fill('input[type="email"]', 'newsletter@example.com');

    // Select preferences
    await page.check('input[name="tips"]');
    await page.check('input[name="updates"]');

    // Submit newsletter form
    await page.click('button:has-text("Subscribe to Newsletter")');

    // Check for success message
    await expect(
      page.getByText(
        "Thank you for subscribing! You'll receive our newsletter updates soon."
      )
    ).toBeVisible();
  });

  test('Newsletter signup validation works', async ({ page }) => {
    await page.goto('/contact');

    // Scroll to newsletter section
    await page.scrollTo({ selector: 'text=Stay in the Loop' });

    // Try to submit empty newsletter form
    await page.click('button:has-text("Subscribe to Newsletter")');

    // Check for validation errors
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(
      page.getByText('Please select at least one newsletter preference')
    ).toBeVisible();
  });

  test('Social media links are present', async ({ page }) => {
    await page.goto('/contact');

    // Scroll to social media section
    await page.scrollTo({ selector: 'text=Follow Us' });

    // Check social media links
    await expect(page.getByText('Facebook')).toBeVisible();
    await expect(page.getByText('Instagram')).toBeVisible();
    await expect(page.getByText('LinkedIn')).toBeVisible();
    await expect(page.getByText('Twitter')).toBeVisible();
    await expect(page.getByText('YouTube')).toBeVisible();
  });

  test('FAQ section is present', async ({ page }) => {
    await page.goto('/contact');

    // Scroll to FAQ section
    await page.scrollTo({ selector: 'text=Frequently Asked Questions' });

    // Check FAQ items
    await expect(page.getByText('How do I get started?')).toBeVisible();
    await expect(page.getByText('Are contractors verified?')).toBeVisible();
    await expect(page.getByText('What areas do you cover?')).toBeVisible();
    await expect(page.getByText('How do you ensure quality?')).toBeVisible();
  });

  test('Mobile responsiveness works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test about page on mobile
    await page.goto('/about');
    await expect(
      page.getByRole('heading', { name: 'About Event Pros NZ' })
    ).toBeVisible();

    // Test contact page on mobile
    await page.goto('/contact');
    await expect(
      page.getByRole('heading', { name: 'Get in Touch' })
    ).toBeVisible();

    // Test contact form on mobile
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.click('[role="combobox"]');
    await page.click('text=General Inquiry');
    await page.fill('input[name="subject"]', 'Test Subject');
    await page.fill(
      'textarea[name="message"]',
      'This is a test message with enough characters'
    );

    // Form should be usable on mobile
    await expect(
      page.getByRole('button', { name: 'Send Message' })
    ).toBeVisible();
  });

  test('Navigation between pages works', async ({ page }) => {
    // Start on about page
    await page.goto('/about');
    await expect(
      page.getByRole('heading', { name: 'About Event Pros NZ' })
    ).toBeVisible();

    // Navigate to contact page
    await page.goto('/contact');
    await expect(
      page.getByRole('heading', { name: 'Get in Touch' })
    ).toBeVisible();

    // Navigate back to about page
    await page.goto('/about');
    await expect(
      page.getByRole('heading', { name: 'About Event Pros NZ' })
    ).toBeVisible();
  });
});
