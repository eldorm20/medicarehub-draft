import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, Mail, Phone, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  contactType: z.enum(['email', 'phone']),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+998\d{9}$/, 'Invalid Uzbekistan phone number (+998XXXXXXXXX)').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['client', 'pharmacy_seller', 'pharmacy_owner']).default('client'),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine(data => {
  if (data.contactType === 'email') return !!data.email;
  return !!data.phone;
}, {
  message: "Contact information is required",
  path: ["email"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  const { 
    register, 
    requestOTP,
    isRegistering, 
    isRequestingOTP,
    registerResult, 
    requestOTPResult,
    registerError,
    requestOTPError
  } = useAuth();
  
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      contactType: 'email',
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      role: 'client',
      otpCode: '',
    },
  });

  const contactType = form.watch('contactType');

  const handleRequestOTP = async () => {
    const values = form.getValues();
    const contactInfo = contactType === 'email' ? values.email : values.phone;

    if (!contactInfo) {
      toast({
        title: 'Error',
        description: `Please enter your ${contactType}`,
        variant: 'destructive',
      });
      return;
    }

    const otpData = contactType === 'email' 
      ? { email: contactInfo, type: 'email' as const }
      : { phone: contactInfo, type: 'sms' as const };

    requestOTP(otpData, {
      onSuccess: (result) => {
        if (result.success) {
          setOtpSent(true);
          setOtpCountdown(60);
          toast({
            title: 'OTP sent',
            description: result.message,
          });
          
          // Start countdown
          const interval = setInterval(() => {
            setOtpCountdown(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          toast({
            title: 'Failed to send OTP',
            description: result.message,
            variant: 'destructive',
          });
        }
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to send OTP',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSubmit = (data: RegisterFormData) => {
    register(data, {
      onSuccess: (result) => {
        if (result.success) {
          toast({
            title: 'Registration successful',
            description: 'Welcome to UzPharm!',
          });
          onSuccess?.();
        } else {
          toast({
            title: 'Registration failed',
            description: result.message,
            variant: 'destructive',
          });
        }
      },
      onError: () => {
        toast({
          title: 'Registration failed',
          description: 'An error occurred during registration',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto" data-testid="card-register">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center" data-testid="text-register-title">
          Create Account
        </CardTitle>
        <CardDescription className="text-center" data-testid="text-register-description">
          Join UzPharm Digital healthcare platform
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {registerResult && !registerResult.success && (
              <Alert variant="destructive" data-testid="alert-register-error">
                <AlertDescription>{registerResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Contact Type Selection */}
            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-contact-type">Contact Method</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange} data-testid="tabs-contact-type">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
                      <TabsTrigger value="phone" data-testid="tab-phone">Phone</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* Contact Information */}
            {contactType === 'email' ? (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-email">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-email" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-phone">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+998901234567"
                          className="pl-10"
                          data-testid="input-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-phone" />
                  </FormItem>
                )}
              />
            )}

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-first-name">First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage data-testid="error-first-name" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-last-name">Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage data-testid="error-last-name" />
                  </FormItem>
                )}
              />
            </div>

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-role">Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-role">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="client" data-testid="option-client">Customer</SelectItem>
                      <SelectItem value="pharmacy_seller" data-testid="option-seller">Pharmacy Staff</SelectItem>
                      <SelectItem value="pharmacy_owner" data-testid="option-owner">Pharmacy Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage data-testid="error-role" />
                </FormItem>
              )}
            />

            {/* Password Fields */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-password">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pr-10"
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage data-testid="error-password" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-confirm-password">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pr-10"
                        data-testid="input-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage data-testid="error-confirm-password" />
                </FormItem>
              )}
            />

            {/* OTP Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel data-testid="label-otp">Verification Code</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRequestingOTP || otpCountdown > 0}
                  onClick={handleRequestOTP}
                  data-testid="button-request-otp"
                >
                  {isRequestingOTP ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : otpSent && otpCountdown > 0 ? (
                    `Resend in ${otpCountdown}s`
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="otpCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className={otpSent ? 'pr-10' : ''}
                          data-testid="input-otp"
                        />
                        {otpSent && (
                          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage data-testid="error-otp" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isRegistering || !otpSent}
              data-testid="button-register"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login">
                <a className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </a>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}