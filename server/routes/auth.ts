import { Router } from 'express';
import { authService } from '../services/authService';
import { authenticate, authRateLimit, trackAuthFailure, clearAuthFailures } from '../middleware/auth';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Request OTP for registration/login
router.post('/request-otp', authRateLimit, async (req, res) => {
  try {
    const { email, phone, type } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    if (type === 'email' && email) {
      const result = await authService.sendEmailOTP(email);
      res.json(result);
    } else if (type === 'sms' && phone) {
      const result = await authService.sendSMSOTP(phone);
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP type or missing contact info'
      });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Register new user
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const registrationSchema = insertUserSchema.extend({
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
      otpCode: z.string().length(6, 'OTP must be 6 digits')
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });

    const validatedData = registrationSchema.parse(req.body);

    const result = await authService.register({
      email: validatedData.email || undefined,
      phone: validatedData.phone || undefined,
      firstName: validatedData.firstName || '',
      lastName: validatedData.lastName || '',
      password: validatedData.password,
      role: validatedData.role,
      otpCode: validatedData.otpCode
    });

    if (result.success && result.tokens) {
      // Set httpOnly cookies for tokens
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      clearAuthFailures(req);
    } else {
      trackAuthFailure(req);
    }

    res.json({
      success: result.success,
      message: result.message,
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      } : undefined
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Registration error:', error);
    trackAuthFailure(req);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const loginSchema = z.object({
      emailOrPhone: z.string().min(1, 'Email or phone is required'),
      password: z.string().min(1, 'Password is required')
    });

    const { emailOrPhone, password } = loginSchema.parse(req.body);

    const result = await authService.login(emailOrPhone, password);

    if (result.success && result.tokens) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      clearAuthFailures(req);
    } else {
      trackAuthFailure(req);
    }

    res.json({
      success: result.success,
      message: result.message,
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      } : undefined
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Login error:', error);
    trackAuthFailure(req);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Refresh tokens
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const result = await authService.refreshTokens(refreshToken);

    if (result.success && result.tokens) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Forgot password
router.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    const result = await authService.forgotPassword(emailOrPhone);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// Reset password
router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const resetSchema = z.object({
      emailOrPhone: z.string().min(1, 'Email or phone is required'),
      otpCode: z.string().length(6, 'OTP must be 6 digits'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string()
    }).refine(data => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });

    const { emailOrPhone, otpCode, newPassword } = resetSchema.parse(req.body);

    const result = await authService.resetPassword(emailOrPhone, otpCode, newPassword);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

export default router;