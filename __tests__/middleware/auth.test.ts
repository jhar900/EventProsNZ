import { handleAuthError } from '@/lib/middleware/auth';

describe('Authentication Middleware', () => {
  // Note: authenticateRequest tests are complex due to Supabase mocking
  // The function is tested through integration tests in the API routes

  describe('handleAuthError', () => {
    it('should return 401 for authentication required', () => {
      const error = new Error('Authentication required');
      const response = handleAuthError(error);

      expect(response.status).toBe(401);
    });

    it('should return 404 for user profile not found', () => {
      const error = new Error('User profile not found');
      const response = handleAuthError(error);

      expect(response.status).toBe(404);
    });

    it('should return 500 for other errors', () => {
      const error = new Error('Some other error');
      const response = handleAuthError(error);

      expect(response.status).toBe(500);
    });
  });
});
