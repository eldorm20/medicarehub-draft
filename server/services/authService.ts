import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from '../storage';
import { emailService } from './emailService';
import { smsService } from './smsService';
import type { User } from '@shared/schema';

interface OTPSession {
  email?: string;
  phone?: string;
  code: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

class AuthService {
  private otpSessions = new Map<string, OTPSession>();
  private blacklistedTokens = new Set<string>();
  
  // JWT secrets - in production these should be from environment
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  
  // Token expiration times
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  
  // OTP configuration
  private readonly otpLength = 6;
  private readonly otpExpiry = 5 * 60 * 1000; // 5 minutes
  private readonly maxOtpAttempts = 3;

  /**
   * Generate a secure OTP code
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

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
   * Send OTP via email
   */
  async sendEmailOTP(email: string): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionId = crypto.randomUUID();
    const code = this.generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.otpExpiry);

    const session: OTPSession = {
      email,
      code,
      attempts: 0,
      createdAt: now,
      expiresAt,
      verified: false
    };

    this.otpSessions.set(sessionId, session);

    // Send email with OTP (with console fallback for development)
    try {
      await emailService.sendOTP(email, code);
      console.log(`[DEV] Email OTP sent to ${email}: ${code}`);
    } catch (error) {
      console.log(`[DEV] Email failed, OTP for ${email}: ${code}`);
    }

    return { sessionId, expiresAt };
  }

  /**
   * Send OTP via SMS
   */
  async sendSMSOTP(phone: string): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionId = crypto.randomUUID();
    const code = this.generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.otpExpiry);

    const session: OTPSession = {
      phone,
      code,
      attempts: 0,
      createdAt: now,
      expiresAt,
      verified: false
    };

    this.otpSessions.set(sessionId, session);

    // Send SMS with OTP (with console fallback for development)
    try {
      await smsService.sendOTP(phone, code);
      console.log(`[DEV] SMS OTP sent to ${phone}: ${code}`);
    } catch (error) {
      console.log(`[DEV] SMS failed, OTP for ${phone}: ${code}`);
    }

    return { sessionId, expiresAt };
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(sessionId: string, code: string): Promise<{ success: boolean; message: string; email?: string; phone?: string }> {
    const session = this.otpSessions.get(sessionId);
    
    if (!session) {
      return { success: false, message: 'Invalid or expired OTP session' };
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.otpSessions.delete(sessionId);
      return { success: false, message: 'OTP has expired' };
    }

    // Check if already verified
    if (session.verified) {
      return { success: false, message: 'OTP already used' };
    }

    // Check attempts
    if (session.attempts >= this.maxOtpAttempts) {
      this.otpSessions.delete(sessionId);
      return { success: false, message: 'Too many failed attempts' };
    }

    // Increment attempts
    session.attempts++;

    // Verify code
    if (session.code !== code) {
      return { success: false, message: 'Invalid OTP code' };
    }

    // Mark as verified
    session.verified = true;

    return { 
      success: true, 
      message: 'OTP verified successfully',
      email: session.email,
      phone: session.phone
    };
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
   * Register new user with email verification
   */
  async registerWithEmail(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<{ success: boolean; message: string; sessionId?: string }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Send OTP for verification
      const { sessionId } = await this.sendEmailOTP(data.email);

      // Store user data temporarily (you might want to use a separate temporary storage)
      // For now, we'll require OTP verification before creating the user

      return { 
        success: true, 
        message: 'OTP sent to your email address',
        sessionId 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  /**
   * Complete registration after OTP verification
   */
  async completeRegistration(sessionId: string, userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const session = this.otpSessions.get(sessionId);
      if (!session || !session.verified || session.email !== userData.email) {
        return { success: false, message: 'Invalid or unverified session' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user
      const user = await storage.upsertUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role as any || 'client',
        passwordHash,
        emailVerified: true,
        isActive: true
      });

      // Clean up session
      this.otpSessions.delete(sessionId);

      return { success: true, message: 'Registration completed successfully', user };
    } catch (error) {
      console.error('Complete registration error:', error);
      return { success: false, message: 'Registration completion failed' };
    }
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
        return { success: false, message: 'Please use OTP login for this account' };
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
   * Login with OTP (passwordless)
   */
  async loginWithOTP(sessionId: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const session = this.otpSessions.get(sessionId);
      if (!session || !session.verified) {
        return { success: false, message: 'Invalid or unverified session' };
      }

      const identifier = session.email || session.phone;
      if (!identifier) {
        return { success: false, message: 'Invalid session data' };
      }

      const user = await storage.getUserByEmailOrPhone(identifier);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Account is deactivated' };
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Clean up session
      this.otpSessions.delete(sessionId);

      return {
        success: true,
        message: 'Login successful',
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('OTP login error:', error);
      return { success: false, message: 'OTP login failed' };
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
   * Send password reset OTP
   */
  async sendPasswordResetOTP(email: string): Promise<{ success: boolean; message: string; sessionId?: string }> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists
        return { success: true, message: 'If the email exists, you will receive a reset code' };
      }

      const { sessionId } = await this.sendEmailOTP(email);

      return {
        success: true,
        message: 'Password reset code sent to your email',
        sessionId
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Failed to send reset code' };
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(sessionId: string, email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = this.otpSessions.get(sessionId);
      if (!session || !session.verified || session.email !== email) {
        return { success: false, message: 'Invalid or unverified session' };
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const passwordHash = await this.hashPassword(newPassword);
      await storage.updateUserPassword(user.id, passwordHash);

      // Clean up session
      this.otpSessions.delete(sessionId);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Password reset failed' };
    }
  }

  /**
   * Clean up expired OTP sessions (should be called periodically)
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.otpSessions) {
      if (now > session.expiresAt) {
        this.otpSessions.delete(sessionId);
      }
    }
  }
}

export const authService = new AuthService();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  authService.cleanupExpiredSessions();
}, 5 * 60 * 1000);