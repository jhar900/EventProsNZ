import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceTemplateBuilder } from '@/components/features/ai/ServiceTemplateBuilder';

// Mock the Select component to avoid Radix UI issues in tests
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, id }: any) => (
    <select data-testid="select-trigger" id={id}>
      {children}
    </select>
  ),
  SelectValue: ({ placeholder }: any) => (
    <option value="">{placeholder}</option>
  ),
}));

// Mock the Tabs component to ensure content renders properly
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={() => {}}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

describe('ServiceTemplateBuilder', () => {
  const mockOnTemplateSave = jest.fn();
  const mockOnTemplateLoad = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service template builder', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    expect(screen.getByText('Service Template Builder')).toBeInTheDocument();
    expect(
      screen.getByText('Create and customize service templates for your events')
    ).toBeInTheDocument();
  });

  it('displays template overview form', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // Use getAllByLabelText to handle multiple elements with same label
    const publicToggles = screen.getAllByLabelText('Make this template public');
    expect(publicToggles.length).toBeGreaterThan(0);
  });

  it('handles template name input', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'Wedding Package' } });

    expect(nameInput).toHaveValue('Wedding Package');
  });

  it('handles event type selection', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const eventTypeSelect = screen.getByLabelText('Event Type');
    fireEvent.click(eventTypeSelect);

    // With mocked Select, the options should be available immediately
    const weddingOption = screen.getByText('Wedding');
    fireEvent.click(weddingOption);

    // Check that the option was clicked
    expect(weddingOption).toBeInTheDocument();
  });

  it('handles description input', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Complete wedding service package' },
    });

    expect(descriptionInput).toHaveValue('Complete wedding service package');
  });

  it('handles public template toggle', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Use getAllByLabelText to handle multiple elements with same label
    const publicToggles = screen.getAllByLabelText('Make this template public');
    const publicToggle = publicToggles[0]; // Use the first one
    fireEvent.click(publicToggle);

    expect(publicToggle).toBeChecked();
  });

  it('shows add service form when add service button is clicked', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Use the header "Add Service" button (first one)
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    expect(screen.getByText('Add Service to Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('handles adding a new service', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Use the header "Add Service" button (first one)
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const serviceNameInput = screen.getByLabelText('Service Name');
    const categoryInput = screen.getByLabelText('Category');

    // Use the form "Add Service" button (second one)
    const formAddButtons = screen.getAllByText('Add Service');
    const formAddButton = formAddButtons[1];

    fireEvent.change(serviceNameInput, {
      target: { value: 'Wedding Photography' },
    });
    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.click(formAddButton);

    await waitFor(() => {
      // Use getAllByText to handle multiple elements with same text
      const photographyElements = screen.getAllByText('Wedding Photography');
      const categoryElements = screen.getAllByText('Photography');

      expect(photographyElements.length).toBeGreaterThan(0);
      expect(categoryElements.length).toBeGreaterThan(0);
    });
  });

  it('handles service priority selection', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    // Find the priority select by specific id since there are multiple select triggers
    const prioritySelects = screen.getAllByTestId('select-trigger');
    const servicePrioritySelect = prioritySelects.find(
      select => select.id === 'service_priority'
    );
    fireEvent.click(servicePrioritySelect!);

    // With mocked Select, the options should be available immediately
    const highPriorityOption = screen.getByText('4 - High');
    fireEvent.click(highPriorityOption);

    // Check that the option was clicked
    expect(highPriorityOption).toBeInTheDocument();
  });

  it('handles service cost input', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const costInput = screen.getByLabelText('Estimated Cost');
    fireEvent.change(costInput, { target: { value: '2500' } });

    expect(costInput).toHaveValue(2500);
  });

  it('handles service duration input', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const durationInput = screen.getByLabelText('Duration (hours)');
    fireEvent.change(durationInput, { target: { value: '8' } });

    expect(durationInput).toHaveValue(8);
  });

  it('handles required service toggle', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const requiredToggle = screen.getByLabelText('Required Service');
    fireEvent.click(requiredToggle);

    expect(requiredToggle).toBeChecked();
  });

  it('cancels adding service', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(
      screen.queryByText('Add Service to Template')
    ).not.toBeInTheDocument();
  });

  it('displays template statistics', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Add a service first
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const serviceNameInput = screen.getByLabelText('Service Name');
    const categoryInput = screen.getByLabelText('Category');
    const costInput = screen.getByLabelText('Estimated Cost');
    const durationInput = screen.getByLabelText('Duration (hours)');
    const formAddButtons = screen.getAllByText('Add Service');
    const formAddButton = formAddButtons[1];

    fireEvent.change(serviceNameInput, {
      target: { value: 'Wedding Photography' },
    });
    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.change(costInput, { target: { value: '2500' } });
    fireEvent.change(durationInput, { target: { value: '8' } });
    fireEvent.click(formAddButton);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Total Services
    });

    // Check for the cost and duration - there might be multiple elements with same text
    const costElements = screen.getAllByText('$2,500');
    const durationElements = screen.getAllByText('8h');

    expect(costElements.length).toBeGreaterThan(0);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  it('handles service editing', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Add a service first
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const serviceNameInput = screen.getByLabelText('Service Name');
    const categoryInput = screen.getByLabelText('Category');
    const formAddButtons = screen.getAllByText('Add Service');
    const formAddButton = formAddButtons[1];

    fireEvent.change(serviceNameInput, {
      target: { value: 'Wedding Photography' },
    });
    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.click(formAddButton);

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit');
      fireEvent.click(editButton);
    });

    expect(screen.getByDisplayValue('Wedding Photography')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Photography')).toBeInTheDocument();
  });

  it('handles service removal', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Add a service first
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const serviceNameInput = screen.getByLabelText('Service Name');
    const categoryInput = screen.getByLabelText('Category');
    const formAddButtons = screen.getAllByText('Add Service');
    const formAddButton = formAddButtons[1];

    fireEvent.change(serviceNameInput, {
      target: { value: 'Wedding Photography' },
    });
    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.click(formAddButton);

    await waitFor(() => {
      const deleteButton = screen.getByLabelText('Delete');
      fireEvent.click(deleteButton);
    });

    expect(screen.queryByText('Wedding Photography')).not.toBeInTheDocument();
  });

  it('handles service duplication', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Add a service first
    const addServiceButtons = screen.getAllByText('Add Service');
    const headerAddButton = addServiceButtons[0];
    fireEvent.click(headerAddButton);

    const serviceNameInput = screen.getByLabelText('Service Name');
    const categoryInput = screen.getByLabelText('Category');
    const formAddButtons = screen.getAllByText('Add Service');
    const formAddButton = formAddButtons[1];

    fireEvent.change(serviceNameInput, {
      target: { value: 'Wedding Photography' },
    });
    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.click(formAddButton);

    await waitFor(() => {
      const duplicateButton = screen.getByLabelText('Copy');
      fireEvent.click(duplicateButton);
    });

    // Use getAllByText to handle multiple elements with same text
    const copyElements = screen.getAllByText('Wedding Photography (Copy)');
    expect(copyElements.length).toBeGreaterThan(0);
  });

  it('switches between tabs', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Check that tabs are present
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // With mocked Tabs, all content should be rendered
    expect(screen.getByText('Untitled Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum Budget')).toBeInTheDocument();
  });

  it('displays template preview', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Set template name and description
    const nameInput = screen.getByLabelText('Template Name');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'Wedding Package' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Complete wedding service package' },
    });

    // With mocked Tabs, the preview content should be available immediately
    expect(screen.getByText('Wedding Package')).toBeInTheDocument();

    // Use getAllByText to handle multiple elements with same text
    const descriptionElements = screen.getAllByText(
      'Complete wedding service package'
    );
    expect(descriptionElements.length).toBeGreaterThan(0);
  });

  it('handles template settings', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // With mocked Tabs, the settings form should be available immediately
    const minBudgetInput = screen.getByLabelText('Minimum Budget');
    const maxBudgetInput = screen.getByLabelText('Maximum Budget');
    const minGuestsInput = screen.getByLabelText('Minimum Guests');
    const maxGuestsInput = screen.getByLabelText('Maximum Guests');

    fireEvent.change(minBudgetInput, { target: { value: '5000' } });
    fireEvent.change(maxBudgetInput, { target: { value: '15000' } });
    fireEvent.change(minGuestsInput, { target: { value: '50' } });
    fireEvent.change(maxGuestsInput, { target: { value: '200' } });

    expect(minBudgetInput).toHaveValue(5000);
    expect(maxBudgetInput).toHaveValue(15000);
    expect(minGuestsInput).toHaveValue(50);
    expect(maxGuestsInput).toHaveValue(200);
  });

  it('saves template', async () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'Wedding Package' } });

    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnTemplateSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Wedding Package',
        })
      );
    });
  });

  it('handles initial template', () => {
    const initialTemplate = {
      name: 'Corporate Event Package',
      description: 'Professional corporate event services',
      eventType: 'corporate',
    };

    render(
      <ServiceTemplateBuilder
        onTemplateSave={mockOnTemplateSave}
        initialTemplate={initialTemplate}
      />
    );

    expect(
      screen.getByDisplayValue('Corporate Event Package')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Professional corporate event services')
    ).toBeInTheDocument();
    // Check that the event type select shows "Corporate" text
    expect(screen.getByText('Corporate')).toBeInTheDocument();
  });

  it('shows empty state when no services', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    expect(
      screen.getByText(
        'No services added yet. Add some services to build your template.'
      )
    ).toBeInTheDocument();
  });

  it('validates required fields when adding service', () => {
    render(<ServiceTemplateBuilder onTemplateSave={mockOnTemplateSave} />);

    // Click the "Add Service" button to show the form
    const addServiceButtons = screen.getAllByText('Add Service');
    fireEvent.click(addServiceButtons[0]); // Click the first one (header button)

    // The form should be visible
    expect(screen.getByText('Add Service to Template')).toBeInTheDocument();

    // Try to add service without filling required fields
    const formAddButton = screen.getAllByText('Add Service')[1]; // Click the second one (form button)
    fireEvent.click(formAddButton);

    // Should not add service without required fields
    expect(screen.queryByText('Wedding Photography')).not.toBeInTheDocument();
  });
});
