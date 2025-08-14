import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { emailService } from './emailService';
import { smsService } from './smsService';
import type { User } from '@shared/schema';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
}

interface OTPData {
  code: string;
  email?: string;
  phone?: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export class AuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly otpStorage = new Map<string, OTPData>();
  private readonly maxOtpAttempts = 3;
  private readonly otpExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: Omit<JWTPayload, 'tokenType'> = {
      userId: user.id,
      email: user.email || '',
      role: user.role
    };

    const accessToken = jwt.sign(
      { ...payload, tokenType: 'access' },
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenType: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  // Verify access token
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      return decoded.tokenType === 'access' ? decoded : null;
    } catch {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
      return decoded.tokenType === 'refresh' ? decoded : null;
    } catch {
      return null;
    }
  }

  // Send OTP via email
  async sendEmailOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const otp = this.generateOTP();
      const key = `email:${email}`;
      
      this.otpStorage.set(key, {
        code: otp,
        email,
        expiresAt: new Date(Date.now() + this.otpExpiry),
        attempts: 0,
        verified: false
      });

      await emailService.sendOTPEmail(email, otp);
      
      return {
        success: true,
        message: 'OTP sent to your email address'
      };
    } catch (error) {
      console.error('Email OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP email'
      };
    }
  }

  // Send OTP via SMS
  async sendSMSOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const otp = this.generateOTP();
      const key = `sms:${phone}`;
      
      this.otpStorage.set(key, {
        code: otp,
        phone,
        expiresAt: new Date(Date.now() + this.otpExpiry),
        attempts: 0,
        verified: false
      });

      await smsService.sendOTP(phone, otp);
      
      return {
        success: true,
        message: 'OTP sent to your phone number'
      };
    } catch (error) {
      console.error('SMS OTP error:', error);
      return {
        success: false,
        message: 'Failed to send SMS OTP'
      };
    }
  }

  // Verify OTP
  verifyOTP(email: string | undefined, phone: string | undefined, code: string): boolean {
    const key = email ? `email:${email}` : `sms:${phone}`;
    const otpData = this.otpStorage.get(key);

    if (!otpData) {
      return false;
    }

    if (otpData.expiresAt < new Date()) {
      this.otpStorage.delete(key);
      return false;
    }

    if (otpData.attempts >= this.maxOtpAttempts) {
      this.otpStorage.delete(key);
      return false;
    }

    otpData.attempts++;

    if (otpData.code === code) {
      otpData.verified = true;
      return true;
    }

    return false;
  }

  // Register user with OTP verification
  async register(userData: {
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: string;
    otpCode: string;
  }): Promise<{ success: boolean; user?: User; tokens?: { accessToken: string; refreshToken: string }; message: string }> {
    try {
      // Verify OTP first
      if (!this.verifyOTP(userData.email, userData.phone, userData.otpCode)) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email || '');
      if (existingUser) {
        return {
          success: false,
          message: 'User already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await storage.upsertUser({
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: hashedPassword,
        role: userData.role as any || 'client',
        isActive: true,
        emailVerified: !!userData.email,
        phoneVerified: !!userData.phone
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Clean up OTP
      const key = userData.email ? `email:${userData.email}` : `sms:${userData.phone}`;
      this.otpStorage.delete(key);

      return {
        success: true,
        user,
        tokens,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  // Login user
  async login(emailOrPhone: string, password: string): Promise<{ success: boolean; user?: User; tokens?: { accessToken: string; refreshToken: string }; message: string }> {
    try {
      // Find user by email or phone
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Check password
      if (!user.passwordHash || !await this.comparePassword(password, user.passwordHash)) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        success: true,
        user,
        tokens,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<{ success: boolean; tokens?: { accessToken: string; refreshToken: string }; message: string }> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      const tokens = this.generateTokens(user);
      return {
        success: true,
        tokens,
        message: 'Tokens refreshed successfully'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }

  // Forgot password - send reset OTP
  async forgotPassword(emailOrPhone: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      if (!user) {
        // Return success to prevent email enumeration
        return {
          success: true,
          message: 'If the account exists, a reset code has been sent'
        };
      }

      const isEmail = emailOrPhone.includes('@');
      if (isEmail && user.email) {
        return await this.sendEmailOTP(user.email);
      } else if (!isEmail && user.phone) {
        return await this.sendSMSOTP(user.phone);
      }

      return {
        success: false,
        message: 'Unable to send reset code'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to process password reset request'
      };
    }
  }

  // Reset password with OTP
  async resetPassword(emailOrPhone: string, otpCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify OTP
      const isEmail = emailOrPhone.includes('@');
      if (!this.verifyOTP(isEmail ? emailOrPhone : undefined, isEmail ? undefined : emailOrPhone, otpCode)) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Find user
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);

      // Clean up OTP
      const key = isEmail ? `email:${emailOrPhone}` : `sms:${emailOrPhone}`;
      this.otpStorage.delete(key);

      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Password reset failed'
      };
    }
  }

  // Check permissions based on role
  hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'client': 1,
      'pharmacy_seller': 2,
      'pharmacy_owner': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }
}

export const authService = new AuthService();