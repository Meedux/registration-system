'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/firebaseAuth';
import { Button } from '@/components/ui';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Home,
  ClipboardList,
  Users,
  UserPlus
} from 'lucide-react';

export default function Navigation() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  const menuItems = [
    { href: '/', label: 'Home', icon: Home, show: true },
    { href: '/survey', label: 'Survey', icon: ClipboardList, show: isAuthenticated && !isAdmin },
    { href: '/registration', label: 'Complete Registration', icon: UserPlus, show: isAuthenticated && !isAdmin },
    { href: '/admin', label: 'Admin Panel', icon: Users, show: isAdmin },
  ];

  return (
    <nav className="bg-gray-800/95 backdrop-blur-sm border-b-0 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-2 bg-blue-600 rounded-lg"
            >
              <ClipboardList className="w-6 h-6" />
            </motion.div>
            <span className="text-xl font-bold hidden sm:block">Registration System</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              if (!item.show) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:block text-sm">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border-0 rounded-lg shadow-xl z-50"
                      onBlur={() => setIsProfileOpen(false)}
                    >
                      <div className="p-3 border-b-0">
                        <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {/* <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push('/profile');
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </button> */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-700 transition-colors text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/auth/login')}
                  className="hidden sm:flex"
                >
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth/register')}>
                  Register
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t-0 py-4"
            >
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  if (!item.show) return null;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {!isAuthenticated && (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
