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
import { Loader2, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginResult, loginError } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
    },
  });

  const handleSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (result) => {
        if (result.success) {
          toast({
            title: 'Login successful',
            description: 'Welcome back!',
          });
          onSuccess?.();
        } else {
          toast({
            title: 'Login failed',
            description: result.message,
            variant: 'destructive',
          });
        }
      },
      onError: (error) => {
        toast({
          title: 'Login failed',
          description: 'An error occurred during login',
          variant: 'destructive',
        });
      },
    });
  };

  const isEmailOrPhone = (value: string) => {
    return value.includes('@') ? 'email' : 'phone';
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-login">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center" data-testid="text-login-title">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center" data-testid="text-login-description">
          Sign in to your UzPharm account
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {loginResult && !loginResult.success && (
              <Alert variant="destructive" data-testid="alert-login-error">
                <AlertDescription>{loginResult.message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="emailOrPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-email-phone">Email or Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
                        {isEmailOrPhone(field.value) === 'email' ? <Mail /> : <Phone />}
                      </div>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter your email or phone number"
                        className="pl-10"
                        data-testid="input-email-phone"
                      />
                    </div>
                  </FormControl>
                  <FormMessage data-testid="error-email-phone" />
                </FormItem>
              )}
            />

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
                        placeholder="Enter your password"
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage data-testid="error-password" />
                </FormItem>
              )}
            />

            <div className="text-right">
              <Link href="/auth/forgot-password">
                <a className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                  Forgot password?
                </a>
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register">
                <a className="text-primary hover:underline" data-testid="link-register">
                  Sign up
                </a>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}