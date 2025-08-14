import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogin, useOTPRequest, useOTPVerify, useOTPLogin } from '@/hooks/useAuth';
import { Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const passwordLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
}).refine(data => data.email || data.phone, {
  message: "Please provide either email or phone number"
});

const otpVerifySchema = z.object({
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type OTPRequestData = z.infer<typeof otpRequestSchema>;
type OTPVerifyData = z.infer<typeof otpVerifySchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'complete'>('request');
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone'>('email');

  const loginMutation = useLogin();
  const otpRequestMutation = useOTPRequest();
  const otpVerifyMutation = useOTPVerify();
  const otpLoginMutation = useOTPLogin();

  // Password login form
  const passwordForm = useForm<PasswordLoginData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // OTP request form
  const otpRequestForm = useForm<OTPRequestData>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  });

  // OTP verification form
  const otpVerifyForm = useForm<OTPVerifyData>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      code: '',
    },
  });

  const handlePasswordLogin = async (data: PasswordLoginData) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      if (result.success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOTPRequest = async (data: OTPRequestData) => {
    try {
      const requestData = otpMethod === 'email' 
        ? { email: data.email } 
        : { phone: data.phone };
      
      const result = await otpRequestMutation.mutateAsync(requestData);
      if (result.success && result.sessionId) {
        setOtpSessionId(result.sessionId);
        setOtpStep('verify');
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOTPVerify = async (data: OTPVerifyData) => {
    if (!otpSessionId) return;

    try {
      const result = await otpVerifyMutation.mutateAsync({
        sessionId: otpSessionId,
        code: data.code,
      });
      
      if (result.success) {
        setOtpStep('complete');
        // Automatically complete login
        const loginResult = await otpLoginMutation.mutateAsync(otpSessionId);
        if (loginResult.success && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetOTPFlow = () => {
    setOtpStep('request');
    setOtpSessionId(null);
    otpRequestForm.reset();
    otpVerifyForm.reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your UzPharm Digital account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">OTP Login</TabsTrigger>
          </TabsList>

          {/* Password Login Tab */}
          <TabsContent value="password">
            <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...passwordForm.register('email')}
                />
                {passwordForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...passwordForm.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          {/* OTP Login Tab */}
          <TabsContent value="otp">
            {otpStep === 'request' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={otpMethod === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOtpMethod('email')}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={otpMethod === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOtpMethod('phone')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </Button>
                </div>

                <form onSubmit={otpRequestForm.handleSubmit(handleOTPRequest)} className="space-y-4">
                  {otpMethod === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="Enter your email"
                        {...otpRequestForm.register('email')}
                      />
                      {otpRequestForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {otpRequestForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp-phone">Phone Number</Label>
                      <Input
                        id="otp-phone"
                        type="tel"
                        placeholder="+998 XX XXX XX XX"
                        {...otpRequestForm.register('phone')}
                      />
                      {otpRequestForm.formState.errors.phone && (
                        <p className="text-sm text-red-600">
                          {otpRequestForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={otpRequestMutation.isPending}
                  >
                    {otpRequestMutation.isPending ? 'Sending...' : 'Send OTP'}
                  </Button>
                </form>
              </div>
            )}

            {otpStep === 'verify' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    We've sent a 6-digit code to your {otpMethod}. Enter it below to continue.
                  </p>
                </div>

                <form onSubmit={otpVerifyForm.handleSubmit(handleOTPVerify)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest"
                      {...otpVerifyForm.register('code')}
                    />
                    {otpVerifyForm.formState.errors.code && (
                      <p className="text-sm text-red-600">
                        {otpVerifyForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={otpVerifyMutation.isPending || otpLoginMutation.isPending}
                    >
                      {otpVerifyMutation.isPending || otpLoginMutation.isPending 
                        ? 'Verifying...' 
                        : 'Verify & Sign In'
                      }
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={resetOTPFlow}
                    >
                      Use different {otpMethod === 'email' ? 'email' : 'phone'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}