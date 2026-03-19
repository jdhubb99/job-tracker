import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
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

export function RegistrationCard() {
  const navigate = useNavigate();
  const { registerMutation } = useAuth();

  const id = useId();
  const firstNameId = `${id}-firstName`;
  const lastNameId = `${id}-lastName`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const firstNameErrorId = `${id}-firstName-error`;
  const lastNameErrorId = `${id}-lastName-error`;
  const emailErrorId = `${id}-email-error`;
  const passwordErrorId = `${id}-password-error`;
  const serverErrorId = `${id}-error`;
  const headingId = `${id}-heading`;
  const descriptionId = `${id}-description`;

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const serverError = registerMutation.error
    ? registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : 'An unexpected error occurred. Please try again.'
    : null;

  function onSubmit(data: RegisterFormData) {
    registerMutation.reset();
    registerMutation.mutate(data, {
      onSuccess: () => navigate({ to: '/dashboard' }),
      onError: (error) => {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (field in registerSchema.shape) {
              setError(field as keyof RegisterFormData, { message });
            }
          }
        }
        setFocus('firstName');
      },
    });
  }

  const firstNameRegistration = register('firstName');
  const lastNameRegistration = register('lastName');
  const emailRegistration = register('email');
  const passwordRegistration = register('password');

  return (
    <Card className="w-full max-w-sm gap-3 px-2 py-8" role="region" aria-labelledby={headingId}>
      <CardHeader className="text-center">
        <CardTitle id={headingId} className="text-2xl">
          Job Tracker
        </CardTitle>
        <CardDescription id={descriptionId}>Create an account to get started</CardDescription>
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
            <Label htmlFor={firstNameId}>First Name</Label>
            <Input
              {...firstNameRegistration}
              id={firstNameId}
              type="text"
              required
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={!!errors.firstName || !!serverError || undefined}
              aria-describedby={
                [errors.firstName && firstNameErrorId, serverError && serverErrorId]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            {errors.firstName && (
              <p id={firstNameErrorId} className="text-destructive text-sm">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={lastNameId}>Last Name</Label>
            <Input
              {...lastNameRegistration}
              id={lastNameId}
              type="text"
              required
              autoComplete="family-name"
              aria-required="true"
              aria-invalid={!!errors.lastName || !!serverError || undefined}
              aria-describedby={
                [errors.lastName && lastNameErrorId, serverError && serverErrorId]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            {errors.lastName && (
              <p id={lastNameErrorId} className="text-destructive text-sm">
                {errors.lastName.message}
              </p>
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
                [errors.email && emailErrorId, serverError && serverErrorId]
                  .filter(Boolean)
                  .join(' ') || undefined
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
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!errors.password || !!serverError || undefined}
              aria-describedby={
                [errors.password && passwordErrorId, serverError && serverErrorId]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            {errors.password && (
              <p id={passwordErrorId} className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
            aria-busy={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
