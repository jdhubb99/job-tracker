import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function LoginCard() {
  const navigate = useNavigate();
  const { loginMutation } = useAuth();

  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const emailErrorId = `${id}-email-error`;
  const passwordErrorId = `${id}-password-error`;
  const serverErrorId = `${id}-error`;
  const headingId = `${id}-heading`;
  const descriptionId = `${id}-description`;

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const serverError = loginMutation.error
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : 'An unexpected error occurred. Please try again.'
    : null;

  function onSubmit(data: LoginFormData) {
    loginMutation.reset();
    loginMutation.mutate(data, {
      onSuccess: () => navigate({ to: '/dashboard' }),
      onError: () => setFocus('email'),
    });
  }

  const emailRegistration = register('email');
  const passwordRegistration = register('password');

  return (
    <Card className="w-full max-w-sm gap-3 px-2 py-8" role="region" aria-labelledby={headingId}>
      <CardHeader className="text-center">
        <CardTitle id={headingId} className="text-2xl">
          Job Tracker
        </CardTitle>
        <CardDescription id={descriptionId}>
          Sign in to manage your job applications
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit(onSubmit)}
        aria-describedby={descriptionId}
        aria-labelledby={headingId}
        noValidate
      >
        <CardContent className="flex flex-col gap-5">
          <div aria-live="assertive" aria-atomic="true">
            {serverError && (
              <div id={serverErrorId} role="alert" className="text-destructive text-sm">
                {serverError}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              {...emailRegistration}
              id={emailId}
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errors.email || !!serverError || undefined}
              aria-describedby={
                errors.email ? emailErrorId : serverError ? serverErrorId : undefined
              }
            />
            {errors.email && (
              <p id={emailErrorId} className="text-destructive text-sm">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              {...passwordRegistration}
              id={passwordId}
              type="password"
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={!!errors.password || !!serverError || undefined}
              aria-describedby={errors.password ? passwordErrorId : undefined}
            />
            {errors.password && (
              <p id={passwordErrorId} className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
            aria-busy={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
