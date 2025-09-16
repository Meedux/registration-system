'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminUsers, getSurveyResponses, updateUserStatus, sendNotificationEmail, updateUserData, deleteUserRegistration, getFlaggedDuplicates, resolveDuplicateFlag, getDuplicateStatistics } from '@/lib/firebaseAuth';
import { getDocumentFromFirestore } from '@/lib/firestoreStorage';
import { exportToCSV, formatDateTime } from '@/lib/utils';
import { Button, Card, CardHeader, CardContent, Alert } from '@/components/ui';
import { 
  Users, 
  ClipboardList, 
  Download, 
  ArrowLeft,
  TrendingUp,
  BarChart,
  FileSpreadsheet,
  Search,
  Calendar,
  UserCheck,
  UserX,
  Settings,
  Shield,
  Mail,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Send,
  MessageSquare,
  Activity,
  Ban,
  Unlock,
  UserPlus,
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Users2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [flaggedDuplicates, setFlaggedDuplicates] = useState([]);
  const [duplicateStats, setDuplicateStats] = useState({ totalFlagged: 0, totalResolved: 0, pendingReview: 0 });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [duplicateAction, setDuplicateAction] = useState('');

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setError('');

    try {
      const [usersResult, surveysResult, flaggedDuplicatesResult, duplicateStatsResult] = await Promise.all([
        getAdminUsers({ status: filterStatus }),
        getSurveyResponses(),
        getFlaggedDuplicates(),
        getDuplicateStatistics()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.users);
      } else {
        setError(usersResult.error);
      }

      if (surveysResult.success) {
        setSurveyResponses(surveysResult.responses);
      }

      setFlaggedDuplicates(flaggedDuplicatesResult);
      setDuplicateStats(duplicateStatsResult);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler for updating user status
  const handleStatusUpdate = async (userId, newStatus, note = '') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { success, error } = await updateUserStatus(userId, newStatus, note);
      
      if (success) {
        // Send email notification
        await sendNotificationEmail(user.email, newStatus, user.cid, note);
        
        // Refresh data
        fetchData();
        
        alert(`User status updated to ${newStatus} successfully!`);
      } else {
        alert(`Failed to update status: ${error}`);
      }
    } catch (err) {
      alert('An error occurred while updating status.');
    }
  };

  // Handler for deleting user
  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the registration for ${user.firstName} ${user.lastName}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const { success, error } = await deleteUserRegistration(userId);
        
        if (success) {
          fetchData();
          setSuccess('User registration deleted successfully.');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(`Failed to delete user: ${error}`);
          setTimeout(() => setError(''), 5000);
        }
      } catch (err) {
        setError('An error occurred while deleting the user.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Handler for user approval/rejection
  const handleUserApproval = async (userId, action, note = '') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { success, error } = await updateUserStatus(userId, action, note);
      
      if (success) {
        await sendNotificationEmail(user.email, action, user.cid || user.id, note);
        fetchData();
        setSuccess(`User ${action} successfully!`);
        setTimeout(() => setSuccess(''), 3000);
        setShowApprovalModal(false);
        setApprovalNote('');
      } else {
        setError(`Failed to ${action} user: ${error}`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError(`An error occurred while ${action} user.`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handler for bulk actions
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedUsers.length} selected user(s)?`
    );
    
    if (confirmed) {
      try {
        const promises = selectedUsers.map(userId => 
          handleUserApproval(userId, action, `Bulk action: ${action}`)
        );
        await Promise.all(promises);
        setSelectedUsers([]);
        setSuccess(`Bulk ${action} completed successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(`An error occurred during bulk ${action}.`);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Handler for opening approval modal
  const openApprovalModal = (user, action) => {
    setSelectedUser(user);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  // Handler for viewing user details
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Handler for resolving duplicate flags
  const handleResolveDuplicate = async (userId, action, note = '') => {
    try {
      const result = await resolveDuplicateFlag(userId, action, note);
      
      if (result.success) {
        fetchData(); // Refresh all data including flagged duplicates
        setShowDuplicateModal(false);
        setSuccess(`Duplicate flag resolved successfully - ${action}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to resolve duplicate flag: ${result.error}`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('An error occurred while resolving duplicate flag.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handler for opening duplicate resolution modal
  const openDuplicateModal = (duplicate, action) => {
    setSelectedDuplicate(duplicate);
    setDuplicateAction(action);
    setApprovalNote('');
    setShowDuplicateModal(true);
  };

  const exportUsersData = () => {
    const exportData = users.map(user => ({
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      'Email': user.email || '',
      'Phone': user.phoneNumber || '',
      'Registration Date': formatDateTime(user.createdAt?.toDate?.() || user.createdAt),
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'Registration Complete': user.registrationCompleted ? 'Yes' : 'No',
      'Address': `${user.street || ''}, ${user.city || ''}, ${user.province || ''}`.replace(/^, |, $/g, ''),
      'Education': user.educationalAttainment || '',
      'Employment Status': user.employmentStatus || '',
      'Monthly Income': user.monthlyIncome || ''
    }));

    exportToCSV(exportData, `users-export-${new Date().toISOString().split('T')[0]}`);
  };

  const exportSurveyData = () => {
    const exportData = surveyResponses.map(response => {
      const selectedPrograms = Object.entries(response.selectedPrograms || {}).flatMap(([category, programs]) =>
        Object.entries(programs || {})
          .filter(([_, selected]) => selected)
          .map(([program, _]) => `${category}: ${program}`)
      ).join('; ');

      return {
        'User Email': response.userEmail || '',
        'Submitted Date': formatDateTime(response.timestamp?.toDate?.() || response.timestamp),
        'Selected Programs Count': response.selectedCount || 0,
        'Selected Programs': selectedPrograms,
        'Response ID': response.id
      };
    });

    exportToCSV(exportData, `survey-responses-${new Date().toISOString().split('T')[0]}`);
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase()?.includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'verified') return matchesSearch && user.emailVerified;
    if (filterStatus === 'unverified') return matchesSearch && !user.emailVerified;
    if (filterStatus === 'complete') return matchesSearch && user.registrationCompleted;
    if (filterStatus === 'incomplete') return matchesSearch && !user.registrationCompleted;
    
    return matchesSearch;
  });

  const stats = {
    totalUsers: users?.length || 0,
    verifiedUsers: users?.filter(u => u.emailVerified)?.length || 0,
    completedRegistrations: users?.filter(u => u.registrationCompleted)?.length || 0,
    totalSurveyResponses: surveyResponses?.length || 0,
    averageProgramsSelected: surveyResponses?.length > 0 
      ? (surveyResponses.reduce((sum, r) => sum + (r.selectedCount || 0), 0) / surveyResponses.length).toFixed(1)
      : '0'
  };

  const registrationTrend = users.reduce((acc, user) => {
    if (user.createdAt) {
      const date = user.createdAt?.toDate?.() || new Date(user.createdAt);
      // Check if date is valid before processing
      if (!isNaN(date.getTime())) {
        const month = date.toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + 1;
      }
    }
    return acc;
  }, {});

  const chartData = Object.keys(registrationTrend).length > 0 ? Object.entries(registrationTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => {
      const dateObj = new Date(month + '-01');
      const formattedMonth = !isNaN(dateObj.getTime()) 
        ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : month;
      return {
        month: formattedMonth,
        registrations: count
      };
    }) : [{ month: 'No Data', registrations: 0 }];

  const programData = surveyResponses.reduce((acc, response) => {
    Object.entries(response.selectedPrograms || {}).forEach(([category, programs]) => {
      Object.entries(programs || {}).forEach(([program, selected]) => {
        if (selected) {
          acc[category] = (acc[category] || 0) + 1;
        }
      });
    });
    return acc;
  }, {});

  const pieData = Object.keys(programData).length > 0 ? Object.entries(programData).map(([name, value], index) => ({
    name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]
  })) : [{ name: 'No Data', value: 1, color: '#6B7280' }];

  const tabs = [
    { id: 'overview', title: 'Overview', icon: TrendingUp },
    { id: 'users', title: 'User Management', icon: Users },
    { id: 'approvals', title: 'Pending Approvals', icon: Clock },
    { id: 'duplicates', title: 'Flagged Duplicates', icon: AlertTriangle },
    { id: 'surveys', title: 'Survey Responses', icon: ClipboardList },
    { id: 'analytics', title: 'Analytics', icon: BarChart },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  // Show loading while auth or data is loading
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // At this point, middleware has already verified admin access
  // so we don't need additional checks here

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and view analytics</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-semibold">{user?.displayName || user?.email}</p>
            </div>
          </motion.div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-600 text-red-300">
            {error}
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-900/20 border-green-600 text-green-300">
            {success}
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                color="blue"
              />
              <StatsCard
                title="Email Verified"
                value={`${stats.verifiedUsers}/${stats.totalUsers}`}
                icon={UserCheck}
                color="green"
              />
              <StatsCard
                title="Completed Registration"
                value={`${stats.completedRegistrations}/${stats.totalUsers}`}
                icon={FileSpreadsheet}
                color="purple"
              />
              <StatsCard
                title="Flagged Duplicates"
                value={duplicateStats.pendingReview}
                icon={AlertTriangle}
                color="yellow"
              />
              <StatsCard
                title="Survey Responses"
                value={stats.totalSurveyResponses}
                icon={ClipboardList}
                color="orange"
              />
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Registrations</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(users || []).slice(0, 5).map((user, index) => (
                    <div key={user.id || index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {formatDateTime(user.createdAt?.toDate?.() || user.createdAt)}
                        </p>
                        <div className="flex space-x-2">
                          {user.emailVerified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                              Verified
                            </span>
                          )}
                          {user.registrationCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-300">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Enhanced Filters and Actions */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border-0 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-0 min-w-[200px]"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border-0 rounded-lg text-white focus:outline-none focus:ring-0"
                >
                  <option value="all">All Users</option>
                  <option value="verified">Email Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="complete">Complete Registration</option>
                  <option value="incomplete">Incomplete Registration</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border-0 rounded-lg text-white focus:outline-none focus:ring-0"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="firstName">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="status">Sort by Status</option>
                </select>
                <Button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  <ArrowLeft className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                </Button>
              </div>
              
              <div className="flex gap-2">
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2 mr-4">
                    <Button 
                      onClick={() => handleBulkAction('approved')}
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve ({selectedUsers.length})
                    </Button>
                    <Button 
                      onClick={() => handleBulkAction('rejected')}
                      size="sm" 
                      variant="outline"
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject ({selectedUsers.length})
                    </Button>
                  </div>
                )}
                <Button onClick={fetchData} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportUsersData} className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Enhanced User Table */}
            <Card className="bg-gray-800/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/70">
                      <tr>
                        <th className="text-left p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(filteredUsers.map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left p-4 text-gray-300">User Details</th>
                        <th className="text-left p-4 text-gray-300">Contact</th>
                        <th className="text-left p-4 text-gray-300">Registration</th>
                        <th className="text-left p-4 text-gray-300">Status</th>
                        <th className="text-left p-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((user, index) => (
                        <tr key={user.id || index} className="hover:bg-gray-800/30">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-400">ID: {user.cid || user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-white">{user.email}</p>
                              {user.phoneNumber && (
                                <p className="text-sm text-gray-400">{user.phoneNumber}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm text-gray-300">
                                {formatDateTime(user.createdAt?.toDate?.() || user.createdAt)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.registrationCompleted ? 'Complete' : 'Incomplete'}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col space-y-1">
                              {user.emailVerified ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/20 text-red-300">
                                  <UserX className="w-3 h-3 mr-1" />
                                  Unverified
                                </span>
                              )}
                              {user.status && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  user.status === 'approved' ? 'bg-green-900/20 text-green-300' :
                                  user.status === 'rejected' ? 'bg-red-900/20 text-red-300' :
                                  user.status === 'pending' ? 'bg-yellow-900/20 text-yellow-300' :
                                  'bg-gray-900/20 text-gray-300'
                                }`}>
                                  {user.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {user.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                  {user.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                  {user.status || 'Pending'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                onClick={() => viewUserDetails(user)}
                                size="sm" 
                                variant="outline"
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {user.status !== 'approved' && (
                                <Button 
                                  onClick={() => openApprovalModal(user, 'approved')}
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {user.status !== 'rejected' && (
                                <Button 
                                  onClick={() => openApprovalModal(user, 'rejected')}
                                  size="sm" 
                                  variant="outline"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <div className="relative group">
                                <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <div className="py-1">
                                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Edit User
                                    </button>
                                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Email
                                    </button>
                                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                      <Ban className="w-4 h-4 mr-2" />
                                      Suspend
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No users found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'approvals' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Pending Approvals</h3>
                <p className="text-gray-400">
                  {users.filter(user => user.status === 'Pending Review' || user.status === 'pending' || !user.status).length} users waiting for approval
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => fetchData()}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {users.filter(user => user.status === 'Pending Review' || user.status === 'pending' || !user.status).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
                  <p className="text-gray-400">All registrations have been reviewed!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-semibold">Users Awaiting Approval</h4>
                  <p className="text-gray-400">Review and approve or reject user registrations</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users
                      .filter(user => user.status === 'Pending Review' || user.status === 'pending' || !user.status)
                      .map((user) => (
                      <div key={user.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <User className="w-5 h-5 text-blue-500" />
                              <div>
                                <h5 className="font-semibold">
                                  {user.firstName} {user.lastName}
                                </h5>
                                <p className="text-sm text-gray-400">
                                  CID: {user.cid} • Registered: {(user.registrationCompletedAt || user.createdAt) ? formatDateTime(user.registrationCompletedAt || user.createdAt) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-gray-400">Email:</span>
                                <p>{user.email}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Phone:</span>
                                <p>{user.phoneNumber}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Birth Date:</span>
                                <p>{user.birthDate}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Address:</span>
                                <p>{user.presentStreet}, {user.presentBarangay}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.emailVerified 
                                  ? 'bg-green-900/30 text-green-300' 
                                  : 'bg-red-900/30 text-red-300'
                              }`}>
                                {user.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-900/30 text-yellow-300">
                                Pending Review
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={() => openApprovalModal(user, 'approved')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => openApprovalModal(user, 'rejected')}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => viewUserDetails(user)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Flagged Duplicates Tab */}
        {activeTab === 'duplicates' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Flagged Duplicate Registrations</h3>
                <p className="text-gray-400">
                  {duplicateStats.pendingReview} pending review • {duplicateStats.totalResolved} resolved
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => fetchData()}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {flaggedDuplicates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-semibold mb-2">No Flagged Duplicates</h3>
                  <p className="text-gray-400">All registrations are clean! No duplicate entries detected.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-semibold">Duplicate Detection Results</h4>
                  <p className="text-gray-400">Review and resolve potential duplicate registrations</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flaggedDuplicates.map((duplicate) => (
                      <div key={duplicate.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              <div>
                                <h5 className="font-semibold">
                                  {duplicate.firstName} {duplicate.lastName}
                                </h5>
                                <p className="text-sm text-gray-400">
                                  CID: {duplicate.cid} • Registered: {duplicate.registrationCompletedAt ? formatDateTime(duplicate.registrationCompletedAt) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-gray-400">Email:</span>
                                <p>{duplicate.email}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Phone:</span>
                                <p>{duplicate.phoneNumber}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Birth Date:</span>
                                <p>{duplicate.birthDate}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Address:</span>
                                <p>{duplicate.presentStreet}, {duplicate.presentBarangay}</p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <span className="text-sm text-gray-400">Duplicate Reasons:</span>
                              <div className="mt-1">
                                {duplicate.duplicateReasons?.map((reason, index) => (
                                  <span 
                                    key={index}
                                    className="inline-block bg-yellow-900/30 text-yellow-300 text-xs px-2 py-1 rounded mr-2 mb-1"
                                  >
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {duplicate.potentialDuplicates && duplicate.potentialDuplicates.length > 0 && (
                              <div className="text-sm">
                                <span className="text-gray-400">Similar to:</span>
                                <p className="text-blue-400">
                                  {duplicate.potentialDuplicates.length} other registration(s)
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={() => openDuplicateModal(duplicate, 'approve')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => openDuplicateModal(duplicate, 'pending')}
                              size="sm"
                              variant="outline"
                              className="border-gray-600"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              To Review
                            </Button>
                            <Button
                              onClick={() => openDuplicateModal(duplicate, 'reject')}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => viewUserDetails(duplicate)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Survey Responses Tab */}
        {activeTab === 'surveys' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Survey Responses</h3>
                <p className="text-gray-400">{surveyResponses.length} total responses</p>
              </div>
              <Button onClick={exportSurveyData} className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Survey Data
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Submitted Date</th>
                        <th className="text-left p-4">Programs Selected</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {(surveyResponses || []).map((response, index) => (
                        <tr key={response.id || index} className="hover:bg-gray-800/30">
                          <td className="p-4">
                            <p className="font-medium">{response.userEmail}</p>
                          </td>
                          <td className="p-4 text-sm">
                            {formatDateTime(response.timestamp?.toDate?.() || response.timestamp)}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-300">
                              {response.selectedCount || 0} programs
                            </span>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trend */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Registration Trend</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="registrations" fill="#3B82F6" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Program Interest Distribution */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Program Interest Distribution</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <h4 className="text-2xl font-bold text-blue-400">{stats.averageProgramsSelected}</h4>
                  <p className="text-gray-400">Average Programs per User</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <h4 className="text-2xl font-bold text-green-400">
                    {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : '0'}%
                  </h4>
                  <p className="text-gray-400">Email Verification Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <h4 className="text-2xl font-bold text-purple-400">
                    {stats.totalUsers > 0 ? ((stats.completedRegistrations / stats.totalUsers) * 100).toFixed(1) : '0'}%
                  </h4>
                  <p className="text-gray-400">Registration Completion Rate</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Settings */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    System Settings
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-white">Auto-approve verified emails</p>
                      <p className="text-sm text-gray-400">Automatically approve users with verified email addresses</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-white">Email notifications</p>
                      <p className="text-sm text-gray-400">Send email notifications for status changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-white">Require registration completion</p>
                      <p className="text-sm text-gray-400">Only allow approval after full registration</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Management */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Admin Management
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-white mb-2">Current Admin</p>
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.displayName?.[0] || user?.email?.[0] || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white">{user?.displayName || user?.email}</p>
                        <p className="text-sm text-gray-400">Super Admin</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add New Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Templates */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Templates
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Approval Email Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Rejection Email Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Welcome Email Template
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    System Status
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Database Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Email Service</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Storage</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-900/20 text-yellow-300">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                      75% Used
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => setShowUserModal(false)}
          onApprove={(action, note) => {
            handleUserApproval(selectedUser.id, action, note);
            setShowUserModal(false);
          }}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedUser && (
        <ApprovalModal 
          user={selectedUser}
          action={approvalAction}
          note={approvalNote}
          onNoteChange={setApprovalNote}
          onConfirm={() => handleUserApproval(selectedUser.id, approvalAction, approvalNote)}
          onClose={() => {
            setShowApprovalModal(false);
            setApprovalNote('');
          }}
        />
      )}

      {/* Duplicate Resolution Modal */}
      {showDuplicateModal && selectedDuplicate && (
        <DuplicateResolutionModal 
          duplicate={selectedDuplicate}
          action={duplicateAction}
          note={approvalNote}
          onNoteChange={setApprovalNote}
          onConfirm={() => handleResolveDuplicate(selectedDuplicate.id, duplicateAction, approvalNote)}
          onClose={() => {
            setShowDuplicateModal(false);
            setApprovalNote('');
          }}
        />
      )}
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// User Details Modal Component
function UserDetailsModal({ user, onClose, onApprove }) {
  const [userDocument, setUserDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Load user document if available
  useEffect(() => {
    const loadDocument = async () => {
      if (user?.documentInfo?.documentId) {
        setDocumentLoading(true);
        try {
          const result = await getDocumentFromFirestore(user.documentInfo.documentId);
          if (result.success) {
            setUserDocument(result);
          }
        } catch (error) {
          console.error('Error loading document:', error);
        } finally {
          setDocumentLoading(false);
        }
      }
    };

    loadDocument();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Complete User Registration</h3>
          <Button onClick={onClose} variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg mb-6">
          {[
            { id: 'personal', title: 'Personal Info', icon: User },
            { id: 'contact', title: 'Contact & Address', icon: MapPin },
            { id: 'work', title: 'Work & Education', icon: Briefcase },
            { id: 'documents', title: 'Documents', icon: FileText },
            { id: 'programs', title: 'Programs', icon: Users2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.title}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white">{user.firstName} {user.lastName}</h4>
                <p className="text-gray-400">{user.email}</p>
                <p className="text-sm text-gray-500">ID: {user.cid || user.id}</p>
                {user.applicationReferenceNumber && (
                  <p className="text-sm text-blue-400">Ref: {user.applicationReferenceNumber}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col space-y-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  user.status === 'approved' ? 'bg-green-900/20 text-green-300' :
                  user.status === 'rejected' ? 'bg-red-900/20 text-red-300' :
                  'bg-yellow-900/20 text-yellow-300'
                }`}>
                  {user.status === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
                  {user.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                  {(!user.status || user.status === 'pending') && <Clock className="w-4 h-4 mr-1" />}
                  {user.status || 'Pending'}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-300">
                    <Shield className="w-3 h-3 mr-1" />
                    Email Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Personal Information
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">First Name:</span>
                        <p className="text-gray-300 font-medium">{user.firstName || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Name:</span>
                        <p className="text-gray-300 font-medium">{user.lastName || 'Not provided'}</p>
                      </div>
                    </div>
                    {user.middleName && (
                      <div>
                        <span className="text-gray-400">Middle Name:</span>
                        <p className="text-gray-300">{user.middleName}</p>
                      </div>
                    )}
                    {user.extension && (
                      <div>
                        <span className="text-gray-400">Extension:</span>
                        <p className="text-gray-300">{user.extension}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Birth Date:</span>
                        <p className="text-gray-300">{user.birthDate || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Age:</span>
                        <p className="text-gray-300">
                          {user.birthDate ? (() => {
                            const birthYear = new Date(user.birthDate).getFullYear();
                            return isNaN(birthYear) ? 'N/A' : `${new Date().getFullYear() - birthYear} years`;
                          })() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Place of Birth:</span>
                      <p className="text-gray-300">{user.placeOfBirth || 'Not provided'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Gender:</span>
                        <p className="text-gray-300">{user.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Civil Status:</span>
                        <p className="text-gray-300">{user.civilStatus || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Nationality:</span>
                        <p className="text-gray-300">{user.nationality || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Religion:</span>
                        <p className="text-gray-300">{user.religion || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Registration Status
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Registration Date:</span>
                      <p className="text-gray-300">
                        {formatDateTime(user.createdAt?.toDate?.() || user.createdAt)}
                      </p>
                    </div>
                    {user.submittedAt && (
                      <div>
                        <span className="text-gray-400">Submitted Date:</span>
                        <p className="text-gray-300">
                          {formatDateTime(user.submittedAt)}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Registration Complete:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.registrationCompleted ? 'bg-green-900/20 text-green-300' : 'bg-yellow-900/20 text-yellow-300'
                      }`}>
                        {user.registrationCompleted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {user.registrationCompleted ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Email Verification:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.emailVerified ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                      }`}>
                        {user.emailVerified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.status === 'approved' ? 'bg-green-900/20 text-green-300' :
                        user.status === 'rejected' ? 'bg-red-900/20 text-red-300' :
                        'bg-yellow-900/20 text-yellow-300'
                      }`}>
                        {user.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {user.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {(!user.status || user.status === 'pending') && <Clock className="w-3 h-3 mr-1" />}
                        {user.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Information
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Primary Email:</span>
                      <p className="text-gray-300 font-medium">{user.email}</p>
                    </div>
                    {user.alternateEmail && (
                      <div>
                        <span className="text-gray-400">Alternate Email:</span>
                        <p className="text-gray-300">{user.alternateEmail}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Primary Phone:</span>
                      <p className="text-gray-300">{user.phoneNumber || 'Not provided'}</p>
                    </div>
                    {user.alternatePhone && (
                      <div>
                        <span className="text-gray-400">Alternate Phone:</span>
                        <p className="text-gray-300">{user.alternatePhone}</p>
                      </div>
                    )}
                    {user.emergencyContactPhone && (
                      <div>
                        <span className="text-gray-400">Emergency Contact:</span>
                        <p className="text-gray-300">{user.emergencyContactPhone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address Information
                  </h5>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-gray-400 font-medium">Present Address:</span>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-300">{user.presentStreet || 'Not provided'}</p>
                        <p className="text-gray-300">{user.presentBarangay || 'Not provided'}</p>
                        <p className="text-gray-300">{user.presentCity || 'Not provided'}</p>
                        <p className="text-gray-300">{user.presentRegion || 'Not provided'}</p>
                      </div>
                    </div>
                    {(user.permanentStreet || user.permanentBarangay || user.permanentCity || user.permanentRegion) && (
                      <div>
                        <span className="text-gray-400 font-medium">Permanent Address:</span>
                        <div className="mt-1 space-y-1">
                          <p className="text-gray-300">{user.permanentStreet || 'Same as present'}</p>
                          <p className="text-gray-300">{user.permanentBarangay || 'Same as present'}</p>
                          <p className="text-gray-300">{user.permanentCity || 'Same as present'}</p>
                          <p className="text-gray-300">{user.permanentRegion || 'Same as present'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Employment Information
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Employment Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.isEmployed ? 'bg-green-900/20 text-green-300' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {user.isEmployed ? 'Employed' : 'Unemployed'}
                      </span>
                    </div>
                    {user.isEmployed && (
                      <>
                        <div>
                          <span className="text-gray-400">Employment Type:</span>
                          <p className="text-gray-300">{user.employmentType || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Position:</span>
                          <p className="text-gray-300">{user.position || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Company:</span>
                          <p className="text-gray-300">{user.companyName || 'Not provided'}</p>
                        </div>
                      </>
                    )}
                    {user.monthlyIncome && (
                      <div>
                        <span className="text-gray-400">Monthly Income:</span>
                        <p className="text-gray-300">{user.monthlyIncome}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Educational Background
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Educational Attainment:</span>
                      <p className="text-gray-300">{user.educationalAttainment || 'Not provided'}</p>
                    </div>
                    {user.skillsKnown && (
                      <div>
                        <span className="text-gray-400">Skills & Knowledge:</span>
                        <p className="text-gray-300">{user.skillsKnown}</p>
                      </div>
                    )}
                    {user.trainingAttended && (
                      <div>
                        <span className="text-gray-400">Training Attended:</span>
                        <p className="text-gray-300">{user.trainingAttended}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Uploaded Documents
                  </h5>
                  
                  {user.documentInfo ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-4 bg-gray-600/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.documentInfo.fileName}</p>
                            <p className="text-sm text-gray-400">
                              Uploaded: {user.documentInfo.uploadedAt ? formatDateTime(user.documentInfo.uploadedAt) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {documentLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (userDocument && userDocument.blobUrl) {
                                  window.open(userDocument.blobUrl, '_blank');
                                }
                              }}
                              disabled={!userDocument}
                              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {userDocument && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Document Preview:</p>
                          <div className="border border-gray-600 rounded-lg p-2 bg-gray-600/30">
                            {userDocument.mimeType?.startsWith('image/') ? (
                              <div className="max-w-full max-h-64 mx-auto rounded overflow-hidden">
                                <img 
                                  src={userDocument.blobUrl} 
                                  alt="Uploaded document" 
                                  className="w-full h-auto object-contain"
                                  style={{maxHeight: '256px'}}
                                />
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-400">PDF Document</p>
                                <p className="text-sm text-gray-500">{user.documentInfo.fileName}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">No documents uploaded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'programs' && (
            <div className="space-y-6">
              <Card className="bg-gray-700/50">
                <CardContent className="p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <Users2 className="w-4 h-4 mr-2" />
                    Program Interests & Benefits
                  </h5>
                  
                  <div className="space-y-4">
                    {/* PWD Information */}
                    {(user.isPWD !== undefined || user.pwdIdNumber) && (
                      <div className="p-4 bg-gray-600/50 rounded-lg">
                        <h6 className="font-medium text-white mb-2">PWD Information</h6>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">PWD Status:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              user.isPWD ? 'bg-blue-900/20 text-blue-300' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {user.isPWD ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {user.isPWD && user.pwdIdNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">PWD ID Number:</span>
                              <span className="text-gray-300">{user.pwdIdNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Senior Citizen Information */}
                    {(user.isSeniorCitizen !== undefined || user.seniorCitizenIdNumber) && (
                      <div className="p-4 bg-gray-600/50 rounded-lg">
                        <h6 className="font-medium text-white mb-2">Senior Citizen Information</h6>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Senior Citizen:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              user.isSeniorCitizen ? 'bg-purple-900/20 text-purple-300' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {user.isSeniorCitizen ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {user.isSeniorCitizen && user.seniorCitizenIdNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Senior ID Number:</span>
                              <span className="text-gray-300">{user.seniorCitizenIdNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Government Benefits */}
                    <div className="p-4 bg-gray-600/50 rounded-lg">
                      <h6 className="font-medium text-white mb-2">Government Benefits</h6>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          { key: 'has4Ps', label: '4Ps Program' },
                          { key: 'hasSSSPension', label: 'SSS Pension' },
                          { key: 'hasGSISPension', label: 'GSIS Pension' },
                          { key: 'hasSocialPension', label: 'Social Pension' }
                        ].map(benefit => (
                          <div key={benefit.key} className="flex items-center justify-between">
                            <span className="text-gray-400">{benefit.label}:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              user[benefit.key] ? 'bg-green-900/20 text-green-300' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {user[benefit.key] ? 'Yes' : 'No'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* E-Wallet Information */}
                    {(user.gcashNumber || user.paymayaNumber) && (
                      <div className="p-4 bg-gray-600/50 rounded-lg">
                        <h6 className="font-medium text-white mb-2">E-Wallet Information</h6>
                        <div className="space-y-2 text-sm">
                          {user.gcashNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">GCash Number:</span>
                              <span className="text-gray-300">{user.gcashNumber}</span>
                            </div>
                          )}
                          {user.paymayaNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">PayMaya Number:</span>
                              <span className="text-gray-300">{user.paymayaNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            {user.status !== 'approved' && (
              <Button 
                onClick={() => onApprove('approved', 'Approved via user details modal')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve User
              </Button>
            )}
            {user.status !== 'rejected' && (
              <Button 
                onClick={() => onApprove('rejected', 'Rejected via user details modal')}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject User
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Approval Modal Component
function ApprovalModal({ user, action, note, onNoteChange, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full mr-3 ${
            action === 'approved' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {action === 'approved' ? 
              <CheckCircle className="w-6 h-6 text-white" /> : 
              <XCircle className="w-6 h-6 text-white" />
            }
          </div>
          <h3 className="text-lg font-semibold text-white">
            {action === 'approved' ? 'Approve' : 'Reject'} User
          </h3>
        </div>

        <p className="text-gray-300 mb-4">
          Are you sure you want to {action === 'approved' ? 'approve' : 'reject'}{' '}
          <span className="font-medium">{user.firstName} {user.lastName}</span>?
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {action === 'approved' ? 'Approval' : 'Rejection'} Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Add a note about this ${action}...`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className={action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {action === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Duplicate Resolution Modal Component
function DuplicateResolutionModal({ duplicate, action, note, onNoteChange, onConfirm, onClose }) {
  const getActionConfig = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Registration',
          description: 'Mark this registration as legitimate and approve it',
          buttonText: 'Approve',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          icon: <CheckCircle className="w-6 h-6 text-white" />
        };
      case 'reject':
        return {
          title: 'Reject Registration',
          description: 'Mark this registration as duplicate and reject it',
          buttonText: 'Reject',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          icon: <XCircle className="w-6 h-6 text-white" />
        };
      case 'pending':
        return {
          title: 'Move to Pending Review',
          description: 'Remove duplicate flag and move to regular pending review',
          buttonText: 'Move to Pending',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
          icon: <Clock className="w-6 h-6 text-white" />
        };
      default:
        return {};
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full mr-3 ${config.buttonClass.split(' ')[0]}`}>
            {config.icon}
          </div>
          <h3 className="text-lg font-semibold text-white">
            {config.title}
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            {config.description} for{' '}
            <span className="font-medium">{duplicate.firstName} {duplicate.lastName}</span>?
          </p>
          
          <div className="bg-gray-700/50 p-3 rounded-lg text-sm">
            <p><span className="text-gray-400">Email:</span> {duplicate.email}</p>
            <p><span className="text-gray-400">Phone:</span> {duplicate.phoneNumber}</p>
            <p><span className="text-gray-400">CID:</span> {duplicate.cid}</p>
            <div className="mt-2">
              <span className="text-gray-400">Flagged for:</span>
              <div className="mt-1">
                {duplicate.duplicateReasons?.map((reason, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-yellow-900/30 text-yellow-300 text-xs px-2 py-1 rounded mr-1 mb-1"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Resolution Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Add a note about this resolution...`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className={config.buttonClass}
          >
            {config.buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
