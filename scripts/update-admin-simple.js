const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Sử dụng cùng Firebase config như trong ứng dụng
const firebaseConfig = {
  apiKey: "AIzaSyAHAOyPJ4is6uauz4e2-IP0n_3X9woWqoM",
  authDomain: "learnproject-507da.firebaseapp.com",
  projectId: "learnproject-507da",
  storageBucket: "learnproject-507da.firebasestorage.app",
  messagingSenderId: "267265385958",
  appId: "1:267265385958:web:4e97a946726387e0fe6227"
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
      console.log('💡 Bạn cần tạo tài khoản này trước bằng cách:');
      console.log('   1. Mở ứng dụng và đăng ký với email: admin@gmail.com');
      console.log('   2. Sau khi đăng ký thành công, chạy lại script này');
      console.log('📋 Lệnh: npm run update-admin');
      return;
    }
    
    // Cập nhật role thành ADMIN
    let updatedCount = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data();
      console.log(`📝 Tìm thấy tài khoản: ${userData.name} (${userData.email})`);
      console.log(`🔄 Role hiện tại: ${userData.role || 'USER'}`);
      
      if (userData.role === 'ADMIN') {
        console.log('ℹ️  Tài khoản này đã là ADMIN rồi!');
        continue;
      }
      
      await updateDoc(doc(db, 'users', docSnap.id), {
        role: 'ADMIN'
      });
      
      updatedCount++;
      console.log('✅ Đã cập nhật role thành ADMIN thành công!');
    }
    
    if (updatedCount > 0) {
      console.log(`👤 Tài khoản admin@gmail.com hiện đã có quyền admin`);
      console.log('🚀 Bây giờ bạn có thể đăng nhập và truy cập /admin');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật role admin:', error);
    if (error.code === 'permission-denied') {
      console.log('🔒 Lỗi quyền truy cập. Kiểm tra Firestore rules của bạn.');
    }
  }
}

// Chạy script
console.log('🚀 Bắt đầu cập nhật quyền admin...');
updateAdminRole()
  .then(() => {
    console.log('🎉 Script hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script thất bại:', error);
    process.exit(1);
  });
