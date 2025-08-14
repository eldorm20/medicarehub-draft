import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

interface OTPRequestData {
  email?: string;
  phone?: string;
}

interface OTPVerifyData {
  sessionId: string;
  code: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user?.user,
    error
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      return apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate auth query to refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        toast({
          title: "Login Successful",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      return apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate auth query to refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        toast({
          title: "Registration Successful",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
    },
  });
}



export function useOTPRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OTPRequestData): Promise<{ success: boolean; message: string; sessionId?: string; expiresAt?: Date }> => {
      return apiRequest('/api/auth/login/otp/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "OTP Sent",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "OTP Request Failed",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });
}

export function useOTPVerify() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OTPVerifyData): Promise<{ success: boolean; message: string; email?: string; phone?: string }> => {
      return apiRequest('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "OTP Verified",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    },
  });
}

export function useOTPLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<AuthResponse> => {
      return apiRequest('/api/auth/login/otp/complete', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate auth query to refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        toast({
          title: "Login Successful",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "OTP Login Failed",
        description: error.message || "Failed to login with OTP",
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      return apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Clear all cached data
        queryClient.clear();
        toast({
          title: "Logout Successful",
          description: data.message,
        });
        // Optionally redirect to login page
        window.location.href = '/';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });
}

export function usePasswordReset() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string): Promise<{ success: boolean; message: string; sessionId?: string }> => {
      return apiRequest('/api/auth/password/reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Password Reset",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to initiate password reset",
        variant: "destructive",
      });
    },
  });
}

export function usePasswordResetComplete() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { sessionId: string; email: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
      return apiRequest('/api/auth/password/reset/complete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Password Reset Successful",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });
}

// Role-based access control helper
export function useRoleCheck() {
  const { user } = useAuth();

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      'super_admin': 4,
      'pharmacy_owner': 3,
      'pharmacy_seller': 2,
      'client': 1
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const isClient = (): boolean => hasRole('client');
  const isSeller = (): boolean => hasRole('pharmacy_seller');
  const isOwner = (): boolean => hasRole('pharmacy_owner');
  const isAdmin = (): boolean => hasRole('super_admin');

  return {
    hasRole,
    isClient,
    isSeller,
    isOwner,
    isAdmin,
    userRole: user?.role
  };
}