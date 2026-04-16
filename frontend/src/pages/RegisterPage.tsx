import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({
  username: z.string().min(3, 'At least 3 characters').max(150),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, { message: "Passwords don't match", path: ['password_confirm'] });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      login(res);
      navigate('/');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { email?: string[] } } })?.response?.data?.email?.[0] || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Cloud className="h-12 w-12 text-primary-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">CloudDrive</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Username" placeholder="johndoe" {...register('username')} error={errors.username?.message as string | undefined} />
            <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message as string | undefined} />
            <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message as string | undefined} />
            <Input label="Confirm password" type="password" placeholder="••••••••" {...register('password_confirm')} error={errors.password_confirm?.message as string | undefined} />
            <Button type="submit" loading={loading} className="w-full mt-2">Create account</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
