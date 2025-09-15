'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { saveSurveyResponse, getUserData } from '@/lib/firebaseAuth';
import { Button, Card, CardHeader, CardContent, Alert, Checkbox } from '@/components/ui';
import { 
  ClipboardList, 
  ArrowLeft, 
  CheckCircle, 
  Briefcase, 
  Users, 
  DollarSign,
  GraduationCap,
  Heart,
  ChevronRight,
  Info,
  Save,
  Eye,
  AlertCircle,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Star,
  BookOpen,
  Filter,
  Search,
  X,
  HelpCircle,
  TrendingUp,
  Target,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import withAuth from '@/components/withAuth';

const livelihoodPrograms = [
  {
    id: 'kabuhayan',
    title: 'Kabuhayan Programs',
    description: 'Community-based livelihood and entrepreneurship programs',
    icon: Briefcase,
    color: 'blue',
    programs: [
      {
        id: 'micro-business',
        name: 'Micro Business Development',
        description: 'Support for small business startups and expansion'
      },
      {
        id: 'cooperative-dev',
        name: 'Cooperative Development',
        description: 'Formation and strengthening of cooperatives'
      },
      {
        id: 'agri-enterprise',
        name: 'Agriculture Enterprise',
        description: 'Agricultural business and farming initiatives'
      },
      {
        id: 'skills-training',
        name: 'Skills Training Programs',
        description: 'Technical and vocational skills development'
      }
    ]
  },
  {
    id: 'dole-integrated',
    title: 'DOLE Integrated Livelihood & Emergency Employment Program',
    description: 'Department of Labor and Employment support programs',
    icon: Users,
    color: 'green',
    programs: [
      {
        id: 'tupad',
        name: 'TUPAD (Tulong Panghanapbuhay sa Ating Disadvantaged/Displaced Workers)',
        description: 'Emergency employment for displaced workers'
      },
      {
        id: 'kabalikat',
        name: 'KABALIKAT sa Paggawa',
        description: 'Partnership program for employment generation'
      },
      {
        id: 'camp',
        name: 'Community-based Employment Program (CAMP)',
        description: 'Community infrastructure and services employment'
      },
      {
        id: 'special-program',
        name: 'Special Program for Employment of Students (SPES)',
        description: 'Employment program for students during breaks'
      }
    ]
  },
  {
    id: 'dswd-slp',
    title: 'DSWD Sustainable Livelihood Program (SLP)',
    description: 'Department of Social Welfare and Development livelihood support',
    icon: Heart,
    color: 'purple',
    programs: [
      {
        id: 'microenterprise-dev',
        name: 'Microenterprise Development',
        description: 'Support for microenterprise establishment and development'
      },
      {
        id: 'employment-facilitation',
        name: 'Employment Facilitation',
        description: 'Job placement and employment assistance'
      },
      {
        id: 'capacity-building',
        name: 'Capacity Building',
        description: 'Skills enhancement and capability development'
      },
      {
        id: 'resource-augmentation',
        name: 'Resource Augmentation',
        description: 'Access to capital and resources for livelihood'
      }
    ]
  },
  {
    id: 'employment-facilitation',
    title: 'Employment Facilitation',
    description: 'Job referrals and employment matching services',
    icon: GraduationCap,
    color: 'orange',
    programs: [
      {
        id: 'job-matching',
        name: 'Job Matching Services',
        description: 'Connecting jobseekers with employers'
      },
      {
        id: 'career-counseling',
        name: 'Career Counseling',
        description: 'Professional guidance and career planning'
      },
      {
        id: 'job-fairs',
        name: 'Job Fairs and Recruitment',
        description: 'Organized job fairs and recruitment events'
      },
      {
        id: 'skills-assessment',
        name: 'Skills Assessment',
        description: 'Evaluation of skills and competencies'
      }
    ]
  },
  {
    id: 'pantawid-addons',
    title: '4Ps Add-ons',
    description: 'Additional programs for Pantawid Pamilyang Pilipino Program beneficiaries',
    icon: DollarSign,
    color: 'yellow',
    programs: [
      {
        id: 'family-dev-sessions',
        name: 'Family Development Sessions',
        description: 'Regular sessions on health, education, and family planning'
      },
      {
        id: 'savings-groups',
        name: 'Community Savings Groups',
        description: 'Formation of savings and credit associations'
      },
      {
        id: 'livelihood-grants',
        name: 'Livelihood Grants',
        description: 'Additional financial support for income-generating activities'
      },
      {
        id: 'health-nutrition',
        name: 'Health and Nutrition Programs',
        description: 'Supplementary health and nutrition interventions'
      }
    ]
  }
];

function SurveyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPrograms, setSelectedPrograms] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [programNotes, setProgramNotes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [favoritePrograms, setFavoritePrograms] = useState(new Set());
  const [completedSteps, setCompletedSteps] = useState(new Set([0])); // Welcome step is always completed

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        const { success, userData: data } = await getUserData(user.uid);
        if (success) {
          setUserData(data);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Auto-save functionality
  useEffect(() => {
    if (!user?.uid || autoSaving || Object.keys(selectedPrograms).length === 0) return;

    const saveTimer = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const surveyDraft = {
          selectedPrograms,
          programNotes,
          favoritePrograms: Array.from(favoritePrograms),
          currentStep,
          lastSavedAt: new Date().toISOString(),
          isDraft: true
        };
        localStorage.setItem(`survey_draft_${user.uid}`, JSON.stringify(surveyDraft));
        setLastSaved(new Date());
        setSuccess('Progress saved automatically');
        setTimeout(() => setSuccess(''), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [selectedPrograms, programNotes, favoritePrograms, currentStep, user?.uid, autoSaving]);

  // Load saved draft on mount
  useEffect(() => {
    if (user?.uid) {
      try {
        const savedDraft = localStorage.getItem(`survey_draft_${user.uid}`);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          if (draftData.isDraft) {
            setSelectedPrograms(draftData.selectedPrograms || {});
            setProgramNotes(draftData.programNotes || {});
            setFavoritePrograms(new Set(draftData.favoritePrograms || []));
            setCurrentStep(draftData.currentStep || 0);
            setSuccess('Previous progress loaded successfully');
            setTimeout(() => setSuccess(''), 3000);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [user?.uid]);

  const steps = [
    { title: 'Welcome', description: 'Survey introduction' },
    ...livelihoodPrograms.map(program => ({
      title: program.title,
      description: program.description
    })),
    { title: 'Review', description: 'Review your selections' },
    { title: 'Additional Info', description: 'Additional information' }
  ];

  const handleProgramSelection = (categoryId, programId, isSelected) => {
    setSelectedPrograms(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [programId]: isSelected
      }
    }));

    // Mark step as completed if at least one program is selected
    if (isSelected) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  };

  const handleCategoryToggle = (categoryId, isSelected) => {
    const category = livelihoodPrograms.find(p => p.id === categoryId);
    const newCategorySelections = {};
    
    category.programs.forEach(program => {
      newCategorySelections[program.id] = isSelected;
    });

    setSelectedPrograms(prev => ({
      ...prev,
      [categoryId]: newCategorySelections
    }));

    if (isSelected) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  };

  const handleProgramNote = (categoryId, programId, note) => {
    const key = `${categoryId}-${programId}`;
    setProgramNotes(prev => ({
      ...prev,
      [key]: note
    }));
  };

  const handleFavoriteToggle = (categoryId, programId) => {
    const key = `${categoryId}-${programId}`;
    setFavoritePrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getFilteredPrograms = (programs) => {
    if (!searchTerm) return programs;
    return programs.filter(program => 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSelectedCount = () => {
    let count = 0;
    Object.values(selectedPrograms).forEach(category => {
      Object.values(category || {}).forEach(selected => {
        if (selected) count++;
      });
    });
    return count;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed if it has selections
      if (currentStep > 0 && currentStep <= livelihoodPrograms.length) {
        const categoryId = livelihoodPrograms[currentStep - 1].id;
        const hasSelections = selectedPrograms[categoryId] && 
          Object.values(selectedPrograms[categoryId]).some(selected => selected);
        
        if (hasSelections) {
          setCompletedSteps(prev => new Set([...prev, currentStep]));
        }
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const submitSurvey = async () => {
    const selectedCount = getSelectedCount();
    
    if (selectedCount === 0) {
      setError('Please select at least one program before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const surveyData = {
        selectedPrograms,
        programNotes,
        favoritePrograms: Array.from(favoritePrograms),
        completedAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        selectedCount,
        surveyVersion: '2.0',
        userData: {
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          email: user.email
        }
      };

      const { success, error: saveError } = await saveSurveyResponse(user.uid, surveyData);
      
      if (success) {
        // Clear draft after successful submission
        localStorage.removeItem(`survey_draft_${user.uid}`);
        setIsComplete(true);
      } else {
        setError(saveError || 'Failed to submit survey. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCurrentStep = () => {
    if (currentStep === 0) return true; // Welcome step
    if (currentStep >= 1 && currentStep <= livelihoodPrograms.length) {
      const categoryId = livelihoodPrograms[currentStep - 1].id;
      return selectedPrograms[categoryId] && 
        Object.values(selectedPrograms[categoryId]).some(selected => selected);
    }
    if (currentStep === steps.length - 2) { // Review step
      return getSelectedCount() > 0;
    }
    return true; // Final step
  };

  if (isComplete) {
    return <SurveyCompleteSuccess />;
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

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
            <h1 className="text-3xl font-bold mb-2">Livelihood Programs Survey</h1>
            <p className="text-gray-400">Select programs that interest you</p>
          </motion.div>
        </div>

        {/* Enhanced Progress Section */}
        <div className="mb-8">
          {/* Status Indicators */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">Survey Progress</span>
              {autoSaving && (
                <div className="flex items-center text-blue-400 text-xs">
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  Auto-saving...
                </div>
              )}
              {lastSaved && !autoSaving && (
                <div className="flex items-center text-green-400 text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {getSelectedCount()} programs selected
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={getSelectedCount() === 0}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-300">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step Navigation Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isAccessible = index <= currentStep || isCompleted;

              return (
                <button
                  key={index}
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : isAccessible
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {step.title}
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{steps[currentStep]?.title}</h2>
                <p className="text-gray-400">{steps[currentStep]?.description}</p>
              </div>
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                {error}
              </Alert>
            )}

            {/* Current Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      {steps[currentStep]?.title}
                      {completedSteps.has(currentStep) && (
                        <CheckCircle2 className="w-6 h-6 ml-2 text-green-500" />
                      )}
                    </h2>
                    <p className="text-gray-300 mt-2">
                      {steps[currentStep]?.description}
                    </p>
                  </div>
                  
                  {/* Step Actions */}
                  <div className="flex items-center space-x-2">
                    {currentStep >= 1 && currentStep <= livelihoodPrograms.length && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Search programs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFavoritePrograms(new Set())}
                          disabled={favoritePrograms.size === 0}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          Clear Favorites
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Feedback */}
                {currentStep > 0 && !validateCurrentStep() && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-900/50 border border-yellow-600 rounded-md p-3 mb-4"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                      <p className="text-yellow-200 text-sm">
                        {currentStep >= 1 && currentStep <= livelihoodPrograms.length
                          ? 'Please select at least one livelihood program to continue.'
                          : 'Please complete the required fields for this step.'
                        }
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step Content */}
                {currentStep === 0 && <WelcomeStep userData={userData} />}
                
                {currentStep >= 1 && currentStep <= livelihoodPrograms.length && (
                  <ProgramStep
                    program={livelihoodPrograms[currentStep - 1]}
                    selectedPrograms={selectedPrograms}
                    onProgramSelection={handleProgramSelection}
                    onCategoryToggle={handleCategoryToggle}
                    searchTerm={searchTerm}
                    favoritePrograms={favoritePrograms}
                    onToggleFavorite={(programId) => {
                      const newFavorites = new Set(favoritePrograms);
                      if (newFavorites.has(programId)) {
                        newFavorites.delete(programId);
                      } else {
                        newFavorites.add(programId);
                      }
                      setFavoritePrograms(newFavorites);
                    }}
                    programNotes={programNotes}
                    onUpdateNotes={(programId, notes) => {
                      setProgramNotes(prev => ({
                        ...prev,
                        [programId]: notes
                      }));
                    }}
                  />
                )}
                
                {currentStep === steps.length - 2 && (
                  <ReviewStep
                    selectedPrograms={selectedPrograms}
                    livelihoodPrograms={livelihoodPrograms}
                    programNotes={programNotes}
                  />
                )}
                
                {currentStep === steps.length - 1 && (
                  <AdditionalInfoStep />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t-0">
              <Button
                onClick={prevStep}
                disabled={currentStep === 0}
                variant="outline"
              >
                Previous
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  {getSelectedCount()} programs selected
                </p>
              </div>

              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={submitSurvey}
                  loading={isLoading}
                  disabled={isLoading || getSelectedCount() === 0}
                >
                  Submit Survey
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Modal */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Survey Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Personal Information</h4>
                    <div className="bg-gray-700 rounded-md p-4 space-y-2">
                      <p className="text-gray-300"><span className="font-medium">Name:</span> {userData?.firstName} {userData?.lastName}</p>
                      <p className="text-gray-300"><span className="font-medium">Email:</span> {userData?.email}</p>
                      <p className="text-gray-300"><span className="font-medium">Phone:</span> {userData?.phoneNumber}</p>
                      <p className="text-gray-300"><span className="font-medium">Address:</span> {userData?.address}</p>
                    </div>
                  </div>

                  {/* Selected Programs */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Selected Programs ({getSelectedCount()})</h4>
                    <div className="space-y-3">
                      {livelihoodPrograms
                        .filter(program => selectedPrograms[program.id])
                        .map(program => (
                          <div key={program.id} className="bg-gray-700 rounded-md p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-white">{program.title}</h5>
                                <p className="text-gray-300 text-sm mt-1">{program.description}</p>
                                
                                {/* Selected Categories */}
                                {selectedPrograms[program.id]?.categories?.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-gray-400 text-xs font-medium mb-2">Selected Categories:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedPrograms[program.id].categories.map(category => (
                                        <span
                                          key={category}
                                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Notes */}
                                {programNotes[program.id] && (
                                  <div className="mt-3">
                                    <p className="text-gray-400 text-xs font-medium mb-1">Notes:</p>
                                    <p className="text-gray-300 text-sm bg-gray-600 rounded p-2">
                                      {programNotes[program.id]}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {favoritePrograms.has(program.id) && (
                                <Heart className="w-5 h-5 text-red-500 fill-current ml-3" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {additionalInfo && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Additional Information</h4>
                      <div className="bg-gray-700 rounded-md p-4">
                        <p className="text-gray-300 whitespace-pre-wrap">{additionalInfo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    submitSurvey();
                  }}
                  disabled={getSelectedCount() === 0 || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ userData }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
        className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center"
      >
        <ClipboardList className="w-8 h-8" />
      </motion.div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2">
          Welcome{userData?.firstName ? `, ${userData.firstName}` : ''}!
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          This survey will help us understand which livelihood programs interest you. 
          Please review each category and select the specific programs you would like to learn more about or participate in.
        </p>
      </div>

      <div className="bg-blue-900/20 border-0 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-semibold text-blue-300 mb-1">Important Information</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• You can select multiple programs across different categories</li>
              <li>• Your selections help us tailor programs to community needs</li>
              <li>• All responses are confidential and used for program planning only</li>
              <li>• You can change your selections before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramStep({ 
  program, 
  selectedPrograms, 
  onProgramSelection, 
  onCategoryToggle,
  searchTerm = '',
  favoritePrograms = new Set(),
  onToggleFavorite,
  programNotes = {},
  onUpdateNotes
}) {
  const Icon = program.icon;
  const categorySelected = selectedPrograms[program.id] || {};
  const allSelected = program.programs.every(p => categorySelected[p.id]);
  const someSelected = program.programs.some(p => categorySelected[p.id]);

  // Filter programs based on search term
  const filteredPrograms = program.programs.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClasses[program.color]}`}>
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{program.title}</h3>
        <p className="text-gray-400">{program.description}</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <Checkbox
          checked={allSelected}
          onChange={(e) => onCategoryToggle(program.id, e.target.checked)}
          className="mb-2"
        >
          <span className="font-semibold">
            {allSelected ? 'Deselect All' : 'Select All'} Programs
          </span>
        </Checkbox>
        {someSelected && !allSelected && (
          <p className="text-sm text-gray-400 ml-6">Some programs selected</p>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-400">
          Showing {filteredPrograms.length} of {program.programs.length} programs
          {filteredPrograms.length === 0 && (
            <span className="text-yellow-400 ml-2">
              No programs match your search
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((subProgram) => {
          const isSelected = categorySelected[subProgram.id];
          const isFavorite = favoritePrograms.has(subProgram.id);
          const hasNotes = programNotes[subProgram.id];

          return (
            <motion.div
              key={subProgram.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'hover:bg-gray-800'
                } ${isFavorite ? 'ring-1 ring-red-500/50' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onProgramSelection(program.id, subProgram.id, !isSelected);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isSelected || false}
                      readOnly
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{subProgram.name}</h4>
                        <div className="flex items-center space-x-1">
                          {hasNotes && (
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(subProgram.id);
                            }}
                            className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                              isFavorite ? 'text-red-500' : 'text-gray-400'
                            }`}
                          >
                            <Heart 
                              className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} 
                            />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{subProgram.description}</p>
                      
                      {/* Notes Section */}
                      <div className="mt-3">
                        <textarea
                          placeholder="Add personal notes about this program..."
                          value={programNotes[subProgram.id] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateNotes(subProgram.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({ selectedPrograms, livelihoodPrograms, programNotes = {} }) {
  const selectedItems = [];
  
  livelihoodPrograms.forEach(category => {
    const categorySelections = selectedPrograms[category.id] || {};
    category.programs.forEach(program => {
      if (categorySelections[program.id]) {
        selectedItems.push({
          category: category.title,
          program: program.name,
          description: program.description,
          color: category.color
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Review Your Selections</h3>
        <p className="text-gray-400">
          You have selected {selectedItems.length} programs. Review your choices below.
        </p>
      </div>

      {selectedItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No programs selected. Please go back and make your selections.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-l-0">
                <CardContent className="p-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{item.program}</h4>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdditionalInfoStep() {
  return (
    <div className="space-y-6 text-center">
      <h3 className="text-2xl font-bold">Almost Done!</h3>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Thank you for taking the time to complete this survey. Your responses will help us 
        better understand community needs and improve our programs.
      </p>
      
      <div className="bg-green-900/20 border-0 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-semibold text-green-300 mb-1">What happens next?</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• We will review your program interests</li>
              <li>• You may be contacted with relevant opportunities</li>
              <li>• Updates on selected programs will be shared when available</li>
              <li>• You can update your preferences anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyCompleteSuccess() {
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
            
            <h1 className="text-2xl font-bold mb-2">Survey Submitted!</h1>
            <p className="text-gray-400 mb-6">
              Thank you for completing the survey. We&apos;ll be in touch with relevant program updates.
            </p>
            
            <div className="space-y-3">
              <Button onClick={() => router.push('/')} className="w-full">
                Return Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/survey')}
                className="w-full"
              >
                Take Survey Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuth(SurveyPage, false, true);
