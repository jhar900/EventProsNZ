import { renderHook, act } from '@testing-library/react';
import { useCRM } from '@/hooks/useCRM';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'user-1' } } })
      ),
    },
  })),
}));

describe('useCRM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('loadContacts', () => {
    it('should load contacts successfully', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          contact_type: 'contractor',
          relationship_status: 'active',
          last_interaction: '2024-12-22T10:00:00Z',
          interaction_count: 5,
          contact_user: {
            id: 'user-2',
            email: 'contractor@example.com',
            role: 'contractor',
          },
          contact_profile: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '+64 21 123 4567',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            contacts: mockContacts,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.loadContacts({ page: 1, limit: 20 });
      });

      expect(result.current.contacts).toEqual(mockContacts);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Failed to fetch contacts',
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.loadContacts({ page: 1, limit: 20 });
      });

      expect(result.current.contacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch contacts');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.loadContacts({ page: 1, limit: 20 });
      });

      expect(result.current.contacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('createContact', () => {
    it('should create contact successfully', async () => {
      const mockContact = {
        id: 'contact-1',
        contact_user_id: 'user-2',
        contact_type: 'contractor',
        relationship_status: 'active',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            contact: mockContact,
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.createContact({
          contact_user_id: 'user-2',
          contact_type: 'contractor',
          relationship_status: 'active',
        });
      });

      expect(result.current.contacts).toContain(mockContact);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Failed to create contact',
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.createContact({
          contact_user_id: 'user-2',
          contact_type: 'contractor',
          relationship_status: 'active',
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to create contact');
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      const mockContact = {
        id: 'contact-1',
        contact_user_id: 'user-2',
        contact_type: 'contractor',
        relationship_status: 'inactive',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            contact: mockContact,
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.updateContact('contact-1', {
          relationship_status: 'inactive',
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle update errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Failed to update contact',
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.updateContact('contact-1', {
          relationship_status: 'inactive',
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to update contact');
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: 'Contact deleted successfully',
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.deleteContact('contact-1');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle deletion errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Failed to delete contact',
          }),
      });

      const { result } = renderHook(() => useCRM());

      await act(async () => {
        await result.current.deleteContact('contact-1');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to delete contact');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useCRM());

      // Set an error first
      await act(async () => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('loading states', () => {
    it('should set loading state during operations', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useCRM());

      act(() => {
        result.current.loadContacts({ page: 1, limit: 20 });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
