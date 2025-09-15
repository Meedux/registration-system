'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { registerUser } from '@/lib/firebaseAuth';
import { Button, Input, Card, CardHeader, CardContent, Alert } from '@/components/ui';
import { Eye, EyeOff, UserPlus, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import DataPrivacyModal from '@/components/DataPrivacyModal';

const registrationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(registrationSchema)
  });

  const onSubmit = async (data) => {
    if (!privacyAccepted) {
      setRegistrationData(data);
      setShowPrivacyModal(true);
      return;
    }

    await performRegistration(data);
  };

  const performRegistration = async (data) => {
    setIsLoading(true);
    setError('');
    
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };

    const { success, error: registrationError } = await registerUser(data.email, data.password, userData);
    
    if (success) {
      setRegistrationComplete(true);
    } else {
      setError(registrationError);
    }
    
    setIsLoading(false);
  };

  const handlePrivacyAccepted = async () => {
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
    if (registrationData) {
      await performRegistration(registrationData);
    }
  };

  if (registrationComplete) {
    return <RegistrationSuccess />;
  }

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
                <UserPlus className="w-6 h-6" />
              </motion.div>
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-gray-400">Join our registration system</p>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('firstName')}
                  label="First Name"
                  placeholder="John"
                  error={errors.firstName?.message}
                  required
                />
                <Input
                  {...register('lastName')}
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  required
                />
              </div>

              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="john.doe@example.com"
                error={errors.email?.message}
                required
              />

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

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 underline">
                  Sign in here
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

      <AnimatePresence>
        {showPrivacyModal && (
          <DataPrivacyModal
            isOpen={showPrivacyModal}
            onAccept={handlePrivacyAccepted}
            onDecline={() => {
              setShowPrivacyModal(false);
              setRegistrationData(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RegistrationSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-8 h-8" />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
            <p className="text-gray-400 mb-6">
              Your account has been created successfully! Please check your email to verify your account, then return to login with your credentials.
            </p>
            
            <div className="space-y-3">
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Go to Login
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
