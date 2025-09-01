import React, { memo } from 'react';
import { Message, User as UserType } from '@/types';
import MessageStatus from './MessageStatus';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  otherUser: UserType;
}

const MessageItem = memo(({ message, currentUserId, otherUser }: { 
  message: Message; 
  currentUserId: string; 
  otherUser: UserType;
}) => {
  const isOwn = message.senderId === currentUserId;
  
  return (
    <div key={message.id} className={`mb-4 ${isOwn ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        <p className="text-sm break-words">{message.text}</p>
        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {message.timestamp instanceof Date 
              ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          </p>
          {isOwn && (
            <MessageStatus
              status={message.status}
              isOwn={true}
              isDarkBackground={true}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const MessageList = memo(({ messages, currentUserId, otherUser }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          otherUser={otherUser}
        />
      ))}
    </>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
