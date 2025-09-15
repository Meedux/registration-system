'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Alert } from '@/components/ui';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { resendVerificationEmail } from '@/lib/firebaseAuth';
import { useRouter } from 'next/navigation';

export default function EmailVerificationPrompt({ userEmail }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const router = useRouter();

  const handleResendVerification = async () => {
    if (!password) {
      setError('Please enter your password to resend verification email');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const { success, message: successMessage, error: errorMessage } = await resendVerificationEmail(userEmail, password);
    
    if (success) {
      setMessage(successMessage);
      setShowResendForm(false);
      setPassword('');
    } else {
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mb-4"
          >
            <Mail className="w-8 h-8" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verification Required</h1>
          <p className="text-gray-400">
            Please verify your email address to access your account. Check your inbox for a verification email.
          </p>
          {userEmail && (
            <p className="text-sm text-blue-300 mt-2">
              Email sent to: {userEmail}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert className="bg-green-900/30 text-green-300 mb-4">
            {message}
          </Alert>
        )}

        <div className="space-y-4">
          {!showResendForm ? (
            <>
              <Button
                onClick={() => setShowResendForm(true)}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>

              <Button
                onClick={() => router.push('/auth/login')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your password to resend verification email
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-0"
                  placeholder="Your password"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleResendVerification}
                  loading={isLoading}
                  className="flex-1"
                >
                  Send Email
                </Button>
                
                <Button
                  onClick={() => {
                    setShowResendForm(false);
                    setPassword('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">📧 Check Your Email</h3>
          <ul className="text-sm text-blue-100 space-y-1">
            <li>• Check your inbox (and spam folder)</li>
            <li>• Click the verification link in the email</li>
            <li>• Return here to login after verifying</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
