'use client';
import { useState, useEffect } from 'react';
import { capitalizeName } from '@/utils/stringUtils';

interface ProfileThumbnailProps {
  memberCode: string;
  memberName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  profilePicture?: string; // Direct profile picture prop
}

export default function ProfileThumbnail({
  memberCode,
  memberName,
  size = 'md',
  showName = false,
  profilePicture: directProfilePicture,
}: ProfileThumbnailProps) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (directProfilePicture) {
      // Use direct profile picture if provided
      setProfilePicture(directProfilePicture);
      setIsLoading(false);
    } else {
      // Fallback to API call if no direct picture provided
      loadProfilePicture();
    }
  }, [memberCode, directProfilePicture]);

  const loadProfilePicture = async () => {
    try {
      const response = await fetch(
        `/api/user/profile-picture?memberCode=${memberCode}`
      );
      const data = await response.json();

      if (data.ok && data.profilePicture) {
        setProfilePicture(data.profilePicture);
      }
    } catch (error) {
      console.error('Failed to load profile picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-10 h-10';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-24 h-24'; // 96px (close to 100px)
      default:
        return 'w-10 h-10';
    }
  };

  const getInitials = () => {
    const names = memberName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return memberName.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        className={`${getSizeClasses()} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}
      >
        <div className='w-4 h-4 bg-gray-300 rounded-full'></div>
      </div>
    );
  }

  return (
    <div className='flex items-center space-x-2'>
      <div
        className={`${getSizeClasses()} rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center`}
      >
        {profilePicture ? (
          <img
            src={profilePicture}
            alt={`${memberName} profile`}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
            <span className='text-white font-semibold text-sm'>
              {getInitials()}
            </span>
          </div>
        )}
      </div>
      {showName && (
        <span className='text-sm font-medium text-gray-700'>
          {capitalizeName(memberName)}
        </span>
      )}
    </div>
  );
}
