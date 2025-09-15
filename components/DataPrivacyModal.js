'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, ScrollText, Check } from 'lucide-react';
import { Button } from '@/components/ui';

const DataPrivacyModal = ({ isOpen, onAccept, onDecline }) => {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [acceptChecked, setAcceptChecked] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setHasScrolledToEnd(false);
    setAcceptChecked(false);
  }, [isOpen]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setHasScrolledToEnd(scrolledToBottom);
    }
  };

  const privacyText = `
DATA PRIVACY AGREEMENT
Barangay Commonwealth & Quezon City Registration System

Last updated: ${new Date().toLocaleDateString()}

PRIVACY COMMITMENT

We are committed to protecting your privacy. Your personal information will not be shared, sold, or used for any other purpose beyond the administration of services and benefits.

The information you provide will be used solely for the purpose of verifying your residency and eligibility for benefits offered by Barangay Commonwealth and Quezon City.

By continuing, you acknowledge and agree that your data will be processed only for your benefit and in accordance with applicable privacy laws.

PURPOSE AND SCOPE

This registration system is designed specifically for residents of Barangay Commonwealth, Quezon City, to streamline access to local government services and benefits.

INFORMATION COLLECTION

We collect essential information for residency verification and service delivery:
• Full name and address within Barangay Commonwealth
• Government-issued identification for verification
• Contact information for service delivery
• Supporting documents as required by law
• Demographic information for program eligibility

DATA USAGE

Your information enables us to:
• Confirm your residency within Barangay Commonwealth
• Process applications for local government services
• Determine eligibility for community programs and benefits
• Maintain accurate community records
• Provide efficient service delivery
• Ensure compliance with local government regulations

SECURITY AND CONFIDENTIALITY

We maintain strict security protocols:
• All personal data is encrypted and securely stored
• Access limited to authorized Barangay officials only
• Regular security reviews and system updates
• Compliance with Data Privacy Act of 2012 (Republic Act 10173)
• Physical and digital security measures at all times

DATA RETENTION

Your information is retained only as long as necessary for:
• Ongoing service provision and community benefits
• Legal compliance and record-keeping requirements
• Statistical analysis for community planning (anonymized data only)

YOUR PRIVACY RIGHTS

Under the Data Privacy Act, you may:
• Request access to your personal information
• Correct any inaccurate or incomplete data
• Object to certain types of processing
• Request data portability where applicable
• Lodge complaints with the National Privacy Commission

CONTACT FOR PRIVACY CONCERNS

For questions about your privacy or data protection:
Barangay Commonwealth - Data Protection Officer
Commonwealth Avenue, Quezon City
Phone: (02) 8xxx-xxxx
Email: privacy@barangaycommonwealth.gov.ph

LEGAL BASIS

Processing of your data is based on:
• Performance of public tasks and official authority
• Compliance with legal obligations under local government laws
• Your explicit consent for optional services

CONSENT AND ACKNOWLEDGMENT

By clicking "I Agree," you confirm that you have read, understood, and consent to the processing of your personal information as described above, and acknowledge that this data will be used exclusively for legitimate government purposes in Barangay Commonwealth.

LEGAL BASIS FOR PROCESSING

Our legal basis for processing your personal information includes:
• Your explicit consent
• Performance of a contract or service
• Compliance with legal obligations
• Legitimate interests (where not overridden by your rights)

This agreement is governed by applicable data protection laws and regulations.
`;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onDecline}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 border-0 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Data Privacy Agreement</h2>
              <p className="text-sm text-gray-400">Please read carefully before proceeding</p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-6 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-line text-sm leading-relaxed text-gray-300">
              {privacyText}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToEnd && (
          <div className="px-6 py-2 border-t border-gray-700 bg-yellow-900/20">
            <div className="flex items-center justify-center text-yellow-400 text-sm">
              <ScrollText className="w-4 h-4 mr-2" />
              Please scroll to the end to continue
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          {hasScrolledToEnd && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={acceptChecked}
                  onChange={(e) => setAcceptChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="privacy-consent" className="text-sm text-gray-300 flex-1">
                  I have read and understood the Data Privacy Agreement. I consent to the collection, 
                  use, and disclosure of my personal information as described above. I understand that 
                  I can withdraw this consent at any time.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onAccept}
                  disabled={!acceptChecked}
                  className="flex-1 sm:flex-initial"
                >
                  <Check className="w-4 h-4 mr-2" />
                  I Agree & Continue
                </Button>
                <Button
                  onClick={onDecline}
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By agreeing, you confirm you are at least 18 years old or have parental consent
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DataPrivacyModal;
