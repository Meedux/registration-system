import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6GB91rIBhljbwJcP4A6OwLGnyDEwtt_U",
  authDomain: "commonwealthregistrationsystem.firebaseapp.com",
  projectId: "commonwealthregistrationsystem",
  storageBucket: "commonwealthregistrationsystem.firebasestorage.app",
  messagingSenderId: "664160443548",
  appId: "1:664160443548:web:ef381ea360ec2b97a42159",
  measurementId: "G-KB3SWV6D4Y"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);


export default app;
