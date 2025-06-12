'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import countryCodes from '@/constants/countrycodes/countrycodes';

// console.log(countryCodes)

const passwordValidationSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(64, 'Password must not exceed 64 characters')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((val) => /\d/.test(val), {
    message: 'Password must contain at least one digit',
  })
  .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val), {
    message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};:\'"|,.<>/?~`)',
  });



const schema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email'),
    countryCode: z.string().optional(),
    phone: z
      .string()
      .trim()
      .nullable()
      .transform(e => e === "" ? null : e)
      .refine((val) => {
        if (val === null) return true;
        return /^\d{7,15}$/.test(val); // Adjust regex for local numbers as needed
      }, {
        message: 'Phone number must be 7-15 digits if provided',
      })
      .optional(),
    password: passwordValidationSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof schema>;

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryCode: '+91', // Example: default to India
    }
  });

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const onSubmit = async (data: SignupFormData) => {
    try {
      const dataToSend = {
        ...data,
        phone: data.phone === '' || data.phone === null
          ? undefined
          : (data.countryCode ? `${data.countryCode}${data.phone}` : data.phone),
        countryCode: undefined,
      };

      console.log('Sending data:', dataToSend);
      await axios.post('/auth/signup', dataToSend);
      router.push('/verify-email');
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error('Signup error:', error);
          setServerError(error.response?.data?.message || 'Signup failed. Please try again.');
        } else {
          console.error('Unknown error during signup:', error);
          setServerError('Signup failed. Please try again.');
        }
      }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-4 text-center">Create Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </label>
            <input id="firstName" type="text" {...register('firstName')} className="input" />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="flex-1">
            <label htmlFor="middleName">Middle Name</label>
            <input id="middleName" type="text" {...register('middleName')} className="input" />
          </div>

          <div className="flex-1">
            <label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input id="lastName" type="text" {...register('lastName')} className="input" />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <input id="email" type="email" {...register('email')} className="input" />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* --- Phone Number with Country Code Select on Left - Height Alignment Fix --- */}
        <div>
          {/* Labels for Country Code and Phone Number */}
          <div className="flex">
            <label htmlFor="countryCode" className="w-6/12 pr-2">
              Country Code
            </label>
            <label htmlFor="phone" className="pl-2">
              Phone Number
            </label>
          </div>
          <div className="flex space-x-2 items-center"> {/* Changed items-start to items-center */}
            <select
              id="countryCode"
              {...register('countryCode')}
              // Applied explicit height and consistent padding
              className="input w-5/12 h-[42px] py-2 px-3 leading-tight" // Added h-[42px], py-2, px-3, leading-tight
            >
              {countryCodes.map((cc) => (
                <option key={cc.code} value={cc.code}>
                  {cc.code} {cc.country ? `(${cc.country})` : ''}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              // Applied explicit height and consistent padding
              className="input w-7/12 h-[42px] py-2 px-3" // Added h-[42px], py-2, px-3
              placeholder="e.g., 9876543210"
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
          {errors.countryCode && (
            <p className="text-red-500 text-sm mt-1">{errors.countryCode.message}</p>
          )}
        </div>
        {/* --- End Phone Number with Country Code Select - Height Alignment Fix --- */}

        <div>
          <label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="input pr-10"
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
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-red-600 text-sm text-center">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <p>
          Already have an account?&nbsp;
          <Link href="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}