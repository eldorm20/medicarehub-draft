import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
      return;
    }

    // Add user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const hasPermission = allowedRoles.some(role => 
        authService.hasPermission(req.user!.role, role)
      );

      if (!hasPermission) {
        res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authorization failed' 
      });
    }
  };
};

// Optional authentication (doesn't require login)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = authService.verifyAccessToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

// Rate limiting for authentication endpoints
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes

export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const attempts = authAttempts.get(clientId);
  
  if (attempts) {
    // Reset if window has passed
    if (now - attempts.lastAttempt > AUTH_WINDOW) {
      authAttempts.delete(clientId);
    } else if (attempts.count >= MAX_AUTH_ATTEMPTS) {
      res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
      });
      return;
    }
  }
  
  next();
};

// Track failed authentication attempts
export const trackAuthFailure = (req: Request): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const attempts = authAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = now;
  
  authAttempts.set(clientId, attempts);
};

// Clear successful authentication attempts
export const clearAuthFailures = (req: Request): void => {
  const clientId = req.ip || 'unknown';
  authAttempts.delete(clientId);
};