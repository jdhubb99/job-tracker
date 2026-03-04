import { useId, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
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
  const errorId = `${id}-error`;
  const headingId = `${id}-heading`;
  const descriptionId = `${id}-description`;

  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const error = loginMutation.error
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : 'An unexpected error occurred. Please try again.'
    : null;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate({ to: '/dashboard' }),
        onError: () => emailRef.current?.focus(),
      }
    );
  }

  return (
    <Card className="w-full max-w-sm" role="region" aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle id={headingId} className="text-2xl">
          Job Tracker
        </CardTitle>
        <CardDescription id={descriptionId}>
          Sign in to manage your job applications
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit}
        aria-describedby={descriptionId}
        aria-labelledby={headingId}
        noValidate
      >
        <CardContent className="flex flex-col gap-4">
          <div aria-live="assertive" aria-atomic="true">
            {error && (
              <div id={errorId} role="alert" className="text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              ref={emailRef}
              id={emailId}
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              id={passwordId}
              type="password"
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={error ? true : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
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
