import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/ui/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/errors';
import { API_BASE } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    setSubmitting(true);
    try {
      await login(data.email, data.password, data.remember);
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      setError(getApiError(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}
        <Input id="email" label="Email" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        <Input id="password" label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" {...register('remember')} className="rounded" /> Remember me
        </label>
        <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
          Sign In
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-surface-card-dark px-2 text-gray-500">or</span></div>
        </div>
        <a href={`${API_BASE}/api/auth/google`} className="block">
          <Button type="button" variant="secondary" className="w-full">Continue with Google</Button>
        </a>
        <p className="text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          {' · '}
          <Link to="/register" className="text-primary hover:underline">Create account</Link>
        </p>
      </motion.form>
    </AuthLayout>
  );
}
