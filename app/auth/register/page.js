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

// Simplified validation schema
const registrationSchema = yup.object({
  firstName: yup.string().required('First name required'),
  lastName: yup.string().required('Last name required'),
  email: yup.string().email('Invalid email').required('Email required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: inputValidationErrors }
  } = useForm({
    resolver: yupResolver(registrationSchema)
  });

  // Watch form values for reactive validation
  const watchedValues = watch();
  
  // Helper function to check if a field is valid and filled
  const isFieldValid = (fieldName) => {
    const value = watchedValues[fieldName];
    const hasError = inputValidationErrors[fieldName];
    return value && value.trim() !== '' && !hasError;
  };

  // Helper function to check password match
  const isPasswordMatching = () => {
    const password = watchedValues.password;
    const confirmPassword = watchedValues.confirmPassword;
    return password && confirmPassword && password === confirmPassword && password.length >= 6;
  };

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
    setRegistrationError('');
    
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };

    const { success, error: registrationFailureMessage } = await registerUser(data.email, data.password, userData);
    
    if (success) {
      setRegistrationComplete(true);
    } else {
      setRegistrationError(registrationFailureMessage);
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
            {registrationError && (
              <Alert variant="destructive" className="mb-4">
                <strong>Registration Failed:</strong> {registrationError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    {...register('firstName')}
                    label="First Name"
                    placeholder="John"
                    error={inputValidationErrors.firstName?.message}
                    className={`transition-all duration-200 ${
                      isFieldValid('firstName') 
                        ? 'border-green-500 focus:border-green-400' 
                        : inputValidationErrors.firstName 
                          ? 'border-red-500' 
                          : 'border-gray-600'
                    }`}
                    required
                  />
                  {isFieldValid('firstName') && (
                    <div className="absolute right-3 top-9 text-green-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Input
                    {...register('lastName')}
                    label="Last Name"
                    placeholder="Doe"
                    error={inputValidationErrors.lastName?.message}
                    className={`transition-all duration-200 ${
                      isFieldValid('lastName') 
                        ? 'border-green-500 focus:border-green-400' 
                        : inputValidationErrors.lastName 
                          ? 'border-red-500' 
                          : 'border-gray-600'
                    }`}
                    required
                  />
                  {isFieldValid('lastName') && (
                    <div className="absolute right-3 top-9 text-green-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="john.doe@example.com"
                  error={inputValidationErrors.email?.message}
                  className={`transition-all duration-200 ${
                    isFieldValid('email') 
                      ? 'border-green-500 focus:border-green-400' 
                      : inputValidationErrors.email 
                        ? 'border-red-500' 
                        : 'border-gray-600'
                  }`}
                  required
                />
                {isFieldValid('email') && (
                  <div className="absolute right-3 top-9 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  error={inputValidationErrors.password?.message}
                  className={`transition-all duration-200 ${
                    isFieldValid('password') 
                      ? 'border-green-500 focus:border-green-400' 
                      : inputValidationErrors.password 
                        ? 'border-red-500' 
                        : 'border-gray-600'
                  }`}
                  required
                />
                <div className="absolute right-10 top-9">
                  {isFieldValid('password') && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
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
                  error={inputValidationErrors.confirmPassword?.message}
                  className={`transition-all duration-200 ${
                    isPasswordMatching() 
                      ? 'border-green-500 focus:border-green-400' 
                      : inputValidationErrors.confirmPassword 
                        ? 'border-red-500' 
                        : 'border-gray-600'
                  }`}
                  required
                />
                <div className="absolute right-10 top-9">
                  {isPasswordMatching() && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Form validation status */}
              <div className="flex items-center justify-center space-x-2 text-sm">
                {isFieldValid('firstName') && isFieldValid('lastName') && 
                 isFieldValid('email') && isPasswordMatching() ? (
                  <div className="flex items-center text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>All fields completed!</span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    Fill all required fields to continue
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className={`w-full transition-all duration-200 ${
                  isFieldValid('firstName') && isFieldValid('lastName') && 
                  isFieldValid('email') && isPasswordMatching()
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
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
