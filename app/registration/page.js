'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserRegistration, getUserRegistrationStatus } from '@/lib/firebaseAuth';
import { uploadDocumentToBlob, validateDocumentFile, formatFileSize } from '@/lib/blobUpload';
import { Button, Input, Select, Checkbox, Card, CardHeader, CardContent, Alert } from '@/components/ui';
import { 
  User, 
  MapPin, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  Upload,
  FileText,
  Heart,
  Wallet,
  Users2,
  Building2,
  Shield,
  Save,
  Eye,
  AlertCircle,
  Calendar,
  Clock,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import withAuth from '@/components/withAuth';
import { getRegions, getCitiesByRegion, getBarangaysByCity, isFromCommonwealth, preloadLocationData } from '@/lib/locationData';

// Simplified registration form - no complex validation schemas

function RegistrationFormPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [regions, setRegions] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedBarangays, setSelectedBarangays] = useState([]);
  const [selectedPermanentCities, setSelectedPermanentCities] = useState([]);
  const [selectedPermanentBarangays, setSelectedPermanentBarangays] = useState([]);
  const [userAge, setUserAge] = useState(0);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [completedTabs, setCompletedTabs] = useState(new Set());

  // Form with no real-time validation - only validate on submit
  const methods = useForm({
    mode: 'onSubmit', // Only validate when user submits
    defaultValues: {
      // Personal Information
      hasMiddleName: true,
      firstName: user?.displayName?.split(' ')[0] || '',
      middleName: '',
      lastName: user?.displayName?.split(' ').slice(-1)[0] || '',
      extension: '',
      maidenName: '',
      birthDate: '',
      placeOfBirth: '',
      nationality: 'Filipino',
      religion: '',
      gender: '',
      civilStatus: '',
      phoneNumber: '',
      alternateEmail: '',
      alternatePhone: '',
      emergencyContactPhone: '',
      
      // Work Information
      isEmployed: false,
      employmentType: '',
      position: '',
      companyName: '',
      
      // Address Information
      presentRegion: '',
      presentCity: '',
      presentBarangay: '',
      presentStreet: '',
      presentHouseNumber: '',
      isPresentPrimary: true,
      hoaName: '',
      sameAsPresentAddress: true,
      permanentRegion: '',
      permanentCity: '',
      permanentBarangay: '',
      permanentStreet: '',
      permanentHouseNumber: '',
      
      // Sectoral Information
      pwdMember: false, pwdApply: false, pwdId: '',
      soloParentMember: false, soloParentApply: false, soloParentId: '',
      seniorMember: false, seniorApply: false, seniorId: '',
      studentMember: false, studentApply: false, gradeLevel: '',
      ipMember: false, ipApply: false,
      womenMember: false, womenApply: false,
      youthMember: false, youthApply: false,
      unemployedMember: false, unemployedApply: false,
      generalPublicMember: false, generalPublicApply: false,
      
      // Health Record
      height: '',
      weight: '',
      bloodType: '',
      eyeColor: '',
      wearingGlasses: false,
      wearingDentures: false,
      
      // E-Wallet Information
      paymayaNumber: '',
      gcashNumber: '',
      
      // Document Information
      documentFileName: '',
      
      // Initialize all livelihood and benefits programs
      // These will be dynamically created based on the actual form structure
    }
  });

  const { handleSubmit, formState: { errors, isValid }, watch, trigger, setValue, reset } = methods;

  // Validate current tab when Next is clicked
  const validateCurrentTab = () => {
    const formData = watch();
    const errors = {};
    
    switch (currentTab) {
      case 0: // Personal Information
        if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
        if (!formData.birthDate) errors.birthDate = 'Birth date is required';
        if (!formData.placeOfBirth?.trim()) errors.placeOfBirth = 'Place of birth is required';
        if (!formData.nationality?.trim()) errors.nationality = 'Nationality is required';
        if (!formData.religion?.trim()) errors.religion = 'Religion is required';
        if (!formData.gender?.trim()) errors.gender = 'Gender is required';
        if (!formData.civilStatus?.trim()) errors.civilStatus = 'Civil status is required';
        if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
        
        // Middle name validation only if hasMiddleName is true
        if (formData.hasMiddleName !== false && !formData.middleName?.trim()) {
          errors.middleName = 'Middle name is required';
        }
        
        // Phone number format validation
        if (formData.phoneNumber && !/^09[0-9]{9}$/.test(formData.phoneNumber.replace(/[-\s]/g, ''))) {
          errors.phoneNumber = 'Please enter a valid Philippine mobile number (09XXXXXXXXX)';
        }
        
        // Birth date validation
        if (formData.birthDate) {
          const birthDate = new Date(formData.birthDate);
          const today = new Date();
          if (birthDate > today) {
            errors.birthDate = 'Birth date cannot be in the future';
          }
        }
        break;
        
      case 1: // Work Information
        if (userAge >= 18 && formData.isEmployed) {
          if (!formData.employmentType?.trim()) errors.employmentType = 'Employment type is required for employed individuals';
          if (!formData.position?.trim()) errors.position = 'Position/job title is required';
          if (!formData.companyName?.trim()) errors.companyName = 'Company name is required';
        }
        break;
        
      case 2: // Address Information
        if (!formData.presentRegion?.trim()) errors.presentRegion = 'Region is required';
        if (!formData.presentCity?.trim()) errors.presentCity = 'City is required';
        if (!formData.presentBarangay?.trim()) errors.presentBarangay = 'Barangay is required';
        if (!formData.presentStreet?.trim()) errors.presentStreet = 'Street address is required';
        
        // Permanent address validation if different from present
        if (!formData.sameAsPresentAddress) {
          if (!formData.permanentRegion?.trim()) errors.permanentRegion = 'Permanent region is required';
          if (!formData.permanentCity?.trim()) errors.permanentCity = 'Permanent city is required';
          if (!formData.permanentBarangay?.trim()) errors.permanentBarangay = 'Permanent barangay is required';
          if (!formData.permanentStreet?.trim()) errors.permanentStreet = 'Permanent street address is required';
        }
        break;
        
      case 7: // Health Record
        if (!formData.bloodType?.trim()) errors.bloodType = 'Blood type is required';
        if (!formData.heightCm?.toString()?.trim() || formData.heightCm < 50 || formData.heightCm > 300) {
          errors.heightCm = 'Please enter a valid height between 50-300 cm';
        }
        if (!formData.weightKg?.toString()?.trim() || formData.weightKg < 20 || formData.weightKg > 300) {
          errors.weightKg = 'Please enter a valid weight between 20-300 kg';
        }
        if (!formData.eyeColor?.trim()) errors.eyeColor = 'Eye color is required';
        break;
        
      // Other tabs don't have required validation
      default:
        break;
    }
    
    setFieldErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    
    // Update completed tabs
    if (isValid) {
      setCompletedTabs(prev => new Set([...prev, currentTab]));
    } else {
      setCompletedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentTab);
        return newSet;
      });
    }
    
    return isValid;
  };
  
  // Auto-save functionality - saves every 30 seconds
  const handleAutoSave = useCallback(() => {
    if (!user?.uid) return;
    
    try {
      const currentFormData = watch();
      const formDataToSave = { 
        ...currentFormData, 
        lastAutoSavedAt: new Date().toISOString(),
        isAutoSave: true 
      };
      localStorage.setItem(`registration_draft_${user.uid}`, JSON.stringify(formDataToSave));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [user?.uid, watch]);

  // Manual save functionality
  const handleSaveDraft = useCallback(async () => {
    if (!user?.uid) return;
    
    setAutoSaving(true);
    try {
      handleAutoSave();
      setSuccess('Draft saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setError('Failed to save draft.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAutoSaving(false);
    }
  }, [handleAutoSave, user?.uid]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [handleAutoSave, user?.uid]);

  // Load saved draft on mount
  useEffect(() => {
    if (user?.uid) {
      try {
        const savedDraft = localStorage.getItem(`registration_draft_${user.uid}`);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          if (draftData.isAutoSave) {
            reset(draftData);
            setSuccess('Previous draft loaded successfully.');
            setTimeout(() => setSuccess(''), 3000);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [user?.uid, reset]);

  // Simple validation - only runs when user clicks Next
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);

  // Check user registration status on mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user?.uid) return;
      
      setCheckingStatus(true);
      try {
        const status = await getUserRegistrationStatus(user.uid);
        setRegistrationStatus(status);
      } catch (error) {
        console.error('Error checking registration status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkRegistrationStatus();
  }, [user]);

  // Load regions data on component mount (only regions, no preloading)
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingLocations(true);
      try {
        const regionsData = await getRegions();
        setRegions(regionsData);
      } catch (error) {
        console.error('Error loading regions:', error);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    loadRegions();
  }, []);

  // Calculate age when birth date changes
  const watchBirthDate = watch('birthDate');
  useEffect(() => {
    if (watchBirthDate) {
      const today = new Date();
      const birthDate = new Date(watchBirthDate);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setUserAge(age - 1);
      } else {
        setUserAge(age);
      }
    }
  }, [watchBirthDate]);

  // Handle region change for both present and permanent addresses
  const handleRegionChange = async (e, addressType = 'present') => {
    const regionCode = e.target.value;
    
    setValue(`${addressType}Region`, regionCode);
    setValue(`${addressType}City`, '');
    setValue(`${addressType}Barangay`, '');
    
    try {
      const cities = await getCitiesByRegion(regionCode);
      
      if (addressType === 'present') {
        setSelectedCities(cities);
        setSelectedBarangays([]);
      } else {
        setSelectedPermanentCities(cities);
        setSelectedPermanentBarangays([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      if (addressType === 'present') {
        setSelectedCities([]);
        setSelectedBarangays([]);
      } else {
        setSelectedPermanentCities([]);
        setSelectedPermanentBarangays([]);
      }
    }
  };

  // Handle city change for both present and permanent addresses
  const handleCityChange = async (e, addressType = 'present') => {
    const cityCode = e.target.value;
    
    setValue(`${addressType}City`, cityCode);
    setValue(`${addressType}Barangay`, '');
    
    try {
      const barangays = await getBarangaysByCity(cityCode);
      
      if (addressType === 'present') {
        setSelectedBarangays(barangays);
      } else {
        setSelectedPermanentBarangays(barangays);
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
      if (addressType === 'present') {
        setSelectedBarangays([]);
      } else {
        setSelectedPermanentBarangays([]);
      }
    }
  };

  // Handle same as present address toggle
  const handleSameAddressToggle = (value) => {
    setValue('sameAsPresentAddress', value);
    if (value) {
      const presentData = watch();
      setValue('permanentRegion', presentData.presentRegion);
      setValue('permanentCity', presentData.presentCity);
      setValue('permanentBarangay', presentData.presentBarangay);
      setValue('permanentStreet', presentData.presentStreet);
      setValue('permanentHouseNumber', presentData.presentHouseNumber);
    }
  };

  const tabs = [
    { id: 0, title: 'Personal Information', icon: User },
    { id: 1, title: 'Work Information', icon: Briefcase },
    { id: 2, title: 'Address Information', icon: MapPin },
    { id: 3, title: 'Sectoral Information', icon: Users2 },
    { id: 4, title: 'Livelihood Programs', icon: Building2 },
    { id: 5, title: 'Social Benefits', icon: Shield },
    { id: 6, title: 'Local Government Benefits', icon: Building2 },
    { id: 7, title: 'Health Record', icon: Heart },
    { id: 8, title: 'eWallet Information', icon: Wallet },
    { id: 9, title: 'Document Upload', icon: Upload },
  ];

  const hasMiddleName = watch('hasMiddleName') ?? true;

  const nextTab = () => {
    setHasAttemptedNext(true);
    const isValid = validateCurrentTab();
    
    if (isValid && currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
      setHasAttemptedNext(false); // Reset for next tab
      setFieldErrors({}); // Clear errors when moving to next tab
    }
  };

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Check if document is uploaded (required)
      if (!uploadedFile) {
        setError('Please upload a valid document before submitting your registration.');
        setIsLoading(false);
        return;
      }

      // Validate all required fields are filled
      const allFormData = methods.getValues();
      
      // Validate Commonwealth barangay requirement (now async)
      console.log('Validating location:', {
        barangay: allFormData.presentBarangay,
        city: allFormData.presentCity
      });
      
      const isValidLocation = await isFromCommonwealth(allFormData.presentBarangay, allFormData.presentCity);
      console.log('Location validation result:', isValidLocation);
      
      if (!isValidLocation) {
        setError('Registration is only available for Commonwealth, Quezon City residents.');
        setIsLoading(false);
        return;
      }
      
      // Age validation for work information
      if (userAge >= 18 && allFormData.isEmployed && (!allFormData.employmentType || !allFormData.position || !allFormData.companyName)) {
        setError('Work information is required for individuals 18 years and above who are employed.');
        setIsLoading(false);
        return;
      }
      
      // Handle document upload if file exists
      let documentInfo = null;
      if (uploadedFile) {
        try {
          const uploadResult = await uploadDocumentToBlob(uploadedFile, user.uid);
          if (uploadResult.success) {
            documentInfo = {
              url: uploadResult.url,
              filename: uploadResult.filename,
              size: uploadResult.size,
              type: uploadResult.type,
              uploadedAt: uploadResult.uploadedAt
            };
          } else {
            console.error('Document upload failed:', uploadResult.error);
            setError(`Failed to upload document: ${uploadResult.error}`);
            setIsLoading(false);
            return;
          }
        } catch (uploadError) {
          console.error('Document upload failed:', uploadError);
          setError('Failed to upload document. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Filter out any File objects from form data
      const cleanFormData = Object.fromEntries(
        Object.entries(allFormData).filter(([key, value]) => {
          const isFile = value instanceof File;
          if (isFile) {
            console.log(`Filtering out File object for key: ${key}`, value);
          }
          return !isFile;
        })
      );
      
      console.log('Clean form data (no File objects):', cleanFormData);

      const registrationData = {
        ...cleanFormData,
        email: user.email, // Ensure email is included
        documentInfo: documentInfo, // Store document info object instead of URL
        registrationCompleted: true,
        submittedAt: new Date().toISOString(),
        applicationReferenceNumber: `REG-${Date.now()}`, // Generate application reference number
      };

      const { success, error: saveError, cid, duplicates } = await saveUserRegistration(
        user.uid, 
        registrationData
      );
      
      if (success) {
        // Store CID for display
        localStorage.setItem('userCID', cid);
        setIsComplete(true);
      } else if (duplicates && duplicates.length > 0) {
        setError(`Potential duplicate entry detected: ${duplicates[0].reason}. Please contact admin for review.`);
      } else {
        setError(saveError || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking registration status...</p>
        </div>
      </div>
    );
  }

  // Show registration status if user has already submitted
  if (registrationStatus?.hasRegistration) {
    return <RegistrationStatusView registrationStatus={registrationStatus} />;
  }

  if (isComplete) {
    return <RegistrationCompleteSuccess />;
  }

  const progressPercentage = ((currentTab + 1) / tabs.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold mb-2">Complete Your Registration</h1>
            <p className="text-gray-400">Fill in all required information across the tabs below</p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Progress</span>
            <span className="text-sm font-medium text-gray-300">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            {/* Enhanced Tab Navigation */}
            <div className="mb-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Registration Progress</span>
                  <span>{Math.round((completedTabs.size / tabs.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedTabs.size / tabs.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-2 bg-gray-700/50 rounded-lg">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === currentTab;
                  const isCompleted = completedTabs.has(tab.id);
                  const hasErrors = hasAttemptedNext && Object.keys(fieldErrors).length > 0 && tab.id === currentTab;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCurrentTab(tab.id);
                        setHasAttemptedNext(false); // Reset validation state when switching tabs
                        setFieldErrors({}); // Clear errors when switching tabs
                      }}
                      disabled={tab.id > currentTab && !isCompleted}
                      className={`flex flex-col items-center p-3 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? hasErrors 
                            ? 'bg-red-600 text-white shadow-lg' 
                            : 'bg-blue-600 text-white shadow-lg'
                          : isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : hasErrors && isActive ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-center leading-tight">{tab.title}</span>
                      {hasErrors && isActive && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Current Tab Info */}
              <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{tabs[currentTab]?.title}</h3>
                    <p className="text-sm text-gray-400">Step {currentTab + 1} of {tabs.length}</p>
                  </div>
                  {hasAttemptedNext && Object.keys(fieldErrors).length > 0 && (
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {Object.keys(fieldErrors).length} field(s) need attention
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-600 text-red-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-900/20 border-green-600 text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </Alert>
        )}

        {/* Save status and manual save button */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            {autoSaving && (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {lastSaved && !autoSaving && (
              <>
                <Save className="w-4 h-4 text-green-400" />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={autoSaving}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>            <FormProvider {...methods}>
              <form 
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key except for the final submit button
                  if (e.key === 'Enter' && e.target.type !== 'submit') {
                    e.preventDefault();
                    return false;
                  }
                }}
              >
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentTab === 0 && <PersonalInfoTab hasMiddleName={hasMiddleName} userAge={userAge} fieldErrors={fieldErrors} />}
                  {currentTab === 1 && <WorkInfoTab userAge={userAge} fieldErrors={fieldErrors} />}
                  {currentTab === 2 && <AddressInfoTab 
                    regions={regions}
                    selectedCities={selectedCities}
                    selectedBarangays={selectedBarangays}
                    selectedPermanentCities={selectedPermanentCities}
                    selectedPermanentBarangays={selectedPermanentBarangays}
                    onRegionChange={handleRegionChange}
                    onCityChange={handleCityChange}
                    onSameAddressToggle={handleSameAddressToggle}
                    watch={watch}
                    loadingLocations={loadingLocations}
                    fieldErrors={fieldErrors}
                  />}
                  {currentTab === 3 && <SectoralInfoTab fieldErrors={fieldErrors} />}
                  {currentTab === 4 && <LivelihoodProgramsTab fieldErrors={fieldErrors} />}
                  {currentTab === 5 && <SocialBenefitsTab fieldErrors={fieldErrors} />}
                  {currentTab === 6 && <LocalGovBenefitsTab fieldErrors={fieldErrors} />}
                  {currentTab === 7 && <HealthRecordTab fieldErrors={fieldErrors} />}
                  {currentTab === 8 && <EWalletTab fieldErrors={fieldErrors} />}
                  {currentTab === 9 && <DocumentUploadTab 
                    uploadedFile={uploadedFile}
                    setUploadedFile={setUploadedFile}
                    fieldErrors={fieldErrors}
                  />}
                </motion.div>

                {/* Enhanced Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevTab}
                    disabled={currentTab === 0}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-4">
                    {/* Progress Indicator */}
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Step {currentTab + 1} of {tabs.length}</span>
                    </div>

                    {/* Validation Status */}
                    {hasAttemptedNext && Object.keys(fieldErrors).length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>{Object.keys(fieldErrors).length} field(s) need attention</span>
                      </div>
                    )}

                    {completedTabs.has(currentTab) && (
                      <div className="flex items-center space-x-2 text-sm text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Section complete</span>
                      </div>
                    )}
                  </div>

                  {currentTab < tabs.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextTab}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={!uploadedFile || isLoading}
                      className={!uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {!uploadedFile ? 'Upload Document to Continue' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Enhanced Tab Components based on requirements
function PersonalInfoTab({ hasMiddleName, userAge, fieldErrors }) {
  const { register, setValue, watch } = useFormContext();
  const hasMiddleNameValue = watch('hasMiddleName') ?? true; // Default to true if undefined

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('firstName')}
          label="First Name"
          placeholder="Juan"
          required
          error={fieldErrors.firstName}
        />
        
        <div>
          <Input
            {...register('middleName')}
            label="Middle Name"
            placeholder="Santos"
            disabled={!hasMiddleNameValue}
            required={hasMiddleNameValue}
            error={fieldErrors.middleName}
          />
          <Checkbox
            checked={!hasMiddleNameValue}
            className="mt-2"
            onChange={(e) => {
              const newHasMiddleName = !e.target.checked;
              setValue('hasMiddleName', newHasMiddleName, { shouldValidate: true });
              if (e.target.checked) {
                setValue('middleName', '', { shouldValidate: true });
              }
            }}
          >
            I don&apos;t have a middle name
          </Checkbox>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('lastName')}
          label="Last Name"
          placeholder="Dela Cruz"
          required
          error={fieldErrors.lastName}
        />
        
        <Select {...register('extension')} label="Extension" error={fieldErrors.extension}>
          <option value="">Select extension</option>
          <option value="Sr.">Sr.</option>
          <option value="Jr.">Jr.</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <Input
        {...register('maidenName')}
        label="Maiden Name (Last Name before Marriage)"
        placeholder="Previous family name (if applicable)"
        error={fieldErrors.maidenName}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('birthDate')}
          type="date"
          label="Date of Birth"
          required
          error={fieldErrors.birthDate}
        />
        
        <Input
          {...register('placeOfBirth')}
          label="Place of Birth"
          placeholder="City, Province"
          required
          error={fieldErrors.placeOfBirth}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select {...register('nationality')} label="Nationality" required error={fieldErrors.nationality}>
          <option value="">Select nationality</option>
          <option value="Filipino">Filipino</option>
          <option value="American">American</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
          <option value="Korean">Korean</option>
          <option value="Other">Other</option>
        </Select>
        
        <Input
          {...register('religion')}
          label="Religion"
          placeholder="Catholic, Protestant, Muslim, etc."
          required
          error={fieldErrors.religion}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select {...register('gender')} label="Sex" required error={fieldErrors.gender}>
          <option value="">Select sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Do Not Specify">Do Not Specify</option>
        </Select>
        
        <Select {...register('civilStatus')} label="Civil Status" required error={fieldErrors.civilStatus}>
          <option value="">Select status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Widowed">Widowed</option>
          <option value="Separated">Separated</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('phoneNumber')}
          type="tel"
          label="Personal Mobile Number"
          placeholder="09XX-XXX-XXXX"
          pattern="09[0-9]{2}-[0-9]{3}-[0-9]{4}"
          required
          error={fieldErrors.phoneNumber}
        />
        
        <Input
          {...register('alternateEmail')}
          type="email"
          label="Alternate Email Address"
          placeholder="alternate@email.com"
          error={fieldErrors.alternateEmail}
        />
      </div>

      {userAge > 0 && (
        <div className="mt-4 p-4 bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-300">
            Age calculated: {userAge} years old
            {userAge >= 18 && (
              <span className="block text-yellow-300 mt-1">
                Work information will be required in the next section.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function AddressTab() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Address Information</h2>
      
      <Input
        {...register('street')}
        label="Street Address"
        placeholder="123 Main Street, Subdivision Name"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('barangay')}
          label="Barangay"
          placeholder="Barangay Name"
          required
        />
        
        <Input
          {...register('city')}
          label="City/Municipality"
          placeholder="City Name"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('province')}
          label="Province"
          placeholder="Province Name"
          required
        />
        
        <Input
          {...register('zipCode')}
          label="ZIP Code"
          placeholder="1234"
          maxLength={4}
          required
        />
      </div>
    </div>
  );
}

function ContactTab() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('phoneNumber')}
          type="tel"
          label="Phone Number"
          placeholder="+63 912 345 6789"
          required
        />
        
        <Input
          {...register('alternatePhone')}
          type="tel"
          label="Alternate Phone (Optional)"
          placeholder="+63 912 345 6789"
        />
      </div>

      <h3 className="text-lg font-medium mt-8 mb-4">Emergency Contact</h3>
      
      <Input
        {...register('emergencyContactName')}
        label="Emergency Contact Name"
        placeholder="Jane Doe"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('emergencyContactPhone')}
          type="tel"
          label="Emergency Contact Phone"
          placeholder="+63 912 345 6789"
          required
        />
        
        <Select {...register('emergencyContactRelation')} label="Relationship" required>
          <option value="">Select relationship</option>
          <option value="Spouse">Spouse</option>
          <option value="Parent">Parent</option>
          <option value="Child">Child</option>
          <option value="Sibling">Sibling</option>
          <option value="Friend">Friend</option>
          <option value="Other">Other</option>
        </Select>
      </div>
    </div>
  );
}

function EducationTab() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Educational Background</h2>
      
      <Select {...register('educationalAttainment')} label="Highest Educational Attainment" required>
        <option value="">Select attainment</option>
        <option value="Elementary">Elementary</option>
        <option value="High School">High School</option>
        <option value="Senior High School">Senior High School</option>
        <option value="Vocational/Technical">Vocational/Technical</option>
        <option value="College Undergraduate">College Undergraduate</option>
        <option value="College Graduate">College Graduate</option>
        <option value="Post Graduate">Post Graduate</option>
      </Select>

      <Input
        {...register('schoolName')}
        label="School/Institution Name"
        placeholder="University/School Name"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('course')}
          label="Course/Program (if applicable)"
          placeholder="Bachelor of Science in Computer Science"
        />
        
        <Input
          {...register('yearGraduated')}
          type="number"
          label="Year Graduated (if applicable)"
          placeholder="2020"
          min="1950"
          max={new Date().getFullYear()}
        />
      </div>
    </div>
  );
}

function EmploymentTab() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Employment Information</h2>
      
      <Select {...register('employmentStatus')} label="Employment Status" required>
        <option value="">Select status</option>
        <option value="Employed">Employed</option>
        <option value="Self-employed">Self-employed</option>
        <option value="Unemployed">Unemployed</option>
        <option value="Student">Student</option>
        <option value="Retired">Retired</option>
        <option value="OFW">OFW (Overseas Filipino Worker)</option>
      </Select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('occupation')}
          label="Occupation/Job Title"
          placeholder="Software Developer"
        />
        
        <Input
          {...register('employer')}
          label="Employer/Company"
          placeholder="Company Name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('monthlyIncome')}
          type="number"
          label="Monthly Income (PHP)"
          placeholder="25000"
          min="0"
        />
        
        <Input
          {...register('workExperience')}
          label="Years of Work Experience"
          placeholder="5 years"
        />
      </div>
    </div>
  );
}

// Work Information Tab (required for 18+)
function WorkInfoTab({ userAge, fieldErrors }) {
  const { register, watch } = useFormContext();
  const isEmployed = watch('isEmployed') ?? false;

  if (userAge < 18) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Work Information</h2>
        <div className="p-4 bg-gray-700/30 rounded-lg text-center">
          <p className="text-gray-300">
            Work information is not required for individuals under 18 years old.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Work Information</h2>
      <p className="text-sm text-gray-400 mb-4">Required for individuals 18 years and above</p>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          {...register('isEmployed')}
          id="isEmployed"
        />
        <label htmlFor="isEmployed" className="text-sm">Currently Employed</label>
      </div>

      {isEmployed && (
        <div className="space-y-4">
          <Select {...register('employmentType')} label="Employment Type" required error={fieldErrors.employmentType}>
            <option value="">Select employment type</option>
            <option value="Part-time">Part-time</option>
            <option value="Full Time">Full Time</option>
            <option value="Contractual">Contractual</option>
            <option value="Temporary">Temporary</option>
            <option value="On-call">On-call</option>
            <option value="Independent Contractor">Independent Contractor</option>
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('position')}
              label="Position/Title"
              placeholder="Software Developer"
              required
              error={fieldErrors.position}
            />
            
            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="Company Inc."
              required
              error={fieldErrors.companyName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Address Information Tab with cascading dropdowns (Regions -> Cities -> Barangays)
function AddressInfoTab({ regions, selectedCities, selectedBarangays, selectedPermanentCities, selectedPermanentBarangays, onRegionChange, onCityChange, onSameAddressToggle, watch, loadingLocations, fieldErrors }) {
  const { register, setValue } = useFormContext();
  const sameAsPresentAddress = watch('sameAsPresentAddress') ?? true;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Address Information</h2>
      
      {/* Present Address */}
      <div className="p-4 border-0 rounded-lg bg-gray-800">
        <h3 className="text-lg font-medium mb-4">Present Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select 
            {...register('presentRegion')} 
            label="Region" 
            required
            onChange={(e) => onRegionChange(e, 'present')}
            disabled={loadingLocations}
            error={fieldErrors.presentRegion}
          >
            <option value="">{loadingLocations ? 'Loading regions...' : 'Select region'}</option>
            {regions?.map((region, index) => (
              <option key={`region-${region.code || index}`} value={region.code}>{region.name}</option>
            ))}
          </Select>

          <Select 
            {...register('presentCity')} 
            label="City/Municipality" 
            required
            onChange={(e) => onCityChange(e, 'present')}
            disabled={!selectedCities?.length}
            error={fieldErrors.presentCity}
          >
            <option value="">Select city</option>
            {selectedCities?.map((city, index) => (
              <option key={`city-${city.code || index}`} value={city.code}>{city.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select {...register('presentBarangay')} label="Barangay" required disabled={!selectedBarangays?.length} error={fieldErrors.presentBarangay}>
            <option value="">Select barangay</option>
            {selectedBarangays?.map((barangay, index) => (
              <option key={`barangay-${barangay.code || index}`} value={barangay.code}>{barangay.name}</option>
            ))}
          </Select>
          
          <Input
            {...register('presentStreet')}
            label="Street Name, Village"
            placeholder="123 Main Street, Subdivision"
            required
            error={fieldErrors.presentStreet}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('presentHouseNumber')}
            label="House Number"
            placeholder="123-A"
            required
            error={fieldErrors.presentHouseNumber}
          />
          
          <Input
            {...register('hoaName')}
            label="HOA Name (if applicable)"
            placeholder="Homeowners Association"
          />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            {...register('isPresentPrimary')}
            id="isPresentPrimary"
          />
          <label htmlFor="isPresentPrimary" className="text-sm">Is this your primary address?</label>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="p-4 border-0 rounded-lg bg-gray-800">
        <h3 className="text-lg font-medium mb-4">Permanent Address</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            checked={sameAsPresentAddress}
            onChange={onSameAddressToggle}
            id="sameAsPresentAddress"
          />
          <label htmlFor="sameAsPresentAddress" className="text-sm">Same as present address</label>
        </div>

        {!sameAsPresentAddress && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                {...register('permanentRegion')} 
                label="Region" 
                required
                onChange={(e) => onRegionChange(e, 'permanent')}
                disabled={loadingLocations}
              >
                <option value="">{loadingLocations ? 'Loading regions...' : 'Select region'}</option>
                {regions?.map((region, index) => (
                  <option key={`permanent-region-${region.code || index}`} value={region.code}>{region.name}</option>
                ))}
              </Select>

              <Select 
                {...register('permanentCity')} 
                label="City/Municipality" 
                required
                onChange={(e) => onCityChange(e, 'permanent')}
                disabled={!selectedPermanentCities?.length}
              >
                <option value="">Select city</option>
                {selectedPermanentCities?.map((city, index) => (
                  <option key={`permanent-city-${city.code || index}`} value={city.code}>{city.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select {...register('permanentBarangay')} label="Barangay" required disabled={!selectedPermanentBarangays?.length}>
                <option value="">Select barangay</option>
                {selectedPermanentBarangays?.map((barangay, index) => (
                  <option key={`permanent-barangay-${barangay.code || index}`} value={barangay.code}>{barangay.name}</option>
                ))}
              </Select>
              
              <Input
                {...register('permanentStreet')}
                label="Street Name, Village"
                required
              />
            </div>

            <Input
              {...register('permanentHouseNumber')}
              label="House Number"
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Sectoral Information Tab
function SectoralInfoTab({ fieldErrors }) {
  const { register, watch } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Sectoral Information</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {[
          { id: 'pwd', label: 'PWDs - Assistive devices, skills training, discounts, cash grants (from LGUs)', needsId: true },
          { id: 'soloParent', label: 'Solo Parent', needsId: true },
          { id: 'senior', label: 'Senior', needsId: true },
          { id: 'student', label: 'Student', needsId: true, idLabel: 'Grade/Year Level' },
          { id: 'ip', label: 'Indigenous People (IPs) - NCIP grants, agri and craft-based livelihood', needsId: false },
          { id: 'women', label: 'Women - Gender-sensitive livelihood training, microfinancing', needsId: false },
          { id: 'youth', label: 'Youth - SPES (Summer Job), JobStart, Youth Entrepreneurship programs', needsId: false },
          { id: 'unemployed', label: 'Unemployed', needsId: false },
          { id: 'generalPublic', label: 'General public', needsId: false },
        ].map(sector => (
          <div key={sector.id} className="p-4 border-0 rounded-lg bg-gray-800">
            <h3 className="font-medium mb-3">{sector.label}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`${sector.id}Member`)}
                  id={`${sector.id}Member`}
                />
                <label htmlFor={`${sector.id}Member`} className="text-sm">Already a Member</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`${sector.id}Apply`)}
                  id={`${sector.id}Apply`}
                />
                <label htmlFor={`${sector.id}Apply`} className="text-sm">Plan to Apply</label>
              </div>
            </div>

            {sector.needsId && watch(`${sector.id}Member`) && (
              <Input
                {...register(`${sector.id}Id`)}
                label={sector.idLabel || `${sector.label.split(' - ')[0]} ID Number`}
                placeholder="Enter ID number"
                className="mt-4"
                required
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Livelihood Programs Tab
function LivelihoodProgramsTab({ fieldErrors }) {
  const { register } = useFormContext();
  
  const programs = [
    { id: 'dole', label: 'DOLE – Department of Labor and Employment - DOLE Integrated Livelihood and Emergency Employment Program (DILEEP)' },
    { id: 'dswd', label: 'DSWD – Department of Social Welfare and Development - Sustainable Livelihood Program (SLP)' },
    { id: 'tesda', label: 'TESDA – Technical Education and Skills Development Authority - Skills Training & Livelihood Programs' },
    { id: 'da', label: 'DA – Department of Agriculture - Agri-business support' },
    { id: 'dti', label: 'DTI – Department of Trade and Industry - Negosyo Center Services' },
    { id: 'owwa', label: 'OWWA – Overseas Workers Welfare Administration - Balik Pinas! Balik Hanapbuhay! Program' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Livelihood Programs (Kabuhayan)</h2>
      <p className="text-sm text-gray-400 mb-4">These are aimed at generating income or self-employment.</p>
      
      <div className="grid grid-cols-1 gap-4">
        {programs.map(program => (
          <div key={program.id} className="p-4 border-0 rounded-lg bg-gray-800">
            <h3 className="font-medium mb-3">{program.label}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`livelihood_${program.id}_member`)}
                  id={`livelihood_${program.id}_member`}
                />
                <label htmlFor={`livelihood_${program.id}_member`} className="text-sm">Already a Member</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`livelihood_${program.id}_apply`)}
                  id={`livelihood_${program.id}_apply`}
                />
                <label htmlFor={`livelihood_${program.id}_apply`} className="text-sm">Plan to Apply</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Social Benefits Tab
function SocialBenefitsTab({ fieldErrors }) {
  const { register } = useFormContext();
  
  const programs = [
    { id: '4ps', label: '4Ps – Pantawid Pamilyang Pilipino Program' },
    { id: 'socialPension', label: 'Social Pension for Indigent Senior Citizens' },
    { id: 'philhealth', label: 'PhilHealth – National Health Insurance' },
    { id: 'aics', label: 'DSWD Assistance to Individuals in Crisis Situations (AICS)' },
    { id: 'tupad', label: 'TUPAD – Tulong Panghanapbuhay sa Ating Disadvantaged/Displaced Workers' },
    { id: 'feeding', label: 'Supplementary Feeding Program' },
    { id: 'childWelfare', label: 'Child Development and Women\'s Welfare Services' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Social Benefits and Assistance Programs</h2>
      <p className="text-sm text-gray-400 mb-4">These are cash or in-kind benefits for daily needs or emergencies.</p>
      
      <div className="grid grid-cols-1 gap-4">
        {programs.map(program => (
          <div key={program.id} className="p-4 border-0 rounded-lg bg-gray-800">
            <h3 className="font-medium mb-3">{program.label}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`social_${program.id}_member`)}
                  id={`social_${program.id}_member`}
                />
                <label htmlFor={`social_${program.id}_member`} className="text-sm">Already a Member</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`social_${program.id}_apply`)}
                  id={`social_${program.id}_apply`}
                />
                <label htmlFor={`social_${program.id}_apply`} className="text-sm">Plan to Apply</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Local Government Benefits Tab
function LocalGovBenefitsTab({ fieldErrors }) {
  const { register } = useFormContext();
  
  const programs = [
    { id: 'scholarships', label: 'Scholarships or educational cash grants' },
    { id: 'cooperatives', label: 'Community cooperatives or loan programs' },
    { id: 'feedingPrograms', label: 'Feeding programs and barangay clinics' },
    { id: 'livelihoodFairs', label: 'Livelihood fairs and skills seminars' },
    { id: 'housing', label: 'Housing assistance (e.g., via NHA partnerships)' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Local Government (Barangay/City/Municipality) Benefits</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {programs.map(program => (
          <div key={program.id} className="p-4 border-0 rounded-lg bg-gray-800">
            <h3 className="font-medium mb-3">{program.label}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`local_${program.id}_member`)}
                  id={`local_${program.id}_member`}
                />
                <label htmlFor={`local_${program.id}_member`} className="text-sm">Already a Member</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register(`local_${program.id}_apply`)}
                  id={`local_${program.id}_apply`}
                />
                <label htmlFor={`local_${program.id}_apply`} className="text-sm">Plan to Apply</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Health Record Tab
function HealthRecordTab({ fieldErrors }) {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Health Record</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select {...register('bloodType')} label="Blood Type" required error={fieldErrors.bloodType}>
          <option value="">Select blood type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </Select>
        
        <Input
          {...register('heightCm')}
          type="number"
          label="Height (CM)"
          placeholder="170"
          min="50"
          max="300"
          required
          error={fieldErrors.heightCm}
        />
        
        <Input
          {...register('weightKg')}
          type="number"
          label="Weight (KG)"
          placeholder="70"
          min="10"
          max="500"
          required
          error={fieldErrors.weightKg}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('hairColor')}
          label="Hair Color"
          placeholder="Black, Brown, etc."
          required
          error={fieldErrors.hairColor}
        />
        
        <Input
          {...register('eyeColor')}
          label="Eye Color"
          placeholder="Brown, Black, etc."
          required
          error={fieldErrors.eyeColor}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            {...register('wearingGlasses')}
            id="wearingGlasses"
          />
          <label htmlFor="wearingGlasses" className="text-sm">Wearing glasses?</label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            {...register('wearingDentures')}
            id="wearingDentures"
          />
          <label htmlFor="wearingDentures" className="text-sm">Wearing dentures?</label>
        </div>
      </div>
    </div>
  );
}

// eWallet Information Tab
function EWalletTab({ fieldErrors }) {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">eWallet Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('paymayaNumber')}
          type="tel"
          label="PayMaya Number (Optional)"
          placeholder="09XX-XXX-XXXX"
          pattern="09[0-9]{2}-[0-9]{3}-[0-9]{4}"
        />
        
        <Input
          {...register('gcashNumber')}
          type="tel"
          label="GCash Number (Optional)"
          placeholder="09XX-XXX-XXXX"
          pattern="09[0-9]{2}-[0-9]{3}-[0-9]{4}"
        />
      </div>
    </div>
  );
}

// Document Upload Tab
function DocumentUploadTab({ uploadedFile, setUploadedFile, fieldErrors }) {
  const { setValue } = useFormContext();
  const [validationError, setValidationError] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelection = (file) => {
    setValidationError('');
    setUploadPreview(null);
    
    if (!file) {
      setUploadedFile(null);
      setValue('documentFileName', '', { shouldValidate: false });
      return;
    }

    // Validate file using the new utility
    const validation = validateDocumentFile(file);
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join(', '));
      setUploadedFile(null);
      setValue('documentFileName', '', { shouldValidate: false });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // File is valid - set it and create preview
    setUploadedFile(file);
    setValue('documentFileName', file.name, { shouldValidate: false });
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setUploadPreview(event.target.result);
      reader.readAsDataURL(file);
    }
    
    console.log('File successfully selected:', file.name);
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.target.files?.[0] || null;
    handleFileSelection(file);
    
    // Prevent any further event propagation
    return false;
  };

  // Remove file handler
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    setValue('documentFileName', '', { shouldValidate: false });
    setValidationError('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file dialog handler
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Document Upload</h2>
        <p className="text-sm text-gray-400">
          Upload a valid government-issued ID or birth certificate (PDF, JPG, PNG - max 10MB)
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        {!uploadedFile ? (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            
            <div className="space-y-2">
              <div
                onClick={handleOpenFileDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-block"
              >
                Choose File
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.pdf,.png"
                onChange={handleFileInputChange}
                className="hidden"
                tabIndex={-1}
              />
              
              <p className="text-sm text-gray-400">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadPreview ? (
              <div className="flex justify-center">
                <Image 
                  src={uploadPreview} 
                  alt="Document preview" 
                  width={160}
                  height={160}
                  className="max-h-40 max-w-full rounded-lg border border-gray-600 object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="font-medium text-white">{uploadedFile.name}</p>
              <p className="text-sm text-gray-400">{formatFileSize(uploadedFile.size)}</p>
              
              <div className="flex justify-center gap-2 mt-4">
                <div
                  onClick={handleOpenFileDialog}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm cursor-pointer"
                >
                  Change File
                </div>
                <div
                  onClick={handleRemoveFile}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm cursor-pointer"
                >
                  Remove File
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {validationError && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
          <p className="text-sm text-red-400">{validationError}</p>
        </div>
      )}
      
      {uploadedFile && !validationError && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">Document ready for submission</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Registration Status View Component
function RegistrationStatusView({ registrationStatus }) {
  const router = useRouter();
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'text-green-400 bg-green-900/30';
      case 'rejected':
        return 'text-red-400 bg-red-900/30';
      case 'pending':
      default:
        return 'text-yellow-400 bg-yellow-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <Shield className="w-5 h-5" />; 
      case 'pending':
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getStatusColor(registrationStatus.status)}`}>
                  {getStatusIcon(registrationStatus.status)}
                </div>
                <h1 className="text-2xl font-bold mb-2">Registration Submitted</h1>
                <p className="text-gray-400">You have already submitted your registration application</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Information */}
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registrationStatus.status)}`}>
                    {getStatusIcon(registrationStatus.status)}
                    <span className="ml-2 capitalize">{registrationStatus.status || 'Pending'}</span>
                  </span>
                </div>

                {registrationStatus.cid && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Community ID (CID):</span>
                    <span className="font-mono text-blue-400">{registrationStatus.cid}</span>
                  </div>
                )}

                {registrationStatus.applicationReferenceNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Application Reference:</span>
                    <span className="font-mono text-green-400">{registrationStatus.applicationReferenceNumber}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-white">{formatDateTime(registrationStatus.submittedAt)}</span>
                </div>
              </div>

              {/* Status Messages */}
              {registrationStatus.status === 'pending' && (
                <Alert className="bg-yellow-900/30 text-yellow-300 border-yellow-600">
                  <Upload className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Application Under Review</p>
                    <p className="text-sm mt-1">Your registration is being reviewed by our admin team. You will be notified via email once the review is complete.</p>
                  </div>
                </Alert>
              )}

              {registrationStatus.status === 'approved' && (
                <Alert className="bg-green-900/30 text-green-300 border-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Registration Approved!</p>
                    <p className="text-sm mt-1">Congratulations! Your registration has been approved. You can now access all member services.</p>
                  </div>
                </Alert>
              )}

              {registrationStatus.status === 'rejected' && (
                <Alert className="bg-red-900/30 text-red-300 border-red-600">
                  <Shield className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Registration Needs Attention</p>
                    <p className="text-sm mt-1">There are some issues with your registration that need to be resolved. Please check your email for details or contact support.</p>
                  </div>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={() => router.push('/member')} className="w-full">
                  Go to Member Dashboard
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>

              {/* Help Section */}
              <div className="text-center text-sm text-gray-400">
                <p>Need help? Contact our support team:</p>
                <p className="text-blue-400">support@commonwealth-qc.gov.ph</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function RegistrationCompleteSuccess() {
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
            
            <h1 className="text-2xl font-bold mb-2">Registration Complete!</h1>
            <p className="text-gray-400 mb-6">
              Your registration has been completed successfully. You can now access surveys and other features.
            </p>
            
            <div className="space-y-3">
              <Button onClick={() => router.push('/survey')} className="w-full">
                Take Survey
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

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal 
          formData={formData}
          onClose={() => setShowPreview(false)}
          onSubmit={() => {
            setShowPreview(false);
            handleSubmit(onSubmit)();
          }}
        />
      )}
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ formData, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Registration Preview</h3>
            <Button 
              onClick={onClose} 
              variant="outline" 
              size="sm"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              ×
            </Button>
          </div>
          <p className="text-gray-400 mt-2">Please review your information before submitting</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <p className="text-white">{formData.firstName} {formData.middleName} {formData.lastName}</p>
              </div>
              <div>
                <span className="text-gray-400">Birth Date:</span>
                <p className="text-white">{formData.birthDate}</p>
              </div>
              <div>
                <span className="text-gray-400">Gender:</span>
                <p className="text-white">{formData.gender}</p>
              </div>
              <div>
                <span className="text-gray-400">Civil Status:</span>
                <p className="text-white">{formData.civilStatus}</p>
              </div>
              <div>
                <span className="text-gray-400">Phone:</span>
                <p className="text-white">{formData.phoneNumber}</p>
              </div>
              <div>
                <span className="text-gray-400">Religion:</span>
                <p className="text-white">{formData.religion}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Address Information
            </h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Present Address:</span>
                <p className="text-white">
                  {formData.presentStreet}, {formData.presentBarangay}, {formData.presentCity}, {formData.presentRegion}
                </p>
              </div>
              {!formData.sameAsPresentAddress && (
                <div>
                  <span className="text-gray-400">Permanent Address:</span>
                  <p className="text-white">
                    {formData.permanentStreet}, {formData.permanentBarangay}, {formData.permanentCity}, {formData.permanentRegion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          {formData.isEmployed && (
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Work Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Employment Type:</span>
                  <p className="text-white">{formData.employmentType}</p>
                </div>
                <div>
                  <span className="text-gray-400">Position:</span>
                  <p className="text-white">{formData.position}</p>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span>
                  <p className="text-white">{formData.companyName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Health Information */}
          {(formData.bloodType || formData.heightCm || formData.weightKg) && (
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Health Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {formData.bloodType && (
                  <div>
                    <span className="text-gray-400">Blood Type:</span>
                    <p className="text-white">{formData.bloodType}</p>
                  </div>
                )}
                {formData.heightCm && (
                  <div>
                    <span className="text-gray-400">Height:</span>
                    <p className="text-white">{formData.heightCm} cm</p>
                  </div>
                )}
                {formData.weightKg && (
                  <div>
                    <span className="text-gray-400">Weight:</span>
                    <p className="text-white">{formData.weightKg} kg</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>
          <Button 
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit Registration
          </Button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(RegistrationFormPage, false, true);
