import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@pms/shared';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { AuthLayout } from '../features/auth/AuthLayout';
import { applyServerErrors, getErrorMessage } from '../lib/errors';

function FormHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-24">
      <h2 className="text-heading-sm text-ink-brand">{title}</h2>
      <p className="mt-6 text-body text-ink-muted">{children}</p>
    </div>
  );
}

function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-16 flex items-start gap-8 rounded-chip bg-danger-soft p-12 text-body text-danger">
      <AlertCircle className="mt-2 size-16 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

const linkClass = 'text-ink-brand underline decoration-line-strong underline-offset-4 hover:decoration-ink-brand';

export function LoginPage() {
  const { login, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      clearNotice();
      navigate(from, { replace: true });
    } catch (err) {
      if (!applyServerErrors(err, setError)) setError('root', { message: getErrorMessage(err) });
    }
  });

  return (
    <AuthLayout title="Plan it. Track it. Ship it." subtitle="Projects and tasks that stay in sync across the web and Android.">
      <FormHeader title="Welcome back">
        New to ProjectFlow?{' '}
        <Link to="/register" className={linkClass}>
          Create an account
        </Link>
      </FormHeader>
      {notice && (
        <div role="status" className="mb-16 rounded-chip bg-warning-soft p-12 text-body text-warning">
          {notice}
        </div>
      )}
      <FormError message={errors.root?.message} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-16">
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-8 w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      toast.success('Welcome to ProjectFlow!');
      navigate('/', { replace: true });
    } catch (err) {
      if (!applyServerErrors(err, setError)) setError('root', { message: getErrorMessage(err) });
    }
  });

  return (
    <AuthLayout title="Start shipping in minutes." subtitle="One account for the ProjectFlow web app and the Android app.">
      <FormHeader title="Create your account">
        Already have an account?{' '}
        <Link to="/login" className={linkClass}>
          Log in
        </Link>
      </FormHeader>
      <FormError message={errors.root?.message} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-16">
        <TextField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-8 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
