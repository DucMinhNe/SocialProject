'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { getUserChats, getMessages, sendMessage, markMessagesAsRead, markMessagesAsDelivered, getUnreadCount } from '@/lib/chat';
import { searchUsers, signOut, getUserById } from '@/lib/auth';
import { Chat, User as UserType, Message } from '@/types';
import Profile from './Profile';
import MessageStatus from './MessageStatus';
import BlueTickBadge from './BlueTickBadge';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Highlight matching text
function highlightMatch(text: string, searchTerm: string) {
  if (!text || !searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [chats, setChats] = useState<(Chat & { otherUser: UserType })[]>([]);
  const [selectedChat, setSelectedChat] = useState<(Chat & { otherUser: UserType }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);
  
  // Ref để scroll xuống cuối messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Debounce search function
  const debounceSearch = useCallback(
    debounce(async (term: string) => {
      if (term.trim()) {
        setIsSearching(true);
        try {
          const results = await searchUsers(term);
          // Loại bỏ user hiện tại khỏi kết quả tìm kiếm
          const filteredResults = results.filter(u => u.id !== user.uid);
          setSearchResults(filteredResults);
          setShowSearch(true);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300), // Delay 300ms
    [user.uid]
  );

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Lấy danh sách chat của user
  useEffect(() => {
    const unsubscribe = getUserChats(user.uid, setChats);
    return () => unsubscribe();
  }, [user.uid]);

  // Lấy thông tin người dùng hiện tại để hiển thị blue tick
  useEffect(() => {
    const loadCurrentUserData = async () => {
      try {
        const userData = await getUserById(user.uid);
        if (userData) {
          setCurrentUserData(userData);
        }
      } catch (error) {
        console.error('Error loading current user data:', error);
      }
    };

    loadCurrentUserData();
  }, [user.uid]);

  // Lấy tin nhắn của chat được chọn
  useEffect(() => {
    if (selectedChat) {
      const unsubscribe = getMessages(selectedChat.id, setMessages);
      
      // Mark messages as delivered khi vào chat
      markMessagesAsDelivered(selectedChat.id, user.uid);
      
      return () => unsubscribe();
    }
  }, [selectedChat, user.uid]);

  // Mark messages as read khi user scroll to bottom hoặc có tin nhắn mới
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      // Đợi một chút để đảm bảo user đã xem tin nhắn
      const timer = setTimeout(async () => {
        await markMessagesAsRead(selectedChat.id, user.uid);
        // Refresh chat list để cập nhật unread count
        const updatedChats = await Promise.all(
          chats.map(async (chat) => {
            if (chat.id === selectedChat.id) {
              const unreadCount = await getUnreadCount(chat.id, user.uid);
              return { ...chat, unreadCount };
            }
            return chat;
          })
        );
        setChats(updatedChats);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedChat, messages, user.uid, chats]);

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tìm kiếm realtime khi user gõ
  useEffect(() => {
    debounceSearch(searchTerm);
  }, [searchTerm, debounceSearch]);

  // Xử lý thay đổi search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  // Bắt đầu chat với user mới
  const startChat = (otherUser: UserType) => {
    const existingChat = chats.find(chat => 
      chat.participants.includes(otherUser.id)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Tạo chat mới
      const newChat: Chat & { otherUser: UserType } = {
        id: [user.uid, otherUser.id].sort().join('_'),
        participants: [user.uid, otherUser.id],
        lastMessage: '',
        lastMessageTime: new Date(),
        otherUser
      };
      setSelectedChat(newChat);
    }
    
    // Ẩn kết quả tìm kiếm và clear search term
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      try {
        await sendMessage(user.uid, selectedChat.otherUser.id, newMessage.trim());
        setNewMessage('');
        // Focus lại vào input
        messageInputRef.current?.focus();
        // Scroll to bottom sẽ được trigger bởi useEffect khi messages update
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Danh sách chat */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white border-r border-gray-300 flex-col shadow-lg`}>
        {/* Mobile overlay */}
        {selectedChat && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSelectedChat(null)} />
        )}
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-400 flex items-center justify-center border-2 border-white">
                    <span className="text-white text-sm font-medium">
                      {(user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <h2 className="text-base md:text-lg font-semibold text-white">
                  {user.displayName || user.email}
                </h2>
                {/* Blue tick badge next to name */}
                {currentUserData?.blueTick?.status === 'VERIFIED' && (
                  <BlueTickBadge isVerified={true} size="sm" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setShowProfile(true)}
                className="text-blue-200 hover:text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="hidden md:inline">Hồ sơ</span>
                <span className="md:hidden">👤</span>
              </button>
              <button
                onClick={handleSignOut}
                className="text-blue-200 hover:text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="hidden md:inline">Đăng xuất</span>
                <span className="md:hidden">🚪</span>
              </button>
            </div>
          </div>
          
          {/* Thanh tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc tên..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {/* Kết quả tìm kiếm */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                {isSearching ? (
                  <div className="p-3 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Đang tìm kiếm...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      onClick={() => startChat(searchUser)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          {searchUser.avatar ? (
                            <img
                              src={searchUser.avatar}
                              alt={searchUser.name}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs md:text-sm font-medium">
                                {searchUser.name?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {highlightMatch(searchUser.name, searchTerm)}
                            </span>
                            {searchUser.blueTick?.status === 'VERIFIED' && (
                              <BlueTickBadge isVerified={true} size="sm" />
                            )}
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 truncate">
                            {highlightMatch(searchUser.email, searchTerm)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchTerm.trim() ? (
                  <div className="p-3 text-gray-500 text-center">
                    Không tìm thấy người dùng nào với "{searchTerm}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Danh sách chat */}
        <div className="flex-1 overflow-y-auto bg-white">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div>
                    {chat.otherUser.avatar ? (
                      <img
                        src={chat.otherUser.avatar}
                        alt={chat.otherUser.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {chat.otherUser.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-900 truncate text-sm md:text-base">
                          {chat.otherUser.name}
                        </span>
                        {chat.otherUser.blueTick?.status === 'VERIFIED' && (
                          <BlueTickBadge isVerified={true} size="md" />
                        )}
                      </div>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center ml-2">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 truncate">
                      {chat.lastMessage || 'Chưa có tin nhắn'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              Chưa có cuộc trò chuyện nào. Hãy tìm kiếm và bắt đầu chat!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden text-gray-600 hover:text-gray-800 p-1"
                  >
                    ←
                  </button>
                  <div>
                    {selectedChat.otherUser.avatar ? (
                      <img
                        src={selectedChat.otherUser.avatar}
                        alt={selectedChat.otherUser.name}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {selectedChat.otherUser.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {selectedChat.otherUser.name}
                      </h3>
                      {selectedChat.otherUser.blueTick?.status === 'VERIFIED' && (
                        <BlueTickBadge isVerified={true} size="sm" />
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">
                      {selectedChat.otherUser.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50"
            >
              {messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-1 md:space-x-2 ${
                        message.senderId === user.uid ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar cho tin nhắn người khác (bên trái) */}
                      {message.senderId !== user.uid && (
                        <div className="flex-shrink-0">
                          {selectedChat?.otherUser.avatar ? (
                            <img
                              src={selectedChat.otherUser.avatar}
                              alt={selectedChat.otherUser.name}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-400 flex items-center justify-center">
                              <span className="text-white text-xs md:text-sm font-medium">
                                {selectedChat?.otherUser.name?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg shadow-sm ${
                          message.senderId === user.uid
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm md:text-base">{message.text}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.senderId === user.uid && (
                            <MessageStatus 
                              status={message.status} 
                              isOwn={true}
                              isDarkBackground={true}
                            />
                          )}
                        </div>
                      </div>

                      {/* Avatar cho tin nhắn của mình (bên phải) */}
                      {message.senderId === user.uid && (
                        <div className="flex-shrink-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'You'}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs md:text-sm font-medium">
                                {(user.displayName || user.email)?.[0]?.toUpperCase() || 'Y'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Element để scroll xuống */}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-sm md:text-base">Chưa có tin nhắn nào</p>
                    <p className="text-xs md:text-sm">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
                >
                  <span className="hidden md:inline">Gửi</span>
                  <span className="md:hidden">📤</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                Chào mừng đến với Chat App
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                <span className="hidden md:inline">Chọn một cuộc trò chuyện hoặc tìm kiếm người dùng để bắt đầu chat</span>
                <span className="md:hidden">Chọn một cuộc trò chuyện để bắt đầu</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
