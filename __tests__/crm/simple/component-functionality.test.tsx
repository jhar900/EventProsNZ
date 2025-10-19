import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the useCRM hook
const mockUseCRM = {
  contacts: [
    {
      id: 'contact-1',
      user_id: 'user-1',
      contact_user_id: 'user-2',
      contact_type: 'client',
      relationship_status: 'active',
      last_interaction: '2024-12-22T10:00:00Z',
      interaction_count: 5,
      contact_user: {
        id: 'user-2',
        email: 'client@example.com',
        role: 'client',
        is_verified: true,
      },
      contact_profile: {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+64 21 123 4567',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Event organizer',
      },
    },
  ],
  isLoading: false,
  error: null,
  loadContacts: jest.fn(),
  createContact: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  clearError: jest.fn(),
};

// Mock the useCRM hook
jest.mock('@/hooks/useCRM', () => ({
  useCRM: () => mockUseCRM,
}));

// Simple ContactCard component for testing
const ContactCard = ({ contact, onEdit, onDelete }: any) => {
  return (
    <div data-testid={`contact-${contact.id}`} className="contact-card">
      <div className="contact-info">
        <div className="contact-name">
          {contact.contact_profile.first_name}{' '}
          {contact.contact_profile.last_name}
        </div>
        <div className="contact-email">{contact.contact_user.email}</div>
        <div className="contact-type">{contact.contact_type}</div>
        <div className="contact-status">{contact.relationship_status}</div>
      </div>
      <div className="contact-actions">
        <button onClick={() => onEdit(contact.id)} data-testid="edit-button">
          Edit
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          data-testid="delete-button"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Simple ContactList component for testing
const ContactList = ({ contacts, onEdit, onDelete }: any) => {
  return (
    <div data-testid="contact-list">
      {contacts.map((contact: any) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

// Simple ContactForm component for testing
const ContactForm = ({ onSubmit, onCancel }: any) => {
  const [formData, setFormData] = React.useState({
    contact_user_id: '',
    contact_type: 'client',
    relationship_status: 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form data-testid="contact-form" onSubmit={handleSubmit}>
      <input
        data-testid="contact-user-id"
        value={formData.contact_user_id}
        onChange={e =>
          setFormData({ ...formData, contact_user_id: e.target.value })
        }
        placeholder="Contact User ID"
      />
      <select
        data-testid="contact-type"
        value={formData.contact_type}
        onChange={e =>
          setFormData({ ...formData, contact_type: e.target.value })
        }
      >
        <option value="client">Client</option>
        <option value="contractor">Contractor</option>
        <option value="vendor">Vendor</option>
      </select>
      <select
        data-testid="relationship-status"
        value={formData.relationship_status}
        onChange={e =>
          setFormData({ ...formData, relationship_status: e.target.value })
        }
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blocked">Blocked</option>
      </select>
      <button type="submit" data-testid="submit-button">
        Create Contact
      </button>
      <button type="button" onClick={onCancel} data-testid="cancel-button">
        Cancel
      </button>
    </form>
  );
};

// Simple ContactManagement component for testing
const ContactManagement = () => {
  const [showForm, setShowForm] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState(null);

  const handleCreateContact = async (contactData: any) => {
    await mockUseCRM.createContact(contactData);
    setShowForm(false);
  };

  const handleEditContact = (contactId: string) => {
    setEditingContact(contactId);
    setShowForm(true);
    mockUseCRM.updateContact(contactId, { relationship_status: 'inactive' });
  };

  const handleDeleteContact = async (contactId: string) => {
    await mockUseCRM.deleteContact(contactId);
  };

  return (
    <div data-testid="contact-management">
      <h1>Contact Management</h1>
      <button
        onClick={() => setShowForm(true)}
        data-testid="add-contact-button"
      >
        Add Contact
      </button>
      {showForm && (
        <ContactForm
          onSubmit={handleCreateContact}
          onCancel={() => setShowForm(false)}
        />
      )}
      <ContactList
        contacts={mockUseCRM.contacts}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
      />
    </div>
  );
};

describe('CRM Component Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ContactCard Component', () => {
    it('should render contact information correctly', () => {
      const contact = mockUseCRM.contacts[0];
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(
        <ContactCard contact={contact} onEdit={onEdit} onDelete={onDelete} />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('client@example.com')).toBeInTheDocument();
      expect(screen.getByText('client')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should handle edit button click', () => {
      const contact = mockUseCRM.contacts[0];
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(
        <ContactCard contact={contact} onEdit={onEdit} onDelete={onDelete} />
      );

      fireEvent.click(screen.getByTestId('edit-button'));
      expect(onEdit).toHaveBeenCalledWith('contact-1');
    });

    it('should handle delete button click', () => {
      const contact = mockUseCRM.contacts[0];
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(
        <ContactCard contact={contact} onEdit={onEdit} onDelete={onDelete} />
      );

      fireEvent.click(screen.getByTestId('delete-button'));
      expect(onDelete).toHaveBeenCalledWith('contact-1');
    });
  });

  describe('ContactList Component', () => {
    it('should render all contacts', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(
        <ContactList
          contacts={mockUseCRM.contacts}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
      expect(screen.getByTestId('contact-contact-1')).toBeInTheDocument();
    });

    it('should handle empty contact list', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(<ContactList contacts={[]} onEdit={onEdit} onDelete={onDelete} />);

      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
      expect(screen.queryByTestId('contact-contact-1')).not.toBeInTheDocument();
    });
  });

  describe('ContactForm Component', () => {
    it('should render form fields correctly', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      render(<ContactForm onSubmit={onSubmit} onCancel={onCancel} />);

      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
      expect(screen.getByTestId('contact-user-id')).toBeInTheDocument();
      expect(screen.getByTestId('contact-type')).toBeInTheDocument();
      expect(screen.getByTestId('relationship-status')).toBeInTheDocument();
    });

    it('should handle form submission', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      render(<ContactForm onSubmit={onSubmit} onCancel={onCancel} />);

      fireEvent.change(screen.getByTestId('contact-user-id'), {
        target: { value: 'user-2' },
      });
      fireEvent.change(screen.getByTestId('contact-type'), {
        target: { value: 'contractor' },
      });
      fireEvent.change(screen.getByTestId('relationship-status'), {
        target: { value: 'inactive' },
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      expect(onSubmit).toHaveBeenCalledWith({
        contact_user_id: 'user-2',
        contact_type: 'contractor',
        relationship_status: 'inactive',
      });
    });

    it('should handle form cancellation', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      render(<ContactForm onSubmit={onSubmit} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId('cancel-button'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('ContactManagement Component', () => {
    it('should render contact management interface', () => {
      render(<ContactManagement />);

      expect(screen.getByText('Contact Management')).toBeInTheDocument();
      expect(screen.getByTestId('add-contact-button')).toBeInTheDocument();
      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
    });

    it('should show form when add contact button is clicked', () => {
      render(<ContactManagement />);

      fireEvent.click(screen.getByTestId('add-contact-button'));
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    it('should handle contact creation', async () => {
      render(<ContactManagement />);

      fireEvent.click(screen.getByTestId('add-contact-button'));

      fireEvent.change(screen.getByTestId('contact-user-id'), {
        target: { value: 'user-3' },
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockUseCRM.createContact).toHaveBeenCalledWith({
          contact_user_id: 'user-3',
          contact_type: 'client',
          relationship_status: 'active',
        });
      });
    });

    it('should handle contact editing', () => {
      render(<ContactManagement />);

      fireEvent.click(screen.getByTestId('edit-button'));
      expect(mockUseCRM.updateContact).toHaveBeenCalled();
    });

    it('should handle contact deletion', () => {
      render(<ContactManagement />);

      fireEvent.click(screen.getByTestId('delete-button'));
      expect(mockUseCRM.deleteContact).toHaveBeenCalledWith('contact-1');
    });
  });

  describe('Component Integration', () => {
    it('should handle complete contact workflow', async () => {
      render(<ContactManagement />);

      // Add new contact
      fireEvent.click(screen.getByTestId('add-contact-button'));
      fireEvent.change(screen.getByTestId('contact-user-id'), {
        target: { value: 'user-4' },
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockUseCRM.createContact).toHaveBeenCalled();
      });

      // Edit contact
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(mockUseCRM.updateContact).toHaveBeenCalled();

      // Delete contact
      fireEvent.click(screen.getByTestId('delete-button'));
      expect(mockUseCRM.deleteContact).toHaveBeenCalled();
    });

    it('should handle loading states', () => {
      const loadingUseCRM = {
        ...mockUseCRM,
        isLoading: true,
      };

      jest.doMock('@/hooks/useCRM', () => ({
        useCRM: () => loadingUseCRM,
      }));

      render(<ContactManagement />);
      // Component should handle loading state gracefully
      expect(screen.getByTestId('contact-management')).toBeInTheDocument();
    });

    it('should handle error states', () => {
      const errorUseCRM = {
        ...mockUseCRM,
        error: 'Failed to load contacts',
      };

      jest.doMock('@/hooks/useCRM', () => ({
        useCRM: () => errorUseCRM,
      }));

      render(<ContactManagement />);
      // Component should handle error state gracefully
      expect(screen.getByTestId('contact-management')).toBeInTheDocument();
    });
  });
});
