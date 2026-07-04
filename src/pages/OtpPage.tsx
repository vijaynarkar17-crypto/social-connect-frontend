import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '@/components/ui/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { getPasswordStrength } from '@/lib/utils';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});
type FormData = z.infer<typeof schema>;

export default function OtpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = watch('password', '');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/api/auth/reset-password', data);
      navigate('/login');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter the OTP from your email">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        <Input id="email" label="Email" type="email" {...register('email')} />
        <Input id="otp" label="OTP Code" placeholder="123456" maxLength={6} {...register('otp')} />
        <div>
          <Input id="password" label="New Password" type="password" {...register('password')} />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">{[1,2,3,4,5].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />)}</div>
              <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Reset Password</Button>
        <p className="text-center text-sm text-gray-500"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
      </form>
    </AuthLayout>
  );
}
