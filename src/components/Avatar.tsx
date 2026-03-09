import React from 'react';
import { 
  User, Smile, Briefcase, Star, Heart, Zap, 
  Coffee, Music, Camera, Video, Monitor, 
  Code, PenTool, Layout, Box, Circle,
  CheckCircle, AlertCircle, HelpCircle,
  Sun, Moon, Cloud, Umbrella,
  Smartphone, Tablet, Laptop, Watch,
  Headphones, Speaker, Mic, Radio,
  Book, Bookmark, GraduationCap, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ICONS_MAP: Record<string, any> = {
  User, Smile, Briefcase, Star, Heart, Zap,
  Coffee, Music, Camera, Video, Monitor,
  Code, PenTool, Layout, Box, Circle,
  CheckCircle, AlertCircle, HelpCircle,
  Sun, Moon, Cloud, Umbrella,
  Smartphone, Tablet, Laptop, Watch,
  Headphones, Speaker, Mic, Radio,
  Book, Bookmark, GraduationCap, Award
};

interface AvatarProps {
  icon?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export default function Avatar({ icon, color, className, size = 'md', onClick }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-24 h-24 text-2xl'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-12 h-12'
  };

  const IconComponent = (icon && ICONS_MAP[icon]) ? ICONS_MAP[icon] : User;
  const isEmoji = icon && !ICONS_MAP[icon];

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center transition-all",
        sizeClasses[size],
        color || "bg-gray-100 text-gray-500",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {isEmoji ? (
        <span className={size === 'xl' ? 'text-4xl' : 'text-lg'}>{icon}</span>
      ) : (
        <IconComponent className={iconSizeClasses[size]} />
      )}
    </div>
  );
}
