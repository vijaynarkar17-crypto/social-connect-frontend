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
import { getPasswordStrength } from '@/lib/utils';
import { getApiError } from '@/lib/errors';

const schema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = watch('password', '');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await signup(data.email, data.username, data.password);
      navigate('/home');
    } catch (err: unknown) {
      setError(getApiError(err, 'Registration failed'));
    }
  };

  return (
    <AuthLayout title="Join Social Connect" subtitle="Create your account today">
      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}
        <Input id="email" label="Email" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        <Input id="username" label="Username" placeholder="johndoe" error={errors.username?.message} {...register('username')} />
        <div>
          <Input id="password" label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">{[1,2,3,4,5].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />)}</div>
              <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Create Account</Button>
        <a href="/api/auth/google" className="block"><Button type="button" variant="secondary" className="w-full">Continue with Google</Button></a>
        <p className="text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </motion.form>
    </AuthLayout>
  );
}
