'use client';

interface BlueTickBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
}

export default function BlueTickBadge({ isVerified, size = 'sm', className = '' }: BlueTickBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
    xxl : 'w-12 h-12'
  };

  const svgSizes = {
    sm: { width: 20, height: 20 },
    md: { width: 24, height: 24 },
    lg: { width: 28, height: 28 },
    xl: { width: 40, height: 40 },
    xxl: { width: 48, height: 48 }
  };

  return (
    <div className={`inline-flex items-center justify-center align-middle pb-1 ${sizeClasses[size]} ${className}`}>
      <svg 
        width={svgSizes[size].width} 
        height={svgSizes[size].height} 
        viewBox="98 913 14 18" 
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        style={{ verticalAlign: 'middle' }}
      >
        <path
          d="m 106.853 922.354 l -3.5 3.5 a 0.499 0.499 0 0 1 -0.706 0 l -1.5 -1.5 a 0.5 0.5 0 1 1 0.706 -0.708 l 1.147 1.147 l 3.147 -3.147 a 0.5 0.5 0 1 1 0.706 0.708 m 3.078 2.295 l -0.589 -1.149 l 0.588 -1.15 a 0.633 0.633 0 0 0 -0.219 -0.82 l -1.085 -0.7 l -0.065 -1.287 a 0.627 0.627 0 0 0 -0.6 -0.603 l -1.29 -0.066 l -0.703 -1.087 a 0.636 0.636 0 0 0 -0.82 -0.217 l -1.148 0.588 l -1.15 -0.588 a 0.631 0.631 0 0 0 -0.82 0.22 l -0.701 1.085 l -1.289 0.065 a 0.626 0.626 0 0 0 -0.6 0.6 l -0.066 1.29 l -1.088 0.702 a 0.634 0.634 0 0 0 -0.216 0.82 l 0.588 1.149 l -0.588 1.15 a 0.632 0.632 0 0 0 0.219 0.819 l 1.085 0.701 l 0.065 1.286 c 0.014 0.33 0.274 0.59 0.6 0.604 l 1.29 0.065 l 0.703 1.088 c 0.177 0.27 0.53 0.362 0.82 0.216 l 1.148 -0.588 l 1.15 0.589 a 0.629 0.629 0 0 0 0.82 -0.22 l 0.701 -1.085 l 1.286 -0.064 a 0.627 0.627 0 0 0 0.604 -0.601 l 0.065 -1.29 l 1.088 -0.703 a 0.633 0.633 0 0 0 0.216 -0.819"
          fill="#1877F2" 
        />
      </svg>
    </div>
  );
}
