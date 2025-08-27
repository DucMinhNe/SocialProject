import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Chat, User } from '@/types';

// Tạo hoặc lấy chat ID giữa 2 người
export const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Tạo chat mới giữa 2 người
export const createChat = async (userId1: string, userId2: string): Promise<string> => {
  try {
    const chatId = getChatId(userId1, userId2);
    
    // Kiểm tra xem chat đã tồn tại chưa
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (!chatDoc.exists()) {
      const chatData: Chat = {
        id: chatId,
        participants: [userId1, userId2],
        lastMessage: '',
        lastMessageTime: new Date()
      };
      
      await setDoc(doc(db, 'chats', chatId), chatData);
    }
    
    return chatId;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Gửi tin nhắn
export const sendMessage = async (
  senderId: string, 
  receiverId: string, 
  text: string
): Promise<void> => {
  try {
    const chatId = getChatId(senderId, receiverId);
    
    // Tạo chat nếu chưa tồn tại
    await createChat(senderId, receiverId);
    
    // Thêm message mới
    const messageData = {
      text,
      senderId,
      receiverId,
      chatId,
      timestamp: serverTimestamp(),
      status: 'sent' as const,
      readAt: null
    };
    
    await addDoc(collection(db, 'messages'), messageData);
    
    // Cập nhật chat với tin nhắn cuối cùng
    await setDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp()
    }, { merge: true });
    
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Lấy danh sách tin nhắn trong chat
export const getMessages = (
  chatId: string, 
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef, 
    where('chatId', '==', chatId), 
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        receiverId: data.receiverId,
        chatId: data.chatId,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status || 'sent',
        readAt: data.readAt?.toDate() || undefined
      });
    });
    callback(messages);
  });
};

// Lấy danh sách chat của user
export const getUserChats = (
  userId: string, 
  callback: (chats: (Chat & { otherUser: User })[] ) => void
) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef, 
    where('participants', 'array-contains', userId)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const chats: (Chat & { otherUser: User })[] = [];
    
    for (const docSnap of snapshot.docs) {
      const chatData = docSnap.data() as Chat;
      
      // Tìm user khác trong cuộc trò chuyện
      const otherUserId = chatData.participants.find(id => id !== userId);
      
      if (otherUserId) {
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        if (otherUserDoc.exists()) {
          const otherUser = otherUserDoc.data() as User;
          
          // Tính số tin nhắn chưa đọc
          const unreadCount = await getUnreadCount(chatData.id, userId);
          
          chats.push({
            ...chatData,
            lastMessageTime: (chatData.lastMessageTime as any)?.toDate?.() || new Date(),
            unreadCount,
            otherUser
          });
        }
      }
    }
    
    callback(chats);
  });
};

// Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (
  chatId: string, 
  userId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('status', '!=', 'read')
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(docRef => 
      updateDoc(docRef.ref, {
        status: 'read',
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
  }
};

// Cập nhật trạng thái tin nhắn thành delivered khi người nhận online
export const markMessagesAsDelivered = async (
  chatId: string, 
  userId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('status', '==', 'sent')
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(docRef => 
      updateDoc(docRef.ref, {
        status: 'delivered'
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error: any) {
    console.error('Error marking messages as delivered:', error);
  }
};

// Đếm số tin nhắn chưa đọc trong một chat
export const getUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('status', '!=', 'read')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
