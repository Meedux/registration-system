import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { uploadDocumentToFirestore, getDocumentFromFirestore } from './firestoreStorage';

// Auth functions
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Update user profile
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    
    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      role: 'user'
    });
    
    // Sign out the user immediately after registration
    // They need to manually login and verify their email
    await signOut(auth);
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      // Sign out the user immediately
      await signOut(auth);
      return { 
        success: false, 
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        needsVerification: true
      };
    }
    
    // Update user's verification status in Firestore if they've verified since registration
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update emailVerified status if it's different
        if (userData.emailVerified !== user.emailVerified) {
          await updateDoc(userDocRef, {
            emailVerified: user.emailVerified,
            lastLoginAt: serverTimestamp()
          });
        }
      }
    } catch (dbError) {
      console.log('Error updating user verification status:', dbError);
      // Continue with login even if DB update fails
    }
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resendVerificationEmail = async (email, password) => {
  try {
    // Sign in temporarily to resend verification
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (user.emailVerified) {
      await signOut(auth);
      return { success: false, error: 'Email is already verified. You can now login normally.' };
    }
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Sign out immediately
    await signOut(auth);
    
    return { success: true, message: 'Verification email sent successfully. Please check your inbox.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Document upload function using Firestore
export const uploadDocument = async (file, userId, documentType = 'id') => {
  try {
    const result = await uploadDocumentToFirestore(file, userId, documentType);
    
    if (result.success) {
      return { 
        success: true, 
        documentId: result.documentId,
        fileName: result.fileName,
        downloadURL: result.documentId // Use document ID as reference
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if user has already submitted registration
export const getUserRegistrationStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        success: true,
        hasRegistration: userData.registrationCompleted || false,
        status: userData.status || 'pending',
        cid: userData.cid || null,
        submittedAt: userData.submittedAt || null,
        applicationReferenceNumber: userData.applicationReferenceNumber || null
      };
    } else {
      return {
        success: true,
        hasRegistration: false,
        status: null,
        cid: null,
        submittedAt: null,
        applicationReferenceNumber: null
      };
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
    return {
      success: false,
      error: error.message,
      hasRegistration: false
    };
  }
};

// Generate Community ID (CID) function
export const generateCommunityId = async (zipCode, address) => {
  try {
    // Get next address ID for the zipcode
    const addressesRef = collection(db, 'addresses');
    const addressQuery = query(addressesRef, where('zipCode', '==', zipCode));
    const addressSnapshot = await getDocs(addressQuery);
    
    const nextAddressId = String(addressSnapshot.size + 1).padStart(5, '0');
    
    // Get next household ID for this address
    const householdsRef = collection(db, 'households');
    const householdQuery = query(
      householdsRef, 
      where('zipCode', '==', zipCode),
      where('addressId', '==', nextAddressId)
    );
    const householdSnapshot = await getDocs(householdQuery);
    
    const nextHouseholdId = String(householdSnapshot.size + 1).padStart(2, '0');
    
    // Get next individual ID for this household
    const usersRef = collection(db, 'users');
    const userQuery = query(
      usersRef, 
      where('cid', '>=', `${zipCode}-${nextAddressId}-${nextHouseholdId}-`),
      where('cid', '<', `${zipCode}-${nextAddressId}-${nextHouseholdId}-99`)
    );
    const userSnapshot = await getDocs(userQuery);
    
    const nextIndividualId = String(userSnapshot.size + 1).padStart(2, '0');
    
    return `${zipCode}-${nextAddressId}-${nextHouseholdId}-${nextIndividualId}`;
  } catch (error) {
    console.error('Error generating CID:', error);
    return null;
  }
};

// Check for duplicate entries
export const checkDuplicateEntry = async (userData) => {
  try {
    const usersRef = collection(db, 'users');
    const duplicateChecks = [];
    
    // Same address, same DOB
    const sameAddressDOB = query(
      usersRef,
      where('presentStreet', '==', userData.presentStreet),
      where('presentBarangay', '==', userData.presentBarangay),
      where('birthDate', '==', userData.birthDate)
    );
    duplicateChecks.push(getDocs(sameAddressDOB));
    
    // Same address, same email, same DOB
    const sameAddressEmailDOB = query(
      usersRef,
      where('presentStreet', '==', userData.presentStreet),
      where('email', '==', userData.email),
      where('birthDate', '==', userData.birthDate)
    );
    duplicateChecks.push(getDocs(sameAddressEmailDOB));
    
    // Different address, Same DOB, Same last name
    const sameDOBLastName = query(
      usersRef,
      where('birthDate', '==', userData.birthDate),
      where('lastName', '==', userData.lastName)
    );
    duplicateChecks.push(getDocs(sameDOBLastName));
    
    // Different address, Same DOB, same email
    const sameDOBEmail = query(
      usersRef,
      where('birthDate', '==', userData.birthDate),
      where('email', '==', userData.email)
    );
    duplicateChecks.push(getDocs(sameDOBEmail));
    
    const results = await Promise.all(duplicateChecks);
    const potentialDuplicates = [];
    
    results.forEach((snapshot, index) => {
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          potentialDuplicates.push({
            id: doc.id,
            data,
            reason: [
              'Same address and birth date',
              'Same address, email, and birth date',
              'Same birth date and last name',
              'Same birth date and email'
            ][index]
          });
        });
      }
    });
    
    return potentialDuplicates;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return [];
  }
};

// Helper function to remove undefined values from objects
const cleanUndefinedFields = (obj) => {
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// Firestore functions
export const saveUserRegistration = async (userId, registrationData, documentFile = null) => {
  try {
   
    
    // Check for duplicate entries and flag them
    const duplicates = await checkDuplicateEntry(registrationData);
    const isDuplicateFlag = duplicates.length > 0;
    
    // Upload document if provided
    let documentId = null;
    let documentFileName = null;
    
    if (documentFile) {
      const uploadResult = await uploadDocument(documentFile, userId);
      if (uploadResult.success) {
        documentId = uploadResult.documentId;
        documentFileName = uploadResult.fileName;
      } else {
        return { success: false, error: 'Failed to upload document' };
      }
    }
    
    // Generate Community ID
    const zipCode = registrationData.presentCity === 'Quezon City' && 
                   registrationData.presentBarangay === 'Commonwealth' ? '1121' : '0000';
    
    const cid = await generateCommunityId(zipCode, registrationData.presentStreet);
    
    if (!cid) {
      return { success: false, error: 'Failed to generate Community ID' };
    }
    
    // Prepare comprehensive registration data
    const now = new Date();
    const completeRegistrationData = {
      ...registrationData,
      cid,
      documentId,
      documentFileName,
      registrationCompleted: true,
      registrationCompletedAt: serverTimestamp(),
      status: isDuplicateFlag ? 'Flagged - Duplicate' : 'Pending Review',
      isDuplicateFlag,
      duplicateReasons: duplicates.map(d => d.reason),
      potentialDuplicates: duplicates.map(d => ({ id: d.id, reason: d.reason })),
      statusHistory: [{
        status: isDuplicateFlag ? 'Flagged - Duplicate' : 'Pending Review',
        timestamp: now.toISOString(), // Use ISO string instead of serverTimestamp()
        note: isDuplicateFlag ? `Registration flagged as potential duplicate: ${duplicates.map(d => d.reason).join(', ')}` : 'Registration submitted'
      }],
      // Calculate age
      age: registrationData.birthDate ? 
        Math.floor((Date.now() - new Date(registrationData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0
    };
    
    // Use batch write for atomic updates
    const batch = writeBatch(db);
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    const cleanUserData = cleanUndefinedFields(completeRegistrationData);
    batch.update(userRef, cleanUserData);
    
    // Create address record if new
    const addressRef = doc(db, 'addresses', `${zipCode}-${cid.split('-')[1]}`);
    const addressData = cleanUndefinedFields({
      zipCode,
      addressId: cid.split('-')[1],
      street: registrationData.presentStreet,
      barangay: registrationData.presentBarangay,
      city: registrationData.presentCity,
      region: registrationData.presentRegion,
      createdAt: serverTimestamp()
    });
    batch.set(addressRef, addressData, { merge: true });
    
    // Create household record
    const householdRef = doc(db, 'households', `${zipCode}-${cid.split('-')[1]}-${cid.split('-')[2]}`);
    const householdData = cleanUndefinedFields({
      zipCode,
      addressId: cid.split('-')[1],
      householdId: cid.split('-')[2],
      headOfFamily: `${registrationData.firstName} ${registrationData.lastName}`,
      createdAt: serverTimestamp()
    });
    batch.set(householdRef, householdData, { merge: true });
    
    // Commit the batch
    await batch.commit();
    
    return { success: true, cid };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const savePrivacyConsent = async (userId, consentData) => {
  try {
    await setDoc(doc(db, 'privacyConsents', userId), {
      userId,
      ...consentData,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const saveSurveyResponse = async (userId, surveyData) => {
  try {
    await addDoc(collection(db, 'surveyResponses'), {
      userId,
      ...surveyData,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSurveyResponses = async () => {
  try {
    const responsesCollection = collection(db, 'surveyResponses');
    const responsesSnapshot = await getDocs(responsesCollection);
    const responses = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, responses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Admin Functions for Review System
export const updateUserStatus = async (userId, newStatus, note = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const currentData = userDoc.data();
    const statusHistory = currentData.statusHistory || [];
    
    // Add new status to history
    statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp()
      note: note || `Status changed to ${newStatus}`,
      updatedBy: auth.currentUser?.email || 'system'
    });
    
    await updateDoc(userRef, {
      status: newStatus,
      statusHistory,
      lastStatusUpdate: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendNotificationEmail = async (userEmail, status, cid, note = '') => {
  try {
    // This would typically integrate with a cloud function or email service
    // For now, we'll just log the email content
    const emailContent = {
      to: userEmail,
      subject: `Registration Status Update - CID: ${cid}`,
      body: `
        Dear Resident,
        
        Your registration status has been updated to: ${status}
        Community ID: ${cid}
        
        ${note ? `Note: ${note}` : ''}
        
        ${status === 'Approved' ? 
          'Congratulations! Your registration has been approved. You can now access all community services.' :
          status === 'Declined' ?
          'Unfortunately, your registration has been declined. Please contact the admin for more information.' :
          'Your registration is currently under review. We will notify you once the review is complete.'
        }
        
        Best regards,
        Commonwealth Registration System
      `
    };
    
    console.log('Email notification:', emailContent);
    
    // In a real implementation, you would send this via a cloud function
    // For now, we'll just store it in a notifications collection
    await addDoc(collection(db, 'notifications'), {
      ...emailContent,
      sent: false,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, updatedData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const currentDoc = await getDoc(userRef);
    
    if (!currentDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const currentData = currentDoc.data();
    
    // Store data history for audit trail
    const dataHistory = currentData.dataHistory || [];
    dataHistory.push({
      previousData: currentData,
      updatedAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp()
      updatedBy: auth.currentUser?.email || 'system'
    });
    
    await updateDoc(userRef, {
      ...updatedData,
      dataHistory,
      lastUpdated: serverTimestamp(),
      // Reset status to "In Review" when data is edited
      status: 'In Review',
      statusHistory: [
        ...(currentData.statusHistory || []),
        {
          status: 'In Review',
          timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp()
          note: 'Data updated - requires re-review',
          updatedBy: auth.currentUser?.email || 'system'
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteUserRegistration = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    
    // Delete associated document from Firestore if exists
    if (userData.documentId) {
      try {
        const { deleteDocumentFromFirestore } = await import('./firestoreStorage');
        await deleteDocumentFromFirestore(userData.documentId);
      } catch (error) {
        console.warn('Could not delete document from Firestore:', error);
      }
    }
    
    // Store deletion record for audit
    await addDoc(collection(db, 'deletedUsers'), {
      ...userData,
      deletedAt: serverTimestamp(),
      deletedBy: auth.currentUser?.email || 'system'
    });
    
    // Delete the user document
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: auth.currentUser?.email || 'system'
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get users with enhanced filtering for admin
export const getAdminUsers = async (filters = {}) => {
  try {
    const usersCollection = collection(db, 'users');
    let usersQuery = query(usersCollection);
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      usersQuery = query(usersQuery, where('status', '==', filters.status));
    }
    
    if (filters.registrationCompleted !== undefined) {
      usersQuery = query(usersQuery, where('registrationCompleted', '==', filters.registrationCompleted));
    }
    
    // Order by creation date (newest first)
    usersQuery = query(usersQuery, orderBy('createdAt', 'desc'));
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => !user.deleted); // Exclude deleted users
    
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ======== MEMBER DASHBOARD FUNCTIONS ========
export const saveBenefitApplication = async (applicationData) => {
  try {
    const benefitApplicationRef = collection(db, 'benefitApplications');
    await addDoc(benefitApplicationRef, applicationData);
    return { success: true };
  } catch (error) {
    console.error('Error saving benefit application:', error);
    return { success: false, error: error.message };
  }
};

export const saveContactQuery = async (queryData) => {
  try {
    const contactQueryRef = collection(db, 'contactQueries');
    await addDoc(contactQueryRef, queryData);
    return { success: true };
  } catch (error) {
    console.error('Error saving contact query:', error);
    return { success: false, error: error.message };
  }
};

// Get all flagged duplicate registrations for admin review
export const getFlaggedDuplicates = async () => {
  try {
    const usersRef = collection(db, 'users');
    const flaggedQuery = query(
      usersRef,
      where('isDuplicateFlag', '==', true),
      orderBy('registrationCompletedAt', 'desc')
    );
    
    const snapshot = await getDocs(flaggedQuery);
    const flaggedUsers = [];
    
    snapshot.forEach((doc) => {
      flaggedUsers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return flaggedUsers;
  } catch (error) {
    console.error('Error getting flagged duplicates:', error);
    return [];
  }
};

// Resolve duplicate flag (mark as reviewed)
export const resolveDuplicateFlag = async (userId, action, adminNote = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    const now = new Date();
    
    let newStatus;
    let note;
    
    switch (action) {
      case 'approve':
        newStatus = 'Approved';
        note = `Duplicate flag resolved - Approved by admin: ${adminNote}`;
        break;
      case 'reject':
        newStatus = 'Rejected';
        note = `Duplicate flag resolved - Rejected by admin: ${adminNote}`;
        break;
      case 'pending':
        newStatus = 'Pending Review';
        note = `Duplicate flag resolved - Moved to pending review: ${adminNote}`;
        break;
      default:
        throw new Error('Invalid action');
    }
    
    await updateDoc(userRef, {
      isDuplicateFlag: false,
      duplicateFlagResolvedAt: serverTimestamp(),
      status: newStatus,
      statusHistory: arrayUnion({
        status: newStatus,
        timestamp: now.toISOString(),
        note,
        resolvedDuplicateFlag: true
      })
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error resolving duplicate flag:', error);
    return { success: false, error: error.message };
  }
};

// Get duplicate statistics for admin dashboard
export const getDuplicateStatistics = async () => {
  try {
    const usersRef = collection(db, 'users');
    
    // Count total flagged duplicates
    const flaggedQuery = query(usersRef, where('isDuplicateFlag', '==', true));
    const flaggedSnapshot = await getDocs(flaggedQuery);
    
    // Count resolved duplicates
    const resolvedQuery = query(usersRef, where('duplicateFlagResolvedAt', '!=', null));
    const resolvedSnapshot = await getDocs(resolvedQuery);
    
    return {
      totalFlagged: flaggedSnapshot.size,
      totalResolved: resolvedSnapshot.size,
      pendingReview: flaggedSnapshot.size
    };
  } catch (error) {
    console.error('Error getting duplicate statistics:', error);
    return {
      totalFlagged: 0,
      totalResolved: 0,
      pendingReview: 0
    };
  }
};
