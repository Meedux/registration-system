'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, updateUserData, saveBenefitApplication, saveContactQuery } from '@/lib/firebaseAuth';
import { Button, Card, CardHeader, CardContent, Input, Select, Alert } from '@/components/ui';
import { 
  User, 
  Edit, 
  FileText, 
  MessageSquare, 
  LogOut, 
  Phone, 
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Award,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { isFromCommonwealth } from '@/lib/locationData';
import withAuth from '@/components/withAuth';

function MemberDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Benefit application state
  const [benefitApplication, setBenefitApplication] = useState({
    programType: '',
    programName: '',
    reason: '',
    additionalInfo: ''
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    urgency: 'normal'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const { success, userData: data, error: fetchError } = await getUserData(user.uid);
        
        if (success) {
          setUserData(data);
          setEditData(data);
        } else {
          setError(fetchError);
        }
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);



  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Validate Commonwealth requirement for address changes
    if (editData.presentBarangay !== userData.presentBarangay || 
        editData.presentCity !== userData.presentCity) {
      if (!isFromCommonwealth(editData.presentBarangay, editData.presentCity)) {
        setError('Address changes are only allowed within Commonwealth, Quezon City');
        return;
      }
    }

    setLoading(true);
    try {
      const { success, error: updateError } = await updateUserData(user.uid, editData);
      
      if (success) {
        setUserData(editData);
        setIsEditing(false);
        setSuccess('Profile updated successfully! Changes are pending admin review.');
      } else {
        setError(updateError);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBenefitApplication = async () => {
    if (!benefitApplication.programType || !benefitApplication.programName || !benefitApplication.reason) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const applicationData = {
        ...benefitApplication,
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        cid: userData.cid,
        status: 'Pending',
        appliedAt: new Date().toISOString()
      };

      const { success, error: appError } = await saveBenefitApplication(applicationData);
      
      if (success) {
        setSuccess('Benefit application submitted successfully!');
        setBenefitApplication({ programType: '', programName: '', reason: '', additionalInfo: '' });
      } else {
        setError(appError);
      }
    } catch (err) {
      setError('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    // Validate Commonwealth requirement
    if (!isFromCommonwealth(userData.presentBarangay, userData.presentCity)) {
      setError('Contact form is only available for Commonwealth residents');
      return;
    }

    if (!contactForm.subject || !contactForm.message) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const queryData = {
        ...contactForm,
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        cid: userData.cid,
        barangay: userData.presentBarangay,
        submittedAt: new Date().toISOString()
      };

      const { success, error: queryError } = await saveContactQuery(queryData);
      
      if (success) {
        setSuccess('Your message has been sent successfully!');
        setContactForm({ subject: '', message: '', urgency: 'normal' });
      } else {
        setError(queryError);
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <X className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-400 mb-4">Please complete your registration first.</p>
            <Button onClick={() => router.push('/registration')} className="w-full">
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = [
    { id: 'profile', title: 'Member Profile', icon: User },
    { id: 'benefits', title: 'Apply for Benefits', icon: Award },
    { id: 'contact', title: 'Contact Us', icon: MessageSquare },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-400 bg-green-400/20';
      case 'In Review': return 'text-yellow-400 bg-yellow-400/20';
      case 'Declined': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Member Dashboard</h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-400">Welcome, {userData.firstName} {userData.lastName}</p>
              {userData.cid && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">CID:</span>
                  <span className="text-sm font-mono bg-blue-900/30 px-2 py-1 rounded">{userData.cid}</span>
                </div>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(userData.status)}`}>
                {userData.status || 'Pending Review'}
              </div>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-900/30 border-green-700 text-green-300">
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Navigation</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setError('');
                          setSuccess('');
                        }}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all ${
                          activeSection === section.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Member Profile Section */}
              {activeSection === 'profile' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Member Profile</h2>
                      <Button
                        onClick={handleEditProfile}
                        disabled={loading}
                        loading={loading && isEditing}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          value={isEditing ? editData.firstName : userData.firstName}
                          onChange={(e) => isEditing && setEditData({...editData, firstName: e.target.value})}
                          disabled={!isEditing}
                        />
                        <Input
                          label="Last Name"
                          value={isEditing ? editData.lastName : userData.lastName}
                          onChange={(e) => isEditing && setEditData({...editData, lastName: e.target.value})}
                          disabled={!isEditing}
                        />
                        <Input
                          label="Birth Date"
                          type="date"
                          value={isEditing ? editData.birthDate : userData.birthDate}
                          disabled
                        />
                        <Input
                          label="Gender"
                          value={userData.gender}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Phone className="w-5 h-5 mr-2" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Phone Number"
                          value={isEditing ? editData.phoneNumber : userData.phoneNumber}
                          onChange={(e) => isEditing && setEditData({...editData, phoneNumber: e.target.value})}
                          disabled={!isEditing}
                        />
                        <Input
                          label="Email"
                          value={userData.email}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Address Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Street Address"
                          value={isEditing ? editData.presentStreet : userData.presentStreet}
                          onChange={(e) => isEditing && setEditData({...editData, presentStreet: e.target.value})}
                          disabled={!isEditing}
                        />
                        <Input
                          label="Barangay"
                          value={userData.presentBarangay}
                          disabled
                        />
                        <Input
                          label="City"
                          value={userData.presentCity}
                          disabled
                        />
                        <Input
                          label="Province"
                          value={userData.presentProvince}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Work Information */}
                    {userData.isEmployed && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Briefcase className="w-5 h-5 mr-2" />
                          Work Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Position"
                            value={isEditing ? editData.position : userData.position}
                            onChange={(e) => isEditing && setEditData({...editData, position: e.target.value})}
                            disabled={!isEditing}
                          />
                          <Input
                            label="Company"
                            value={isEditing ? editData.companyName : userData.companyName}
                            onChange={(e) => isEditing && setEditData({...editData, companyName: e.target.value})}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex space-x-4 pt-4 border-t border-gray-700">
                        <Button onClick={handleEditProfile} loading={loading}>
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setEditData(userData);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Apply for Benefits Section */}
              {activeSection === 'benefits' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Apply for Benefits</h2>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Program Type"
                        value={benefitApplication.programType}
                        onChange={(e) => setBenefitApplication({...benefitApplication, programType: e.target.value})}
                        required
                      >
                        <option value="">Select program type</option>
                        <option value="livelihood">Livelihood Programs</option>
                        <option value="social">Social Benefits</option>
                        <option value="local">Local Government Benefits</option>
                        <option value="emergency">Emergency Assistance</option>
                      </Select>
                      
                      <Input
                        label="Specific Program Name"
                        value={benefitApplication.programName}
                        onChange={(e) => setBenefitApplication({...benefitApplication, programName: e.target.value})}
                        placeholder="e.g., 4Ps, TUPAD, Scholarship"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Reason for Application *</label>
                      <textarea
                        value={benefitApplication.reason}
                        onChange={(e) => setBenefitApplication({...benefitApplication, reason: e.target.value})}
                        placeholder="Please explain why you need this benefit..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Information</label>
                      <textarea
                        value={benefitApplication.additionalInfo}
                        onChange={(e) => setBenefitApplication({...benefitApplication, additionalInfo: e.target.value})}
                        placeholder="Any additional information that might help your application..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleBenefitApplication}
                      loading={loading}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Submit Application
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Contact Us Section */}
              {activeSection === 'contact' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Contact Us</h2>
                    <p className="text-gray-400">Available for Commonwealth residents only</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isFromCommonwealth(userData.presentBarangay, userData.presentCity) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Subject"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                            placeholder="Brief description of your inquiry"
                            required
                          />
                          
                          <Select
                            label="Urgency Level"
                            value={contactForm.urgency}
                            onChange={(e) => setContactForm({...contactForm, urgency: e.target.value})}
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Message *</label>
                          <textarea
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            placeholder="Please describe your inquiry in detail..."
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={6}
                            required
                          />
                        </div>

                        <Button 
                          onClick={handleContactSubmit}
                          loading={loading}
                          className="w-full"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Mail className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Contact Form Not Available</h3>
                        <p className="text-gray-400">
                          The contact form is only available for residents of Commonwealth, Quezon City.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(MemberDashboard, false, true);
