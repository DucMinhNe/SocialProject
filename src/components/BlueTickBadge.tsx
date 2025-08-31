'use client';

interface BlueTickBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BlueTickBadge({ isVerified, size = 'sm', className = '' }: BlueTickBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <div className={`bg-blue-500 rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <svg className="text-white" fill="currentColor" viewBox="0 0 20 20" style={{ width: '70%', height: '70%' }}>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );
}
