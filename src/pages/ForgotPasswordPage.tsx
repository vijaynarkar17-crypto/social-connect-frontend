import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '@/components/ui/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/api/auth/forgot-password', data);
      setSent(true);
    } catch {
      setError('Something went wrong');
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We'll send you a reset code">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">If an account exists, we've sent an OTP to your email.</p>
            <Link to="/otp"><Button className="w-full">Enter OTP</Button></Link>
          </div>
        ) : (
          <>
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
            <Input id="email" label="Email" type="email" placeholder="you@email.com" {...register('email')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Send Reset Code</Button>
          </>
        )}
        <p className="text-center text-sm text-gray-500"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
      </form>
    </AuthLayout>
  );
}
