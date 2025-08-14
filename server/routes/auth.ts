import express from 'express';
import { authService } from '../services/authService';
import { authenticate, authRateLimit, trackAuthFailure, clearAuthFailures } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Apply rate limiting to all auth endpoints
router.use(authRateLimit);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['client', 'pharmacy_seller', 'pharmacy_owner', 'super_admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const passwordResetSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

/**
 * Direct registration with email and password
 */
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.error.errors
      });
    }

    const result = await authService.registerUser(validation.data);

    if (result.success && result.user) {
      const accessToken = authService.generateAccessToken(result.user);
      const refreshToken = authService.generateRefreshToken(result.user);

      // Set httpOnly cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          isActive: result.user.isActive
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/**
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      trackAuthFailure(req);
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.error.errors
      });
    }

    const result = await authService.loginWithPassword(
      validation.data.email,
      validation.data.password
    );

    if (result.success && result.user && result.accessToken && result.refreshToken) {
      clearAuthFailures(req);

      // Set httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          isActive: result.user.isActive
        }
      });
    } else {
      trackAuthFailure(req);
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    trackAuthFailure(req);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});



/**
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    if (result.success && result.accessToken) {
      // Set new access token cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

/**
 * Logout
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken && refreshToken) {
      authService.logout(accessToken, refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * Get current user info
 */
router.get('/me', authenticate, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        userId: req.user.userId,
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

/**
 * Reset password (simplified without OTP)
 */
router.post('/password/reset', async (req, res) => {
  try {
    const validation = passwordResetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.error.errors
      });
    }

    const result = await authService.resetPassword(
      validation.data.email,
      validation.data.newPassword
    );

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

export default router;