import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegister } from '@/hooks/useAuth';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['client', 'pharmacy_seller', 'pharmacy_owner']).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useRegister();

  // Registration form
  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'client',
    },
  });

  const handleRegister = async (data: RegisterData) => {
    try {
      const result = await registerMutation.mutateAsync(data);
      if (result.success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const goBackToRegister = () => {
    setRegistrationStep('register');
    setSessionId(null);
    setRegistrationData(null);
    otpForm.reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {registrationStep === 'register' ? 'Create Account' : 'Verify Email'}
        </CardTitle>
        <CardDescription>
          {registrationStep === 'register' 
            ? 'Join UzPharm Digital platform'
            : 'Enter the verification code sent to your email'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {registrationStep === 'register' ? (
          <form onSubmit={registerForm.handleSubmit(handleRegisterStart)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...registerForm.register('firstName')}
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...registerForm.register('lastName')}
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...registerForm.register('email')}
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+998 XX XXX XX XX"
                {...registerForm.register('phone')}
              />
              {registerForm.formState.errors.phone && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select onValueChange={(value) => registerForm.setValue('role', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client - Regular user</SelectItem>
                  <SelectItem value="pharmacy_seller">Pharmacy Seller - Staff member</SelectItem>
                  <SelectItem value="pharmacy_owner">Pharmacy Owner - Business owner</SelectItem>
                </SelectContent>
              </Select>
              {registerForm.formState.errors.role && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  {...registerForm.register('password')}
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
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...registerForm.register('confirmPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerStartMutation.isPending}
            >
              {registerStartMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit verification code to <strong>{registrationData?.email}</strong>
              </p>
            </div>

            <form onSubmit={otpForm.handleSubmit(handleOTPVerify)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  {...otpForm.register('code')}
                />
                {otpForm.formState.errors.code && (
                  <p className="text-sm text-red-600">
                    {otpForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={otpVerifyMutation.isPending || registerCompleteMutation.isPending}
                >
                  {otpVerifyMutation.isPending || registerCompleteMutation.isPending 
                    ? 'Verifying...' 
                    : 'Verify & Complete Registration'
                  }
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={goBackToRegister}
                >
                  Change Email Address
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}