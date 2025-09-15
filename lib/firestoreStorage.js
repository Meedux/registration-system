import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Convert file to Base64 string
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Validate file before upload
export const validateDocumentFile = (file) => {
  const maxSize = 1 * 1024 * 1024; // 1MB limit
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 1MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and PDF files are allowed' };
  }
  
  return { valid: true };
};

// Store document in Firestore as Base64
export const uploadDocumentToFirestore = async (file, userId, documentType = 'id') => {
  try {
    // Validate file first
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Convert file to Base64
    const base64Data = await fileToBase64(file);
    
    // Create document record
    const documentData = {
      userId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      base64Data: base64Data,
      uploadedAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Save to Firestore documents collection
    const docRef = await addDoc(collection(db, 'documents'), documentData);
    
    return { 
      success: true, 
      documentId: docRef.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error('Error uploading document to Firestore:', error);
    return { success: false, error: error.message };
  }
};

// Get document from Firestore
export const getDocumentFromFirestore = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Convert Base64 back to blob URL for viewing
      const blobUrl = `data:${data.mimeType};base64,${data.base64Data}`;
      
      return {
        success: true,
        document: {
          ...data,
          id: docSnap.id,
          blobUrl: blobUrl
        }
      };
    } else {
      return { success: false, error: 'Document not found' };
    }
  } catch (error) {
    console.error('Error getting document from Firestore:', error);
    return { success: false, error: error.message };
  }
};

// Get all documents for a user
export const getUserDocuments = async (userId) => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        ...data,
        id: doc.id,
        // Don't include base64Data in list view to save memory
        blobUrl: `data:${data.mimeType};base64,${data.base64Data}`
      });
    });
    
    return { success: true, documents };
  } catch (error) {
    console.error('Error getting user documents:', error);
    return { success: false, error: error.message };
  }
};

// Delete document from Firestore
export const deleteDocumentFromFirestore = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

// Create download link for document
export const createDocumentDownloadLink = (base64Data, mimeType, fileName) => {
  try {
    // Convert Base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating download link:', error);
    return { success: false, error: error.message };
  }
};
