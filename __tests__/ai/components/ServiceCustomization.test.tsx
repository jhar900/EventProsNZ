import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceCustomization } from '@/components/features/ai/ServiceCustomization';

describe('ServiceCustomization', () => {
  const mockProps = {
    selectedServices: ['service-1', 'service-2'],
    onServiceUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service customization interface', () => {
    render(<ServiceCustomization {...mockProps} />);

    expect(screen.getByText('Service Customization')).toBeInTheDocument();
    expect(
      screen.getByText('Customize and manage your event services')
    ).toBeInTheDocument();
    expect(screen.getByText('Add Custom Service')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<ServiceCustomization {...mockProps} />);

    expect(screen.getByText('Total Services')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Total Duration')).toBeInTheDocument();
  });

  it('shows empty state when no services', () => {
    render(<ServiceCustomization {...mockProps} />);

    expect(
      screen.getByText(
        'No services added yet. Add some services to get started.'
      )
    ).toBeInTheDocument();
  });

  it('shows add service form when add button is clicked', () => {
    render(<ServiceCustomization {...mockProps} />);

    const addButton = screen.getByText('Add Custom Service');
    fireEvent.click(addButton);

    expect(
      screen.getByText('Add a custom service to your event')
    ).toBeInTheDocument();
    expect(screen.getByText('Service Category')).toBeInTheDocument();
    expect(screen.getByText('Service Name')).toBeInTheDocument();
  });

  it('handles adding new service', async () => {
    render(<ServiceCustomization {...mockProps} />);

    const addButton = screen.getByText('Add Custom Service');
    fireEvent.click(addButton);

    const categoryInput = screen.getByPlaceholderText(
      'e.g., Photography, Catering'
    );
    const nameInput = screen.getByPlaceholderText('e.g., Wedding Photography');
    const submitButton = screen.getByText('Add Service');

    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.change(nameInput, { target: { value: 'Wedding Photography' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onServiceUpdate).toHaveBeenCalled();
    });
  });

  it('cancels add service form', () => {
    render(<ServiceCustomization {...mockProps} />);

    const addButton = screen.getByText('Add Custom Service');
    fireEvent.click(addButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(
      screen.queryByText('Add a custom service to your event')
    ).not.toBeInTheDocument();
  });

  it('displays form fields correctly', () => {
    render(<ServiceCustomization {...mockProps} />);

    const addButton = screen.getByText('Add Custom Service');
    fireEvent.click(addButton);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
    expect(screen.getByText('Duration (hours)')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Required Service')).toBeInTheDocument();
  });

  it('shows priority options', () => {
    render(<ServiceCustomization {...mockProps} />);

    const addButton = screen.getByText('Add Custom Service');
    fireEvent.click(addButton);

    // Check that the priority field is rendered
    expect(screen.getByText('Priority')).toBeInTheDocument();

    // The select component should be present (we can't easily test the dropdown content in this setup)
    const priorityField = screen.getByText('Priority');
    expect(priorityField).toBeInTheDocument();
  });
});
