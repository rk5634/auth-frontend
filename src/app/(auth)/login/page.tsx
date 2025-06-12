'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link'; // Added for potential "Forgot Password" or "Sign Up" links

// --- Schema for Login Form ---
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Password is required, but min length can be adjusted based on backend
});

type LoginFormData = z.infer<typeof schema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // --- Form Submission Handler ---
  const onSubmit = async (data: LoginFormData) => {
    setServerError(''); // Clear previous errors
    try {
      await axios.post('/auth/login', data); // Assuming your login API endpoint is /auth/login
      router.push('/dashboard'); // Or '/home', or wherever authenticated users go
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
            setServerError('Invalid email or password. Please try again.');
            } else {
            setServerError(error.response?.data?.message || 'Login failed. Please try again later.');
            }
        } else {
            setServerError('An unknown error occurred.');
            }
        }
    };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-4 text-center">Login to Your Account</h1>

      {serverError && (
        <p className="text-red-600 text-sm text-center mb-4">{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="input"
            autoComplete="email" // Helps with autofill
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="input pr-10"
              autoComplete="current-password" // Helps with autofill
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {isSubmitting ? 'Logging In...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
        <p className="mt-2">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
                Sign Up
            </Link>
        </p>
      </div>
    </div>
  );
}