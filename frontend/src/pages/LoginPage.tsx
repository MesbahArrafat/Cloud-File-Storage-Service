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
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login(res);
      navigate('/');
    } catch {
      toast.error('Invalid email or password.');
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
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message as string | undefined} />
            <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message as string | undefined} />
            <Button type="submit" loading={loading} className="w-full mt-2">Sign in</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
