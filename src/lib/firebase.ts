import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Thay thế bằng config Firebase của bạn
  apiKey: "AIzaSyAHAOyPJ4is6uauz4e2-IP0n_3X9woWqoM",
  authDomain: "learnproject-507da.firebaseapp.com",
  projectId: "learnproject-507da",
  storageBucket: "learnproject-507da.firebasestorage.app",
  messagingSenderId: "267265385958",
  appId: "1:267265385958:web:4e97a946726387e0fe6227"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

console.log('Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});
console.log('Auth instance:', auth);
console.log('Firestore instance:', db);
