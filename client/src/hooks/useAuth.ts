import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

interface LoginData {
  emailOrPhone: string;
  password: string;
}

interface RegisterData {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  otpCode: string;
  role?: string;
}

interface OTPRequest {
  email?: string;
  phone?: string;
  type: 'email' | 'sms';
}

interface ForgotPasswordData {
  emailOrPhone: string;
}

interface ResetPasswordData {
  emailOrPhone: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    select: (data: AuthResponse) => data.user,
  });

  // Request OTP mutation
  const requestOTPMutation = useMutation({
    mutationFn: async (data: OTPRequest) => {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Refresh tokens (automatic)
  const refreshTokens = async () => {
    try {
      await fetch('/api/auth/refresh', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  };

  return {
    // State
    user,
    isLoading,
    isAuthenticated: !!user,
    error,

    // Actions
    requestOTP: requestOTPMutation.mutate,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    refreshTokens,

    // Mutation states
    isRequestingOTP: requestOTPMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isForgettingPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,

    // Mutation results
    requestOTPResult: requestOTPMutation.data,
    registerResult: registerMutation.data,
    loginResult: loginMutation.data,
    forgotPasswordResult: forgotPasswordMutation.data,
    resetPasswordResult: resetPasswordMutation.data,

    // Errors
    requestOTPError: requestOTPMutation.error,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    forgotPasswordError: forgotPasswordMutation.error,
    resetPasswordError: resetPasswordMutation.error,
  };
}