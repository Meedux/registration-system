'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { resendEmailVerification, checkEmailVerificationStatus } from '@/lib/emailVerification';
import { Button, Card, CardHeader, CardContent, Alert } from '@/components/ui';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailVerificationBanner({ onVerified }) {
  const { user, isEmailVerified } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // Auto-check verification status every 30 seconds
  useEffect(() => {
    if (!isEmailVerified) {
      const checkStatus = async () => {
        const result = await checkEmailVerificationStatus();
        if (result.success && result.emailVerified) {
          setMessage('Email verified successfully!');
          if (onVerified) onVerified();
        }
      };

      const interval = setInterval(checkStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isEmailVerified, onVerified]);

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    const result = await resendEmailVerification();
    
    if (result.success) {
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCheckVerification = async (showLoading = true) => {
    if (showLoading) setChecking(true);
    setError('');

    const result = await checkEmailVerificationStatus();
    
    if (result.success && result.emailVerified) {
      setMessage('Email verified successfully!');
      if (onVerified) onVerified();
    } else if (showLoading) {
      setError('Email not verified yet. Please check your inbox.');
    }

    if (showLoading) setChecking(false);
  };

  // Don't show banner if email is verified
  if (isEmailVerified) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Alert className="bg-yellow-900/30 text-yellow-300">
        <AlertCircle className="h-4 w-4" />
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Email Verification Required</h4>
          <p className="text-sm mb-4">
            Please verify your email address ({user?.email}) to continue. 
            Check your inbox and spam folder for the verification email.
          </p>
          
          {message && (
            <div className="mb-3 text-sm bg-green-900/30 border-0 rounded px-3 py-2">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-3 text-sm bg-red-900/30 border-0 rounded px-3 py-2">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button
              onClick={handleResendVerification}
              loading={loading}
              size="sm"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Resend Verification
            </Button>
            
            <Button
              onClick={() => handleCheckVerification(true)}
              loading={checking}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>
          </div>
        </div>
      </Alert>
    </motion.div>
  );
}

export function EmailVerificationGuard({ children, requireVerification = true }) {
  const { user, isEmailVerified, loading } = useAuth();
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  useEffect(() => {
    if (!loading && user && requireVerification && !isEmailVerified) {
      setShowVerificationPrompt(true);
    } else {
      setShowVerificationPrompt(false);
    }
  }, [user, isEmailVerified, loading, requireVerification]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (showVerificationPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
              <h2 className="text-xl font-bold">Email Verification Required</h2>
            </div>
          </CardHeader>
          <CardContent>
            <EmailVerificationBanner onVerified={() => setShowVerificationPrompt(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
