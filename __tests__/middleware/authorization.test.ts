import { handleAuthzError } from '@/lib/middleware/authorization';

describe('Authorization Middleware', () => {
  // Note: Authorization functions are complex due to Supabase mocking
  // The functions are tested through integration tests in the API routes

  describe('handleAuthzError', () => {
    it('should return 404 for resource not found', () => {
      const error = new Error('Event not found');
      const response = handleAuthzError(error);

      expect(response.status).toBe(404);
    });

    it('should return 403 for unauthorized access', () => {
      const error = new Error('Unauthorized access');
      const response = handleAuthzError(error);

      expect(response.status).toBe(403);
    });

    it('should return 403 for contractor not verified', () => {
      const error = new Error('Contractor not verified');
      const response = handleAuthzError(error);

      expect(response.status).toBe(403);
    });

    it('should return 500 for other errors', () => {
      const error = new Error('Some other error');
      const response = handleAuthzError(error);

      expect(response.status).toBe(500);
    });
  });
});
