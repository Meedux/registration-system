import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload
} from 'firebase/auth';

// Enhanced email verification functions
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      return { success: true, message: 'Verification email sent successfully' };
    } else if (user?.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    } else {
      return { success: false, error: 'No user logged in' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkEmailVerificationStatus = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await reload(user); // Refresh user data
      return { success: true, emailVerified: user.emailVerified };
    }
    return { success: false, error: 'No user logged in' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Enhanced login with verification check
export const loginUserWithVerificationCheck = async (email, password, requireVerification = true) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (requireVerification && !user.emailVerified) {
      // Allow login but flag as unverified
      return { 
        success: true, 
        user, 
        emailVerified: false,
        message: 'Please verify your email before proceeding' 
      };
    }
    
    return { success: true, user, emailVerified: user.emailVerified };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
