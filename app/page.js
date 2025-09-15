'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Users, 
  ClipboardList, 
  Shield, 
  Download,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle,
  UserCheck,
  FileText,
  Award,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';

const HomePage = () => {
  const { user, loading, isAdmin } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const router = useRouter();
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/register`;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short'
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Note: Admin redirects are now handled by middleware



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const features = [
    {
      icon: Users,
      title: "Community Registration",
      description: "Register as a Commonwealth resident and access community programs",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: ClipboardList,
      title: "Livelihood Programs",
      description: "Apply for DOLE, DSWD, TESDA, DA, DTI, and OWWA programs",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Shield,
      title: "Social Benefits",
      description: "Access 4Ps, PhilHealth, Social Pension, and AICS programs",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Award,
      title: "Local Government Benefits",
      description: "Apply for scholarships, housing assistance, and community programs",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: FileText,
      title: "Member Dashboard",
      description: "Manage your profile, applications, and track benefit status",
      color: "from-teal-500 to-teal-600"
    },
    {
      icon: UserCheck,
      title: "Admin Portal",
      description: "Administrative tools for member management and approvals",
      color: "from-red-500 to-red-600"
    }
  ];

  const stats = [
    { number: "1000+", label: "Registered Members" },
    { number: "15+", label: "Available Programs" },
    { number: "500+", label: "Approved Applications" },
    { number: "24/7", label: "Support Available" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <MapPin className="h-8 w-8 text-blue-400" />
                <span className="text-blue-400 font-semibold text-lg">Barangay Commonwealth</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                Community
                <br />
                Registration Portal
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Your gateway to livelihood programs, social benefits, and community services. 
                Register today and unlock opportunities for you and your family.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-12">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-8">
                <Clock className="h-5 w-5" />
                <span>Last updated: {currentTime}</span>
              </div>
              
              {user ? (
                <div className="space-y-4">
                  <p className="text-green-400 text-lg">Welcome back, {user.email}!</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/registration">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg">
                        Complete Registration
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/survey">
                      <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-8 py-3 text-lg">
                        Take Survey
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/register">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg">
                        Register Now
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-8 py-3 text-lg">
                        Sign In
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <Button
                      onClick={() => setShowQR(!showQR)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2"
                    >
                      <Smartphone className="mr-2 h-5 w-5" />
                      {showQR ? 'Hide QR Code' : 'Show QR Code for Mobile'}
                    </Button>
                    
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 border border-gray-600 p-4 rounded-lg shadow-lg"
                      >
                        <QRCodeSVG
                          value={registrationUrl}
                          size={200}
                          bgColor="#1f2937"
                          fgColor="#ffffff"
                          level="L"
                          includeMargin={true}
                        />
                        <p className="text-center text-gray-300 mt-2 text-sm">
                          Scan to register on mobile
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
              Available Services
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive registration and benefit management system for Commonwealth residents
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 h-full">
                    <div className="p-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Registration Requirements</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                What you need to prepare for registration
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-gray-700 border-gray-600 p-6">
                <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Personal Documents</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Valid ID (Government-issued)</li>
                  <li>• Birth Certificate</li>
                  <li>• Proof of Address</li>
                </ul>
              </Card>

              <Card className="bg-gray-700 border-gray-600 p-6">
                <CheckCircle className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Commonwealth Residency</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Must be a resident of Barangay Commonwealth</li>
                  <li>• Valid Commonwealth address</li>
                  <li>• Barangay clearance (if available)</li>
                </ul>
              </Card>

              <Card className="bg-gray-700 border-gray-600 p-6">
                <CheckCircle className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Contact Information</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Valid email address</li>
                  <li>• Active mobile number</li>
                  <li>• Emergency contact details</li>
                </ul>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of Commonwealth residents who have already registered and are benefiting from community programs.
            </motion.p>
            <motion.div variants={itemVariants}>
              {!user && (
                <Link href="/auth/register">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg font-semibold">
                    Start Registration Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
