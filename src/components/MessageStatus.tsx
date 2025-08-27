import React from 'react';

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  isDarkBackground?: boolean; // Để biết có phải background tối không
}

export default function MessageStatus({ status, isOwn, isDarkBackground = false }: MessageStatusProps) {
  if (!isOwn) {
    return null; // Không hiển thị status cho tin nhắn của người khác
  }

  const getStatusIcon = () => {
    const baseClass = isDarkBackground ? 'text-blue-200' : 'text-gray-400';
    const readClass = isDarkBackground ? 'text-white' : 'text-blue-500';
    
    switch (status) {
      case 'sent':
        return (
          <svg className={`w-3 h-3 ${baseClass}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex -space-x-1">
            <svg className={`w-3 h-3 ${baseClass}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className={`w-3 h-3 ${baseClass}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'read':
        return (
          <div className="flex -space-x-1">
            <svg className={`w-3 h-3 ${readClass}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className={`w-3 h-3 ${readClass}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center ml-2">
      {getStatusIcon()}
    </div>
  );
}
