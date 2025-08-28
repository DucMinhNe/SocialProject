const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase configuration - you may need to update this with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from your Firebase console
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAdminRole() {
  try {
    console.log('🔍 Tìm kiếm tài khoản admin@gmail.com...');
    
    // Tìm user với email admin@gmail.com
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@gmail.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Không tìm thấy tài khoản admin@gmail.com');
      console.log('💡 Bạn cần tạo tài khoản này trước bằng cách đăng ký qua ứng dụng');
      return;
    }
    
    // Cập nhật role thành ADMIN
    querySnapshot.forEach(async (docSnap) => {
      const userData = docSnap.data();
      console.log(`📝 Tìm thấy tài khoản: ${userData.name} (${userData.email})`);
      console.log(`🔄 Role hiện tại: ${userData.role || 'USER'}`);
      
      await updateDoc(doc(db, 'users', docSnap.id), {
        role: 'ADMIN'
      });
      
      console.log('✅ Đã cập nhật role thành ADMIN thành công!');
      console.log(`👤 Tài khoản ${userData.email} hiện đã có quyền admin`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật role admin:', error);
  }
}

// Chạy script
updateAdminRole()
  .then(() => {
    console.log('🎉 Script hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script thất bại:', error);
    process.exit(1);
  });
