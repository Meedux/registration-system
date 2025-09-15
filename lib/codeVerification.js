import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via email (you'll need to implement email service)
export const sendVerificationCode = async (email, userId) => {
  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store code in Firestore
    await addDoc(collection(db, 'verificationCodes'), {
      userId,
      email,
      code,
      expiresAt,
      used: false,
      createdAt: new Date()
    });
    
    // TODO: Send email with code using your preferred email service
    // For now, just log it (you'd replace this with actual email sending)
    console.log(`Verification code for ${email}: ${code}`);
    
    return { success: true, code }; // Remove code from return in production
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify the code
export const verifyCode = async (userId, inputCode) => {
  try {
    const q = query(
      collection(db, 'verificationCodes'),
      where('userId', '==', userId),
      where('code', '==', inputCode),
      where('used', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Invalid verification code' };
    }
    
    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();
    
    // Check expiration
    if (new Date() > codeData.expiresAt.toDate()) {
      // Delete expired code
      await deleteDoc(doc(db, 'verificationCodes', codeDoc.id));
      return { success: false, error: 'Verification code expired' };
    }
    
    // Mark as used
    await updateDoc(doc(db, 'verificationCodes', codeDoc.id), {
      used: true,
      usedAt: new Date()
    });
    
    // Update user as verified
    await updateDoc(doc(db, 'users', userId), {
      emailVerified: true,
      verifiedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
