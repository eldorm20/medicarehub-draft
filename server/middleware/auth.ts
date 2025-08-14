import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

// Rate limiting store
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

// Blacklisted tokens (for logout)
const blacklistedTokens = new Set<string>();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Extract user info from JWT token
 */
function extractUserFromToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'uzpharm-digital-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware - requires valid JWT token
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    if (blacklistedTokens.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    const userInfo = extractUserFromToken(token);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Verify user still exists and is active
    const user = await storage.getUserByEmail(userInfo.email);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or inactive'
      });
    }

    // Attach user info to request
    req.user = userInfo;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (token && !blacklistedTokens.has(token)) {
      const userInfo = extractUserFromToken(token);
      if (userInfo) {
        const user = await storage.getUserByEmail(userInfo.email);
        if (user && user.isActive) {
          req.user = userInfo;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (requiredRoles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Role hierarchy
    const roleHierarchy: Record<string, number> = {
      'client': 1,
      'pharmacy_seller': 2,
      'pharmacy_owner': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[req.user.role] || 0;
    const hasAccess = roles.some(role => {
      const requiredLevel = roleHierarchy[role] || 0;
      return userLevel >= requiredLevel;
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = new Date();
  
  const attempts = failedAttempts.get(clientId);
  
  if (attempts) {
    // Reset counter if window has passed
    if (now.getTime() - attempts.lastAttempt.getTime() > RATE_LIMIT_WINDOW) {
      failedAttempts.delete(clientId);
    } else if (attempts.count >= MAX_FAILED_ATTEMPTS) {
      const timeLeft = RATE_LIMIT_WINDOW - (now.getTime() - attempts.lastAttempt.getTime());
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${Math.ceil(timeLeft / 60000)} minutes.`
      });
    }
  }
  
  next();
};

/**
 * Track failed authentication attempts
 */
export const trackAuthFailure = (req: Request) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = new Date();
  
  const attempts = failedAttempts.get(clientId);
  if (attempts) {
    attempts.count += 1;
    attempts.lastAttempt = now;
  } else {
    failedAttempts.set(clientId, { count: 1, lastAttempt: now });
  }
};

/**
 * Clear failed authentication attempts on successful login
 */
export const clearAuthFailures = (req: Request) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  failedAttempts.delete(clientId);
};

/**
 * Add token to blacklist (for logout)
 */
export const blacklistToken = (token: string) => {
  blacklistedTokens.add(token);
  
  // Clean up old tokens periodically (in production, use Redis with TTL)
  if (blacklistedTokens.size > 10000) {
    // Keep only the most recent 5000 tokens
    const tokensArray = Array.from(blacklistedTokens);
    blacklistedTokens.clear();
    tokensArray.slice(-5000).forEach(t => blacklistedTokens.add(t));
  }
};

/**
 * Client role check
 */
export const requireClient = authorize('client');

/**
 * Pharmacy seller role check
 */
export const requireSeller = authorize('pharmacy_seller');

/**
 * Pharmacy owner role check
 */
export const requireOwner = authorize('pharmacy_owner');

/**
 * Super admin role check
 */
export const requireAdmin = authorize('super_admin');

// Export the extended Request type for other files
export type { AuthRequest };