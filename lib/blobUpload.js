// Vercel Blob document upload utility
export async function uploadDocumentToBlob(file, userId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      type: result.type,
      uploadedAt: result.uploadedAt
    };

  } catch (error) {
    console.error('Document upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed. Please try again.'
    };
  }
}

// Helper function to validate file before upload
export function validateDocumentFile(file) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  const errors = [];

  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
  }

  if (file.size > maxSize) {
    errors.push('File too large. Maximum size is 10MB.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to format file size for display
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
