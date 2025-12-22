import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CSRFConfig {
  secretKey: string;
  tokenExpiry: number; // in milliseconds
  cookieName: string;
  headerName: string;
}

export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config: CSRFConfig) {
    this.config = config;
  }

  async generateToken(req: NextRequest): Promise<string> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const tokenData = `${user.id}:${timestamp}:${randomString}`;
    const token = await this.hashToken(tokenData);

    return token;
  }

  async validateToken(req: NextRequest, token: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      // Check if token is in the correct format
      if (!token || typeof token !== 'string') {
        return false;
      }

      // For now, we'll use a simple validation
      // In production, you'd want to store tokens in a secure session store
      const expectedToken = await this.generateToken(req);
      return token === expectedToken;
    } catch (error) {
      console.error('CSRF token validation error:', error);
      return false;
    }
  }

  private async hashToken(tokenData: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData + this.config.secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getTokenFromRequest(req: NextRequest): string | null {
    // Handle build-time when headers/cookies might be undefined
    if (!req || !req.headers || !req.cookies) {
      return null;
    }

    // Try to get token from header first
    const headerToken = req.headers.get(this.config.headerName);
    if (headerToken) {
      return headerToken;
    }

    // Try to get token from cookie
    const cookieToken = req.cookies.get(this.config.cookieName)?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}

// CSRF middleware
export async function withCSRFProtection(
  req: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return handler();
  }

  const csrfProtection = new CSRFProtection({
    secretKey: process.env.CSRF_SECRET_KEY || 'default-secret-key',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
  });

  const token = csrfProtection.getTokenFromRequest(req);

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'CSRF token missing',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const isValid = await csrfProtection.validateToken(req, token);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid CSRF token',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return handler();
}

// Generate CSRF token endpoint
export async function generateCSRFToken(req: NextRequest): Promise<Response> {
  try {
    const csrfProtection = new CSRFProtection({
      secretKey: process.env.CSRF_SECRET_KEY || 'default-secret-key',
      tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token',
    });

    const token = await csrfProtection.generateToken(req);

    return new Response(
      JSON.stringify({
        success: true,
        token,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `csrf-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to generate CSRF token',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
