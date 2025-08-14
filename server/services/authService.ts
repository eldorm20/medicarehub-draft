import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import type { User } from '@shared/schema';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

class AuthService {
  private blacklistedTokens = new Set<string>();
  
  // JWT secrets - in production these should be from environment
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  
  // Token expiration times
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';



  /**
   * Generate access token
   */
  generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email!,
      role: user.role,
      type: 'access'
    };
    
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'uzpharm-digital',
      audience: 'uzpharm-users'
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email!,
      role: user.role,
      type: 'refresh'
    };
    
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'uzpharm-digital',
      audience: 'uzpharm-users'
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      if (this.blacklistedTokens.has(token)) {
        return null;
      }
      
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'uzpharm-digital',
        audience: 'uzpharm-users'
      }) as JWTPayload;
      
      return decoded.type === 'access' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      if (this.blacklistedTokens.has(token)) {
        return null;
      }
      
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'uzpharm-digital',
        audience: 'uzpharm-users'
      }) as JWTPayload;
      
      return decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token (for logout)
   */
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * Register a new user with email and password
   */
  async registerUser(userData: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user
      const newUser = await storage.upsertUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: (userData.role as any) || 'client',
        passwordHash,
        emailVerified: true, // No OTP verification needed
        isActive: true,
      });

      return {
        success: true,
        message: 'Registration successful',
        user: newUser
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }





  /**
   * Login with email and password
   */
  async loginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      if (!user.passwordHash) {
        return { success: false, message: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Account is deactivated' };
      }

      const isValid = await this.comparePassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login
      await storage.updateUserLastLogin(user.id);

      return {
        success: true,
        message: 'Login successful',
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }



  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
  }> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return { success: false, message: 'Invalid refresh token' };
      }

      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return { success: false, message: 'User not found or inactive' };
      }

      const accessToken = this.generateAccessToken(user);

      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  /**
   * Logout (blacklist tokens)
   */
  logout(accessToken: string, refreshToken: string): void {
    this.blacklistToken(accessToken);
    this.blacklistToken(refreshToken);
  }

  /**
   * Check user permissions based on role hierarchy
   */
  hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'super_admin': 4,
      'pharmacy_owner': 3,
      'pharmacy_seller': 2,
      'client': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Simple password reset (without OTP)
   */
  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists
        return { success: true, message: 'If the email exists, the password has been reset' };
      }

      const passwordHash = await this.hashPassword(newPassword);
      await storage.updateUserPassword(user.id, passwordHash);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Password reset failed' };
    }
  }
}

export const authService = new AuthService();