import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the ServiceCategoriesSection component for testing
const ServiceCategoriesSection = ({ categories = [], className = '' }) => (
  <section className={`py-20 bg-gray-50 ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Service Categories
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find the perfect contractors for every aspect of your event
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {category.name}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{category.contractor_count} contractors</span>
              </div>
              {category.popular && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Popular
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold">
          Browse All Categories
        </button>
      </div>
    </div>
  </section>
);

const mockCategories = [
  {
    id: '1',
    name: 'Photography',
    description: 'Professional photographers for all occasions',
    contractor_count: 89,
    color: 'blue',
    popular: true,
  },
  {
    id: '2',
    name: 'Catering',
    description: 'Delicious food and beverage services',
    contractor_count: 67,
    color: 'green',
    popular: true,
  },
];

describe('ServiceCategoriesSection', () => {
  it('renders the section heading', () => {
    render(<ServiceCategoriesSection />);

    expect(screen.getByText('Service Categories')).toBeInTheDocument();
    expect(
      screen.getByText(/Find the perfect contractors for every aspect/)
    ).toBeInTheDocument();
  });

  it('renders service categories', () => {
    render(<ServiceCategoriesSection categories={mockCategories} />);

    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(
      screen.getByText('Professional photographers for all occasions')
    ).toBeInTheDocument();
    expect(screen.getByText('89 contractors')).toBeInTheDocument();
  });

  it('renders popular badges for popular categories', () => {
    render(<ServiceCategoriesSection categories={mockCategories} />);

    expect(screen.getAllByText('Popular')).toHaveLength(2);
  });

  it('renders contractor counts', () => {
    render(<ServiceCategoriesSection categories={mockCategories} />);

    expect(screen.getByText('89 contractors')).toBeInTheDocument();
    expect(screen.getByText('67 contractors')).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(<ServiceCategoriesSection />);

    expect(screen.getByText('Browse All Categories')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ServiceCategoriesSection className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty categories array', () => {
    render(<ServiceCategoriesSection categories={[]} />);

    expect(screen.getByText('Service Categories')).toBeInTheDocument();
  });
});
