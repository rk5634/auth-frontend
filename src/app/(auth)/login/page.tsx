'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct for App Router
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

// Adjust the import path as necessary based on your actual file system from this component's location
// Assuming this file is src/app/(auth)/login/_components/LoginForm.tsx
// Then the path to src/lib/types/api.d.ts would be:
import { GoBackendLoginSuccessResponse } from '@/lib/types/api'; // Prefer absolute path alias if configured, else relative

// --- Schema for Login Form ---
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Password is required, but min length can be adjusted based on backend
});

type LoginFormData = z.infer<typeof schema>;

export default function LoginPage() { // This component would typically be LoginForm.tsx if placed in _components
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
        const GO_BACKEND_URL = process.env.GO_BACKEND_URL;
        console.log('GO_BACKEND_URL - ', GO_BACKEND_URL); // Log for debugging
        // Type the axios.post response using the imported interface
        console.log('login/page - Till here code works--'); // Log for debugging
        const response = await axios.post<{ message: string; user: GoBackendLoginSuccessResponse }>('/api/auth/login', data);
        console.log('login/page - Till here code works--'); // Log for debugging
 // Assuming your Next.js API route is `/api/auth/login`
        console.log('Response from backend:', response.data.user); // Log the full response for debugging
        // Destructure the actual data from the nested 'data' property of the response
        const { accesstoken, userid, email, role, deviceid } = response.data.user.data;

      // --- Store/Use the received data ---
      // For persistent storage, localStorage is common.
      // Remember to consider security implications for accesstoken (HttpOnly cookies are more secure).
      localStorage.setItem('accessToken', accesstoken);
      localStorage.setItem('userId', userid);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userDeviceId', deviceid);

      // Log for debugging/confirmation
      console.log('Login successful:', response.data.message);
      console.log('Received user data:', { userid, email, role, deviceid });
      // Note: Do not log accesstoken in production console for security reasons

      // Redirect to the dashboard after successful login and data storage
      router.push('/dashboard');

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Attempt to get a more specific error message from the backend's response data
        // Assuming your backend might send a 'message' property in error responses too
        const errorMessage = (error.response?.data as { message?: string })?.message;

        if (error.response?.status === 401) {
          setServerError('Invalid email or password. Please try again.');
        } else {
          setServerError(errorMessage || 'Login failed. Please try again later.');
        }
      } else {
        setServerError('An unknown error occurred.');
      }
      console.error('Login error:', error); // Log the full error for debugging
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
            className="input block w-full border border-gray-300 rounded-md p-2 mt-1" // Added basic styling for clarity
            autoComplete="email"
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
              className="input block w-full border border-gray-300 rounded-md p-2 mt-1 pr-10" // Added basic styling
              autoComplete="current-password"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
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