import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from './firebase';

// Utility function to manually assign admin role
export const assignAdminRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      roleAssignedAt: new Date().toISOString(),
      roleAssignedBy: 'system'
    });
    
    console.log(`Admin role assigned to user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error assigning admin role:', error);
    return { success: false, error: error.message };
  }
};

// Utility function to get user by email (for finding userId)
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        success: true,
        user: { id: userDoc.id, ...userDoc.data() }
      };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Complete function to make someone admin by email
export const makeAdminByEmail = async (email) => {
  try {
    // Find user by email
    const userResult = await findUserByEmail(email);
    if (!userResult.success) {
      return { success: false, error: 'User not found with that email' };
    }
    
    // Assign admin role
    const adminResult = await assignAdminRole(userResult.user.id);
    return adminResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create a new admin account directly
export const createAdminAccount = async (email, password, adminData) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: `${adminData.firstName} ${adminData.lastName}`
    });
    
    // Save admin user data to Firestore with admin role
    await setDoc(doc(db, 'users', user.uid), {
      ...adminData,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      role: 'admin', // Set as admin immediately
      createdAt: new Date().toISOString(),
      registrationCompleted: true, // Admin doesn't need to go through registration
      adminCreatedAt: new Date().toISOString(),
      adminCreatedBy: 'system'
    });
    
    console.log(`New admin account created: ${email}`);
    return { success: true, userId: user.uid };
  } catch (error) {
    console.error('Error creating admin account:', error);
    return { success: false, error: error.message };
  }
};
