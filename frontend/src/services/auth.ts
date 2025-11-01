/**
 * Authentication Service
 * Replaces Supabase auth with MongoDB backend
 */

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export interface User {
  user_id: string;
  email: string;
  username?: string;
}

export interface Session {
  access_token: string;
  user: User;
}

export interface AuthResponse {
  data: {
    session: Session | null;
    user: User | null;
  };
  error: Error | null;
}

export interface SignUpData {
  email: string;
  password: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Auth service that mimics Supabase API for easy migration
 */
class AuthService {
  private TOKEN_KEY = 'golden_hooves_token';
  private USER_KEY = 'golden_hooves_user';

  /**
   * Sign up new user
   */
  async signUp({ email, password, username }: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      
      // Store token and user
      this.setSession(data.token, {
        user_id: data.user_id,
        email: data.email,
        username: data.username,
      });

      return {
        data: {
          session: {
            access_token: data.token,
            user: {
              user_id: data.user_id,
              email: data.email,
              username: data.username,
            },
          },
          user: {
            user_id: data.user_id,
            email: data.email,
            username: data.username,
          },
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: { session: null, user: null },
        error: error,
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signInWithPassword({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user
      this.setSession(data.token, {
        user_id: data.user_id,
        email: data.email,
        username: data.username,
      });

      return {
        data: {
          session: {
            access_token: data.token,
            user: {
              user_id: data.user_id,
              email: data.email,
              username: data.username,
            },
          },
          user: {
            user_id: data.user_id,
            email: data.email,
            username: data.username,
          },
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: { session: null, user: null },
        error: error,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Call backend logout endpoint (optional)
      const token = this.getToken();
      if (token) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      // Clear local storage
      this.clearSession();

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: Session | null }; error: Error | null }> {
    try {
      const token = this.getToken();
      const user = this.getUser();

      if (!token || !user) {
        return { data: { session: null }, error: null };
      }

      // Verify token is still valid
      const isValid = await this.verifyToken(token);
      if (!isValid) {
        this.clearSession();
        return { data: { session: null }, error: null };
      }

      return {
        data: {
          session: {
            access_token: token,
            user,
          },
        },
        error: null,
      };
    } catch (error: any) {
      return { data: { session: null }, error };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ data: { user: User | null }; error: Error | null }> {
    try {
      const user = this.getUser();
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: { user: null }, error };
    }
  }

  /**
   * Auth state change listener (for compatibility with Supabase)
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Simple implementation - check session on mount
    const checkSession = async () => {
      const { data } = await this.getSession();
      callback('SIGNED_IN', data.session);
    };

    checkSession();

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // Cleanup if needed
          },
        },
      },
    };
  }

  /**
   * Verify token with backend
   */
  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Store session in localStorage
   */
  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear session from localStorage
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get user from localStorage
   */
  private getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Export singleton instance
export const auth = new AuthService();

// Export client object that mimics Supabase structure
export const supabase = {
  auth: {
    signUp: (data: { email: string; password: string; options?: { data?: { username?: string } } }) => 
      auth.signUp({ 
        email: data.email, 
        password: data.password, 
        username: data.options?.data?.username 
      }),
    signInWithPassword: (data: { email: string; password: string }) => 
      auth.signInWithPassword(data),
    signOut: () => auth.signOut(),
    getSession: () => auth.getSession(),
    getUser: () => auth.getUser(),
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => 
      auth.onAuthStateChange(callback),
  },
};
