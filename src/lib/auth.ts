import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { User, Gender } from '@/types';

// Đăng ký bằng email và password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  name: string, 
  avatar?: string,
  phone?: string,
  dateOfBirth?: Date,
  gender?: Gender
) => {
  try {
    console.log('Starting signUpWithEmail...', { email, name });
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('Firebase user created:', firebaseUser.uid);
    
    // Tạo user document trong Firestore
    const userData: User = {
      id: firebaseUser.uid,
      name,
      email,
      avatar: avatar || '', // Avatar mặc định rỗng nếu không có
      password: '', // Không lưu password trong Firestore
      role: 'USER',
      phone,
      dateOfBirth,
      gender,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    console.log('Saving user data to Firestore:', userData);
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    console.log('User data saved successfully');
    return { user: firebaseUser, userData };
  } catch (error: unknown) {
    console.error('Error in signUpWithEmail:', error);
    throw new Error(error instanceof Error ? error.message : 'Registration failed');
  }
};

// Đăng nhập bằng email và password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Starting signInWithEmail...', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('User signed in:', firebaseUser.uid);
    
    // Kiểm tra xem user đã tồn tại trong Firestore chưa
    console.log('Checking if user exists in Firestore...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('User does not exist in Firestore, creating user document...');
      // Tạo user document nếu chưa tồn tại
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || '',
        role: 'USER' as const,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      console.log('Saving user data to Firestore:', userData);
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('User data saved successfully');
    } else {
      // Cập nhật lastLogin
      console.log('User exists, updating lastLogin...');
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date()
      }, { merge: true });
      console.log('LastLogin updated successfully');
    }
    
    return firebaseUser;
  } catch (error: any) {
    console.error('Error in signInWithEmail:', error);
    throw new Error(error.message);
  }
};

// Đăng nhập bằng Google
export const signInWithGoogle = async () => {
  try {
    console.log('Starting signInWithGoogle...');
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    console.log('Google sign in successful:', firebaseUser.uid);
    
    // Kiểm tra xem user đã tồn tại chưa
    console.log('Checking if user exists in Firestore...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('User does not exist, creating new user...');
      // Tạo user mới nếu chưa tồn tại
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || '', // Lấy avatar từ Google
        role: 'USER' as const,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      console.log('Saving new user data:', userData);
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('New user saved successfully');
    } else {
      console.log('User exists, updating lastLogin...');
      // Cập nhật lastLogin
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date()
      }, { merge: true });
      console.log('LastLogin updated successfully');
    }
    
    return firebaseUser;
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error);
    throw new Error(error.message);
  }
};

// Đăng xuất
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Tìm kiếm user theo keyword trong name, email, hoặc phone
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    if (!searchTerm.trim()) return [];
    
    const usersRef = collection(db, 'users');
    const searchTermLower = searchTerm.toLowerCase();
    
    // Lấy tất cả users và filter trên client để tìm kiếm linh hoạt hơn
    const snapshot = await getDocs(usersRef);
    const users: User[] = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data() as User;
      const nameMatches = userData.name?.toLowerCase().includes(searchTermLower);
      const emailMatches = userData.email?.toLowerCase().includes(searchTermLower);
      const phoneMatches = userData.phone?.toLowerCase().includes(searchTermLower);
      
      if (nameMatches || emailMatches || phoneMatches) {
        users.push(userData);
      }
    });
    
    // Sắp xếp theo độ khớp: name match trước, phone match, sau đó email match
    users.sort((a, b) => {
      const aNameMatch = a.name?.toLowerCase().includes(searchTermLower);
      const bNameMatch = b.name?.toLowerCase().includes(searchTermLower);
      const aPhoneMatch = a.phone?.toLowerCase().includes(searchTermLower);
      const bPhoneMatch = b.phone?.toLowerCase().includes(searchTermLower);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      if (aPhoneMatch && !bPhoneMatch) return -1;
      if (!aPhoneMatch && bPhoneMatch) return 1;
      return 0;
    });
    
    return users.slice(0, 10); // Giới hạn 10 kết quả
  } catch (error: any) {
    console.error('Error searching users:', error);
    throw new Error(error.message);
  }
};

// Lấy thông tin user theo ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Cập nhật thông tin user
export const updateUserProfile = async (userId: string, updateData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Chỉ cập nhật các field được phép thay đổi
    const allowedFields = ['name', 'avatar', 'phone', 'dateOfBirth', 'gender'];
    const filteredData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key as keyof User] !== undefined) {
        filteredData[key] = updateData[key as keyof User];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new Error('Không có dữ liệu để cập nhật');
    }
    
    await setDoc(userRef, filteredData, { merge: true });
    return true;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message);
  }
};
