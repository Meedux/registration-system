'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { loginUser, resetPassword } from '@/lib/firebaseAuth';
import { Button, Input, Card, CardHeader, CardContent, Alert } from '@/components/ui';
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    const { success, error: loginError, needsVerification } = await loginUser(data.email, data.password);
    
    if (success) {
      router.push('/');
    } else {
      // If user needs verification, redirect to verification page
      if (needsVerification) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setError(loginError);
      }
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (email) => {
    setIsLoading(true);
    setError('');
    setResetMessage('');
    
    const { success, error: resetError } = await resetPassword(email);
    
    if (success) {
      setResetMessage('Password reset email sent. Please check your inbox.');
      setShowResetPassword(false);
    } else {
      setError(resetError);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center"
              >
                <LogIn className="w-6 h-6" />
              </motion.div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-gray-400">Sign in to your account</p>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                {error}
              </Alert>
            )}
            
            {resetMessage && (
              <Alert variant="success" className="mb-4">
                {resetMessage}
              </Alert>
            )}

            {!showResetPassword ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Input
                    {...register('email')}
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    required
                  />
                </div>

                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              <ResetPasswordForm
                onReset={handleResetPassword}
                onCancel={() => setShowResetPassword(false)}
                isLoading={isLoading}
              />
            )}

            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 underline">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-400 hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ResetPasswordForm({ onReset, onCancel, isLoading }) {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onReset(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <Mail className="w-8 h-8 mx-auto text-blue-400 mb-2" />
        <h3 className="text-lg font-semibold">Reset Password</h3>
        <p className="text-sm text-gray-400">Enter your email to receive a reset link</p>
      </div>
      
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
      />
      
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!email || isLoading}
          loading={isLoading}
          className="flex-1"
        >
          Send Reset Link
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
